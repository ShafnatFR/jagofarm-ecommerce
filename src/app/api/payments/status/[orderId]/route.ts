import { NextRequest, NextResponse } from "next/server";
import type { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { sendEmailSafe } from "@/lib/email";
import { paymentReceivedEmail, toEmailOrder } from "@/lib/email-templates";
import { prisma } from "@/lib/prisma";
import { mapToOrderStatus, shouldReleaseStock } from "@/lib/midtrans";
import { providerForOrder, type PaymentStatusResult } from "@/lib/payments";
import { asMidtransStatus } from "@/lib/payments/midtrans";

/**
 * GET /api/payments/status/[orderId]
 *
 * `orderId` accepts either the order number or the order UUID.
 * The signed-in user must own the order (admins may check any order).
 *
 * Provider-agnostic: provider diambil dari `order.paymentProvider` (fallback ke
 * provider aktif). Status diambil lewat `provider.fetchStatus()`, lalu order
 * disinkronkan dengan logika lama (idempoten: hanya menulis bila berubah,
 * mengembalikan stok saat cancelled/expired, email saat transisi nyata ke paid).
 *
 * Nama field respons TIDAK berubah — `{ order, transaction, paymentInfo,
 * statusChanged, stockRestored }` — karena halaman order memakainya.
 */

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        product: { select: { id: true; name: true; slug: true } };
        variant: { select: { id: true; name: true } };
      };
    };
    shippingAddress: true;
    user: { select: { name: true; email: true } };
  };
}>;

