import { NextRequest, NextResponse } from "next/server";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { sendEmailSafe } from "@/lib/email";
import {
  orderCancelledEmail,
  orderShippedEmail,
  toEmailOrder,
} from "@/lib/email-templates";
import { prisma } from "@/lib/prisma";

/**
 * GET   /api/admin/orders/{id}   -> detail order lengkap
 * PATCH /api/admin/orders/{id}   -> update status / resi / catatan
 *
 * `id` menerima id order (uuid) maupun orderNumber (JF-YYMMDD-XXXX).
 */

const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "expired",
] as const;

type AdminOrderStatus = (typeof ORDER_STATUSES)[number];

/** Label Indonesia untuk pesan error/validasi. */
const STATUS_LABELS: Record<AdminOrderStatus, string> = {
  pending: "Menunggu Pembayaran",
  paid: "Dibayar",
  processing: "Diproses",
  shipped: "Dikirim",
  delivered: "Selesai",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
};

/** Tangga status normal (forward only). cancelled/expired = terminal di luar tangga. */
const STATUS_LADDER: AdminOrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
];

const TERMINAL_STATUSES: AdminOrderStatus[] = ["cancelled", "expired", "delivered"];

function isOrderStatus(value: string): value is AdminOrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

/** Admin/staff guard. Mengembalikan respons 403 bila tidak berhak, null bila lolos. */
async function guardAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || (role !== "admin" && role !== "staff")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

