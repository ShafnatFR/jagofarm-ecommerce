import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailSafe } from "@/lib/email";
import { orderCancelledEmail, toEmailOrder } from "@/lib/email-templates";


/**
 * Dilempar ketika pembatalan kalah balapan dengan request lain (batal user
 * kedua, atau webhook expired yang datang bersamaan). Bukan kesalahan.
 */
class OrderAlreadyCancelledError extends Error {
  constructor() {
    super("Order already cancelled by another request");
    this.name = "OrderAlreadyCancelledError";
  }
}
async function loadOrder(userId: string, orderNumber: string) {
  return prisma.order.findFirst({
    where: { orderNumber, userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              // Dipakai tombol 'Beli Lagi' di halaman detail order.
              weightGram: true,
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
          variant: { select: { id: true, name: true, attributes: true } },
        },
      },
      shippingAddress: true,
      coupon: { select: { code: true, discountType: true, discountValue: true } },
    },
  });
}

type LoadedOrder = NonNullable<Awaited<ReturnType<typeof loadOrder>>>;

function serializeOrder(order: LoadedOrder) {
  return {
    ...order,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    shippingCost: Number(order.shippingCost),
    insuranceFee: Number(order.insuranceFee),
    total: Number(order.total),
    items: order.items.map((i) => ({
      ...i,
      price: Number(i.price),
      total: Number(i.total),
    })),
    coupon: order.coupon
      ? {
          code: order.coupon.code,
          discountType: order.coupon.discountType,
          discountValue: Number(order.coupon.discountValue),
        }
      : null,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderNumber } = await params;

    const order = await loadOrder(session.user.id, orderNumber);

    if (!order) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ order: serializeOrder(order) });
  } catch (error) {
    console.error("Order detail error:", error);
    return NextResponse.json(
      { error: "Gagal memuat detail pesanan" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orders/{orderNumber}
 *
 * Body: { action: "cancel" }
 * Kontrak: tombol "Batalkan Pesanan" di halaman detail order.
 * Hanya boleh membatalkan pesanan milik sendiri, dan hanya saat
 * status "pending" + paymentStatus "unpaid".
 * Efek: status -> cancelled, stok dikembalikan, coupon.usedCount dikurangi.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderNumber } = await params;

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Body request tidak valid" },
        { status: 400 }
      );
    }

    const action = typeof body.action === "string" ? body.action.trim() : "";
    if (action !== "cancel") {
      return NextResponse.json(
        { error: `Aksi "${action || "-"}" tidak didukung` },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: { orderNumber, userId: session.user.id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    if (order.status !== "pending" || order.paymentStatus !== "unpaid") {
      return NextResponse.json(
        {
          error:
            "Pesanan tidak dapat dibatalkan karena sudah dibayar atau sedang diproses.",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Guard ATOMIK: pastikan status masih "pending" sebelum memproses pembatalan.
      // Tanpa guard ini, dua request cancel paralel (user klik tombol dua kali,
      // atau cancel user berbarengan dengan webhook expired) sama-sama lolos
      // pre-check di atas lalu mengembalikan stok dua kali. updateMany mengembalikan
      // jumlah baris yang benar-benar berubah; count 0 = request lain sudah menang.
      const claimed = await tx.order.updateMany({
        where: { id: order.id, status: "pending", paymentStatus: "unpaid" },
        data: { status: "cancelled" },
      });
      if (claimed.count === 0) {
        throw new OrderAlreadyCancelledError();
      }

      // Kembalikan stok produk/varian
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.updateMany({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        } else {
          await tx.product.updateMany({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      // Kembalikan kuota pemakaian kupon
      if (order.couponId) {
        const coupon = await tx.coupon.findUnique({
          where: { id: order.couponId },
          select: { usedCount: true },
        });
        if (coupon && coupon.usedCount > 0) {
          await tx.coupon.update({
            where: { id: order.couponId },
            data: { usedCount: { decrement: 1 } },
          });
        }
      }

      // Status sudah di-set "cancelled" oleh updateMany guard di atas.
    });

    const updated = await loadOrder(session.user.id, orderNumber);

    if (!updated) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    // ── Notifikasi email pembatalan (best-effort) ──────────────────────────
    // Order sudah benar-benar berubah menjadi cancelled di atas. sendEmailSafe
    // tidak pernah throw, dan seluruh blok ini dibungkus try/catch, sehingga
    // kegagalan email tidak mengubah respons API maupun membatalkan proses
    // pembatalan. Alamat email diambil dari sesi (fallback: tabel user).
    try {
      let recipient = session.user.email?.trim() ?? "";

      if (!recipient) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { email: true },
        });
        recipient = user?.email?.trim() ?? "";
      }

      if (recipient) {
        await sendEmailSafe({
          to: recipient,
          ...orderCancelledEmail(
            toEmailOrder(updated, {
              customerName: session.user.name ?? null,
              status: "cancelled",
            })
          ),
        });
      } else {
        console.warn(
          `[orders] Email pembatalan ${updated.orderNumber} dilewati: user tidak memiliki alamat email.`
        );
      }
    } catch (emailError) {
      console.error(
        `[orders] Gagal menyiapkan email pembatalan ${updated.orderNumber}:`,
        emailError
      );
    }

    return NextResponse.json({
      message: "Pesanan berhasil dibatalkan",
      order: serializeOrder(updated),
    });
  } catch (error) {
    if (error instanceof OrderAlreadyCancelledError) {
      // Request lain sudah memproses pembatalan. Bukan kesalahan — kembalikan
      // status sukses agar klien tidak bingung (bukan 500).
      return NextResponse.json({
        message: "Pesanan sudah dibatalkan",
      });
    }
    console.error("Order cancel error:", error);
    return NextResponse.json(
      { error: "Gagal membatalkan pesanan" },
      { status: 500 }
    );
  }
}