function serializeOrder(order: OrderWithRelations) {
  // `user` hanya dipakai internal untuk mengirim email — tidak termasuk kontrak respons.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- _user hanya dipakai untuk membuang field spread
  const { user: _user, ...orderRest } = order;
  return {
    ...orderRest,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    shippingCost: Number(order.shippingCost),
    total: Number(order.total),
    items: order.items.map((item) => ({
      ...item,
      price: Number(item.price),
      total: Number(item.total),
    })),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await params;
    const isAdmin =
      session.user.role === "admin";

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ orderNumber: orderId }, { id: orderId }],
        ...(isAdmin ? {} : { userId: session.user.id }),
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
            variant: { select: { id: true, name: true } },
          },
        },
        shippingAddress: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    const hasPaymentRef = Boolean(
      order.paymentRef ||
        order.midtransOrderId ||
        order.midtransToken ||
        order.paymentUrl
    );

    if (!hasPaymentRef) {
      return NextResponse.json(
        {
          error:
            'Pesanan ini belum memiliki transaksi pembayaran. Klik "Bayar Sekarang" terlebih dahulu.',
          order: serializeOrder(order),
        },
        { status: 400 }
      );
    }

    const provider = providerForOrder(order);
    const providerRef =
      order.paymentRef ?? order.midtransOrderId ?? order.orderNumber;

    let payment: PaymentStatusResult;
    try {
      payment = await provider.fetchStatus(providerRef);
    } catch (error) {
      console.error(`${provider.label} status lookup failed:`, error);
      return NextResponse.json(
        {
          error: `Gagal mengambil status pembayaran dari ${provider.label}. Coba lagi beberapa saat lagi.`,
          order: serializeOrder(order),
        },
        { status: 502 }
      );
    }

    // Payload mentah Midtrans (bila ada) dipertahankan supaya semantik lama
    // (mis. refund -> paymentStatus "refunded") tidak berubah.
    const midtransRaw = asMidtransStatus(payment.raw);

    let orderStatus: OrderStatus;
    let paymentStatus: PaymentStatus;
    let releaseStock: boolean;

    if (midtransRaw) {
      const mapped = mapToOrderStatus(
        midtransRaw.transaction_status,
        midtransRaw.fraud_status
      );
      orderStatus = mapped.orderStatus;
      paymentStatus = mapped.paymentStatus;
      releaseStock = shouldReleaseStock(midtransRaw.transaction_status);
    } else {
      switch (payment.status) {
        case "paid":
          orderStatus = "paid";
          paymentStatus = "paid";
          break;
        case "expired":
          orderStatus = "expired";
          paymentStatus = "failed";
          break;
        case "cancelled":
        case "failed":
          orderStatus = "cancelled";
          paymentStatus = "failed";
          break;
        default:
          orderStatus = "pending";
          paymentStatus = "unpaid";
      }
      // Stok hanya dikembalikan saat transaksi benar-benar batal/kedaluwarsa.
      releaseStock =
        payment.status === "expired" || payment.status === "cancelled";
    }

    const hasChanged =
      order.status !== orderStatus || order.paymentStatus !== paymentStatus;

    // Never downgrade an order that the gateway already settled.
    const wouldDowngrade =
      order.paymentStatus === "paid" && paymentStatus !== "paid";

    let updatedScalars: {
      status: OrderStatus;
      paymentStatus: PaymentStatus;
      paidAt: Date | null;
      paymentMethod: string | null;
      updatedAt: Date;
    } | null = null;
    let stockRestored = false;

    // Transisi NYATA ke paid: order sebelumnya belum paid, hasil sinkronisasi paid.
    // Dipakai sebagai satu-satunya pemicu email "pembayaran diterima" (idempoten).
    const transitionedToPaid =
      paymentStatus === "paid" && order.paymentStatus !== "paid";

    if (hasChanged && !wouldDowngrade) {
      const alreadyTerminal =
        order.status === "cancelled" || order.status === "expired";
      const restoreStock = releaseStock && !alreadyTerminal;

      const data: Prisma.OrderUpdateInput = {
        status: orderStatus,
        paymentStatus,
      };

      if (paymentStatus === "paid") {
        if (!order.paidAt) {
          const paidAt = payment.paidAt ?? new Date();
          data.paidAt = Number.isNaN(paidAt.getTime()) ? new Date() : paidAt;
        }
        const method = midtransRaw?.payment_type ?? payment.paymentMethod;
        if (!order.paymentMethod && method) {
          data.paymentMethod = method;
        }
        if (!order.paymentProvider) data.paymentProvider = provider.id;
        if (!order.paymentRef) data.paymentRef = payment.providerRef;
      }

      try {
        const updated = await prisma.$transaction(async (tx) => {
          if (restoreStock) {
            // Stock was reserved when the order was created (see POST /api/orders).
            for (const item of order.items) {
              if (item.variantId) {
                await tx.productVariant.update({
                  where: { id: item.variantId },
                  data: { stock: { increment: item.quantity } },
                });
              } else {
                await tx.product.update({
                  where: { id: item.productId },
                  data: { stock: { increment: item.quantity } },
                });
              }
            }
          }

          return tx.order.update({
            where: { id: order.id },
            data,
          });
        });

        updatedScalars = {
          status: updated.status,
          paymentStatus: updated.paymentStatus,
          paidAt: updated.paidAt,
          paymentMethod: updated.paymentMethod,
          updatedAt: updated.updatedAt,
        };
        stockRestored = restoreStock;
      } catch (error) {
        console.error("Order status sync failed:", error);
        return NextResponse.json(
          { error: "Gagal memperbarui status pesanan" },
          { status: 500 }
        );
      }
    }

    // ── Bentuk respons lama dipertahankan ──────────────────────────────────
    const transaction = payment.raw ?? {
      provider: payment.provider,
      providerRef: payment.providerRef,
      status: payment.status,
    };

    const paymentInfo = midtransRaw
      ? {
          paymentType: midtransRaw.payment_type ?? null,
          vaNumbers: midtransRaw.va_numbers ?? [],
          permataVaNumber: midtransRaw.permata_va_number ?? null,
          billKey: midtransRaw.bill_key ?? null,
          billerCode: midtransRaw.biller_code ?? null,
          store: midtransRaw.store ?? null,
          qrString: midtransRaw.qr_string ?? null,
          transactionTime: midtransRaw.transaction_time ?? null,
          settlementTime: midtransRaw.settlement_time ?? null,
          transactionId:
            midtransRaw.transaction_id ?? payment.providerRef ?? null,
        }
      : {
          // Gateway redirect-based (Mayar) tidak menyediakan VA/QR di status
          // transaksi: cukup metode + referensi transaksi.
          paymentType: payment.paymentMethod ?? null,
          vaNumbers: [] as { bank: string; va_number: string }[],
          permataVaNumber: null,
          billKey: null,
          billerCode: null,
          store: null,
          qrString: null,
          transactionTime: null,
          settlementTime: null,
          transactionId: payment.providerRef ?? null,
        };

    const finalOrder: OrderWithRelations = updatedScalars
      ? { ...order, ...updatedScalars }
      : order;

    // ── Notifikasi email "pembayaran diterima" (best-effort, hanya transisi) ─
    if (updatedScalars && transitionedToPaid) {
      const recipient = finalOrder.user?.email?.trim();
      if (recipient) {
        await sendEmailSafe({
          to: recipient,
          ...paymentReceivedEmail(
            toEmailOrder(finalOrder, {
              customerName: finalOrder.user?.name ?? null,
            })
          ),
        });
      } else {
        console.warn(
          `[payments/status] Email pembayaran ${finalOrder.orderNumber} dilewati: user tidak memiliki alamat email.`
        );
      }
    }

    return NextResponse.json({
      order: serializeOrder(finalOrder),
      transaction,
      paymentInfo,
      statusChanged: hasChanged && !wouldDowngrade,
      ignoredDowngrade: wouldDowngrade,
      stockRestored,
    });
  } catch (error) {
    console.error("Payment status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
