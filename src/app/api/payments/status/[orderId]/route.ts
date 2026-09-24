import { NextRequest, NextResponse } from "next/server";
import type { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { sendEmailSafe } from "@/lib/email";
import { paymentReceivedEmail, toEmailOrder } from "@/lib/email-templates";
import { prisma } from "@/lib/prisma";
import {
  getTransactionStatus,
  mapToOrderStatus,
  shouldReleaseStock,
  type MidtransTransactionStatus,
} from "@/lib/midtrans";

/**
 * GET /api/payments/status/[orderId]
 *
 * `orderId` accepts either the order number or the order UUID.
 * The signed-in user must own the order (admins/staff may check any order).
 *
 * Pulls the freshest transaction status from Midtrans, syncs the local order
 * (idempotent — only writes when something actually changed), and returns
 * `{ order, transaction, paymentInfo }`.
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
      session.user.role === "admin" || session.user.role === "staff";

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

    if (!order.midtransToken && !order.midtransOrderId) {
      return NextResponse.json(
        {
          error:
            "Pesanan ini belum memiliki transaksi Midtrans. Klik \"Bayar Sekarang\" terlebih dahulu.",
          order: serializeOrder(order),
        },
        { status: 400 }
      );
    }

    let transaction: MidtransTransactionStatus;
    try {
      transaction = await getTransactionStatus(order.orderNumber);
    } catch (error) {
      console.error("Midtrans status lookup failed:", error);
      return NextResponse.json(
        {
          error:
            "Gagal mengambil status pembayaran dari Midtrans. Coba lagi beberapa saat lagi.",
          order: serializeOrder(order),
        },
        { status: 502 }
      );
    }

    const { orderStatus, paymentStatus } = mapToOrderStatus(
      transaction.transaction_status,
      transaction.fraud_status
    );

    const hasChanged =
      order.status !== orderStatus || order.paymentStatus !== paymentStatus;

    // Never downgrade an order that Midtrans already settled.
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
      const releaseStock =
        shouldReleaseStock(transaction.transaction_status) && !alreadyTerminal;

      const data: Prisma.OrderUpdateInput = {
        status: orderStatus,
        paymentStatus,
      };

      if (paymentStatus === "paid") {
        if (!order.paidAt) data.paidAt = new Date();
        if (!order.paymentMethod && transaction.payment_type) {
          data.paymentMethod = transaction.payment_type;
        }
      }

      try {
        const updated = await prisma.$transaction(async (tx) => {
          if (releaseStock) {
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
        stockRestored = releaseStock;
      } catch (error) {
        console.error("Order status sync failed:", error);
        return NextResponse.json(
          { error: "Gagal memperbarui status pesanan" },
          { status: 500 }
        );
      }
    }

    const paymentInfo = {
      paymentType: transaction.payment_type ?? null,
      vaNumbers: transaction.va_numbers ?? [],
      permataVaNumber: transaction.permata_va_number ?? null,
      billKey: transaction.bill_key ?? null,
      billerCode: transaction.biller_code ?? null,
      store: transaction.store ?? null,
      qrString: transaction.qr_string ?? null,
      transactionTime: transaction.transaction_time ?? null,
      settlementTime: transaction.settlement_time ?? null,
      transactionId: transaction.transaction_id ?? null,
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
