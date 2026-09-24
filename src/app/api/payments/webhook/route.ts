import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { sendEmailSafe } from "@/lib/email";
import { paymentReceivedEmail, toEmailOrder } from "@/lib/email-templates";
import { prisma } from "@/lib/prisma";
import {
  mapToOrderStatus,
  shouldReleaseStock,
  verifySignature,
} from "@/lib/midtrans";

/**
 * POST /api/payments/webhook
 *
 * Midtrans HTTP notification endpoint (set as "Payment Notification URL"
 * in the Midtrans dashboard). Signature is verified with verifySignature(),
 * the handler is idempotent (Midtrans retries notifications) and the state
 * machine matches GET /api/payments/status/[orderId].
 */

interface MidtransNotification {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_status?: string;
  fraud_status?: string;
  payment_type?: string;
}

export async function POST(request: NextRequest) {
  try {
    let body: MidtransNotification;
    try {
      body = (await request.json()) as MidtransNotification;
    } catch {
      return NextResponse.json(
        { error: "Payload notifikasi tidak valid" },
        { status: 400 }
      );
    }

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
    } = body;

    if (
      !order_id ||
      !status_code ||
      !gross_amount ||
      !signature_key ||
      !transaction_status
    ) {
      return NextResponse.json(
        { error: "Payload notifikasi tidak lengkap" },
        { status: 400 }
      );
    }

    // Verify signature: SHA512(order_id + status_code + gross_amount + server_key)
    if (!verifySignature(order_id, status_code, gross_amount, signature_key)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const order = await prisma.order.findFirst({
      where: { orderNumber: order_id },
      include: {
        // Nama produk/varian + kontak pemilik dipakai untuk isi email.
        items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { name: true } },
          },
        },
        user: { select: { name: true, email: true } },
        shippingAddress: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { orderStatus, paymentStatus } = mapToOrderStatus(
      transaction_status,
      fraud_status
    );

    // Idempotent: notifications are retried and may arrive out of order.
    const hasChanged =
      order.status !== orderStatus || order.paymentStatus !== paymentStatus;

    // Never downgrade an order Midtrans already settled.
    const wouldDowngrade =
      order.paymentStatus === "paid" && paymentStatus !== "paid";

    if (!hasChanged || wouldDowngrade) {
      return NextResponse.json({ status: "ok", changed: false });
    }

    const alreadyTerminal =
      order.status === "cancelled" || order.status === "expired";
    const releaseStock =
      shouldReleaseStock(transaction_status) && !alreadyTerminal;

    const data: Prisma.OrderUpdateInput = {
      status: orderStatus,
      paymentStatus,
    };

    // Transisi NYATA ke paid (bukan notifikasi Midtrans berulang untuk order
    // yang sudah paid) — dipakai sebagai pemicu email "pembayaran diterima".
    const transitionedToPaid =
      paymentStatus === "paid" && order.paymentStatus !== "paid";

    let paidAtForEmail: Date | null = order.paidAt;
    let paymentMethodForEmail: string | null = order.paymentMethod;

    if (paymentStatus === "paid") {
      if (!order.paidAt) {
        paidAtForEmail = new Date();
        data.paidAt = paidAtForEmail;
      }
      if (!order.paymentMethod && payment_type) {
        data.paymentMethod = payment_type;
        paymentMethodForEmail = payment_type;
      }
    }

    await prisma.$transaction(async (tx) => {
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

      await tx.order.update({
        where: { id: order.id },
        data,
      });
    });

    // ── Notifikasi email "pembayaran diterima" (best-effort) ───────────────
    if (transitionedToPaid) {
      const recipient = order.user?.email?.trim();
      if (recipient) {
        await sendEmailSafe({
          to: recipient,
          ...paymentReceivedEmail(
            toEmailOrder(order, {
              status: orderStatus,
              paidAt: paidAtForEmail,
              paymentMethod: paymentMethodForEmail,
              customerName: order.user?.name ?? null,
            })
          ),
        });
      } else {
        console.warn(
          `[payments/webhook] Email pembayaran ${order.orderNumber} dilewati: user tidak memiliki alamat email.`
        );
      }
    }

    return NextResponse.json({
      status: "ok",
      changed: true,
      orderStatus,
      paymentStatus,
      stockRestored: releaseStock,
    });
  } catch (error) {
    console.error("Midtrans webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