async function loadOrder(idOrNumber: string) {
  return prisma.order.findFirst({
    where: { OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }] },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true, image: true, createdAt: true },
      },
      shippingAddress: true,
      coupon: { select: { code: true, discountType: true, discountValue: true } },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: {
                orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
                take: 3,
                select: { id: true, url: true, altText: true, isPrimary: true },
              },
            },
          },
          variant: { select: { id: true, name: true, attributes: true } },
        },
      },
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
    total: Number(order.total),
    items: order.items.map((item) => ({
      ...item,
      price: Number(item.price),
      total: Number(item.total),
      productImage: item.product?.images?.[0]?.url ?? null,
      productName: item.product?.name ?? null,
      variantName: item.variant?.name ?? null,
    })),
    coupon: order.coupon
      ? {
          code: order.coupon.code,
          discountType: order.coupon.discountType,
          discountValue: Number(order.coupon.discountValue),
        }
      : null,
    timeline: {
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
    },
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await guardAdmin();
    if (denied) return denied;

    const { id } = await params;
    const order = await loadOrder(id);

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ order: serializeOrder(order) });
  } catch (error) {
    console.error("Admin order detail GET error:", error);
    return NextResponse.json({ error: "Gagal memuat detail pesanan" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await guardAdmin();
    if (denied) return denied;

    const { id } = await params;

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Body request tidak valid" }, { status: 400 });
    }

    const existing = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: { items: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    const currentStatus = existing.status as AdminOrderStatus;

    const data: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      paidAt?: Date;
      shippedAt?: Date;
      deliveredAt?: Date;
      trackingNumber?: string;
      shippingCourier?: string;
      shippingEtd?: string;
      notes?: string | null;
    } = {};

    const now = new Date();
    let nextStatus: AdminOrderStatus | null = null;
    let touches = 0;

    // ---- status ----------------------------------------------------------
    if (body.status !== undefined) {
      const requested = String(body.status ?? "").trim().toLowerCase();

      if (!isOrderStatus(requested)) {
        return NextResponse.json(
          {
            error: `Status "${requested || "-"}" tidak valid. Status yang didukung: ${ORDER_STATUSES.join(
              ", "
            )}.`,
          },
          { status: 400 }
        );
      }

      if (requested !== currentStatus) {
        if (TERMINAL_STATUSES.includes(currentStatus)) {
          return NextResponse.json(
            {
              error: `Pesanan sudah berstatus ${STATUS_LABELS[currentStatus]} sehingga statusnya tidak dapat diubah lagi.`,
            },
            { status: 400 }
          );
        }

        if (requested === "cancelled" || requested === "expired") {
          // Batal/kedaluwarsa boleh dari status apa pun yang masih berjalan.
          nextStatus = requested;
        } else {
          const fromIndex = STATUS_LADDER.indexOf(currentStatus);
          const toIndex = STATUS_LADDER.indexOf(requested);

          if (fromIndex === -1 || toIndex === -1) {
            return NextResponse.json(
              { error: `Transisi status dari ${STATUS_LABELS[currentStatus]} ke ${STATUS_LABELS[requested]} tidak diizinkan.` },
              { status: 400 }
            );
          }

          if (toIndex < fromIndex) {
            return NextResponse.json(
              {
                error: `Status tidak dapat diturunkan dari ${STATUS_LABELS[currentStatus]} ke ${STATUS_LABELS[requested]}. Gunakan aksi pembatalan bila pesanan memang harus dibatalkan.`,
              },
              { status: 400 }
            );
          }

          if (requested === "delivered" && currentStatus !== "shipped") {
            return NextResponse.json(
              {
                error: `Pesanan harus berstatus ${STATUS_LABELS.shipped} sebelum dapat diselesaikan.`,
              },
              { status: 400 }
            );
          }

          nextStatus = requested;
        }
      }

      touches += 1;
    }

    // ---- resi (tracking number) + kurir/etd ------------------------------
    if (body.trackingNumber !== undefined) {
      const trackingNumber =
        typeof body.trackingNumber === "string" ? body.trackingNumber.trim() : "";

      if (!trackingNumber) {
        return NextResponse.json({ error: "Nomor resi tidak boleh kosong." }, { status: 400 });
      }
      if (trackingNumber.length > 100) {
        return NextResponse.json(
          { error: "Nomor resi maksimal 100 karakter." },
          { status: 400 }
        );
      }

      data.trackingNumber = trackingNumber;

      if (body.shippingCourier !== undefined) {
        const courier =
          typeof body.shippingCourier === "string" ? body.shippingCourier.trim() : "";
        if (courier.length > 20) {
          return NextResponse.json({ error: "Nama kurir maksimal 20 karakter." }, { status: 400 });
        }
        if (courier) data.shippingCourier = courier;
      }

      if (body.shippingEtd !== undefined) {
        const etd = typeof body.shippingEtd === "string" ? body.shippingEtd.trim() : "";
        if (etd.length > 20) {
          return NextResponse.json({ error: "Estimasi kirim maksimal 20 karakter." }, { status: 400 });
        }
        if (etd) data.shippingEtd = etd;
      }

      data.shippedAt = existing.shippedAt ?? now;

      // Input resi menandakan paket sudah jalan: naikkan status bila belum dikirim.
      if (
        !nextStatus &&
        (currentStatus === "pending" ||
          currentStatus === "paid" ||
          currentStatus === "processing")
      ) {
        nextStatus = "shipped";
      }

      touches += 1;
    } else {
      // Kurir/etd boleh diubah sendiri tanpa mengubah resi.
      if (body.shippingCourier !== undefined) {
        const courier =
          typeof body.shippingCourier === "string" ? body.shippingCourier.trim() : "";
        if (courier.length > 20) {
          return NextResponse.json({ error: "Nama kurir maksimal 20 karakter." }, { status: 400 });
        }
        if (courier) data.shippingCourier = courier;
        touches += 1;
      }
      if (body.shippingEtd !== undefined) {
        const etd = typeof body.shippingEtd === "string" ? body.shippingEtd.trim() : "";
        if (etd.length > 20) {
          return NextResponse.json({ error: "Estimasi kirim maksimal 20 karakter." }, { status: 400 });
        }
        if (etd) data.shippingEtd = etd;
        touches += 1;
      }
    }

    // ---- catatan internal ------------------------------------------------
    if (body.notes !== undefined) {
      const notes =
        body.notes === null ? null : typeof body.notes === "string" ? body.notes.trim() : null;
      if (notes && notes.length > 2000) {
        return NextResponse.json({ error: "Catatan maksimal 2000 karakter." }, { status: 400 });
      }
      data.notes = notes;
      touches += 1;
    }

    if (touches === 0) {
      return NextResponse.json(
        { error: "Tidak ada perubahan yang dikirim. Isi status, nomor resi, atau catatan." },
        { status: 400 }
      );
    }

    // ---- efek transisi ---------------------------------------------------
    if (nextStatus) {
      data.status = nextStatus;

      if (nextStatus === "paid") {
        data.paidAt = existing.paidAt ?? now;
        if (existing.paymentStatus === "unpaid") data.paymentStatus = "paid";
      }
      if (nextStatus === "shipped") {
        data.shippedAt = existing.shippedAt ?? now;
      }
      if (nextStatus === "delivered") {
        data.deliveredAt = existing.deliveredAt ?? now;
      }
    }

    const releasesStock =
      (nextStatus === "cancelled" || nextStatus === "expired") &&
      existing.status !== "cancelled" &&
      existing.status !== "expired";

    if (releasesStock) {
      await prisma.$transaction(async (tx) => {
        // Kembalikan stok produk/varian (pola sama dengan pembatalan oleh user).
        for (const item of existing.items) {
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

        // Kembalikan kuota pemakaian kupon.
        if (existing.couponId) {
          const coupon = await tx.coupon.findUnique({
            where: { id: existing.couponId },
            select: { usedCount: true },
          });
          if (coupon && coupon.usedCount > 0) {
            await tx.coupon.update({
              where: { id: existing.couponId },
              data: { usedCount: { decrement: 1 } },
            });
          }
        }

        await tx.order.update({ where: { id: existing.id }, data });
      });
    } else {
      await prisma.order.update({ where: { id: existing.id }, data });
    }

    const updated = await loadOrder(existing.id);
    if (!updated) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    // ── Notifikasi email (best-effort, HANYA pada transisi nyata) ──────────
    // Email tidak pernah mengubah respons: sendEmailSafe menelan semua error.
    const previousStatus = existing.status as AdminOrderStatus;
    const finalStatus = updated.status as AdminOrderStatus;
    const recipient = updated.user?.email?.trim() ?? "";

    const becameShipped =
      finalStatus === "shipped" && previousStatus !== "shipped";
    const becameCancelledOrExpired =
      (finalStatus === "cancelled" || finalStatus === "expired") &&
      previousStatus !== "cancelled" &&
      previousStatus !== "expired";

    if (recipient && (becameShipped || becameCancelledOrExpired)) {
      const emailOrder = toEmailOrder(updated, {
        customerName: updated.user?.name ?? null,
      });
      await sendEmailSafe({
        to: recipient,
        ...(becameShipped
          ? orderShippedEmail(emailOrder)
          : orderCancelledEmail(emailOrder)),
      });
    } else if (!recipient && (becameShipped || becameCancelledOrExpired)) {
      console.warn(
        `[admin/orders] Email status ${finalStatus} untuk ${updated.orderNumber} dilewati: user tidak memiliki alamat email.`
      );
    }

    return NextResponse.json(
      {
        message: `Pesanan ${updated.orderNumber} berhasil diperbarui.`,
        order: serializeOrder(updated),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin order PATCH error:", error);
    return NextResponse.json({ error: "Gagal memperbarui pesanan" }, { status: 500 });
  }
}
