import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body;

    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";

    // Verify signature
    const expectedSignature = crypto
      .createHash("sha512")
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest("hex");

    if (signature_key !== expectedSignature) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }

    const order = await prisma.order.findFirst({
      where: { orderNumber: order_id },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    let orderStatus: string = order.status;
    let paymentStatus: string = order.paymentStatus;
    let paidAt: Date | undefined;

    if (
      transaction_status === "capture" ||
      transaction_status === "settlement"
    ) {
      if (fraud_status === "accept" || !fraud_status) {
        orderStatus = "paid";
        paymentStatus = "paid";
        paidAt = new Date();
      }
    } else if (transaction_status === "pending") {
      orderStatus = "pending";
      paymentStatus = "unpaid";
    } else if (
      transaction_status === "deny" ||
      transaction_status === "expire" ||
      transaction_status === "cancel"
    ) {
      orderStatus = transaction_status === "expire" ? "expired" : "cancelled";
      paymentStatus = "failed";
    } else if (transaction_status === "refund") {
      paymentStatus = "refunded";
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: orderStatus as any,
        paymentStatus: paymentStatus as any,
        paidAt,
      },
    });

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Midtrans webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
