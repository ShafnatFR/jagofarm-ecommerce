import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildInvoicePdf, type InvoiceData } from "@/lib/invoice";

/**
 * GET /api/orders/[orderNumber]/invoice
 *
 * Menghasilkan invoice PDF untuk pesanan milik user yang sedang login.
 * Admin boleh mengunduh invoice pesanan siapa pun.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
    }

    const { orderNumber } = await params;
    const isAdmin = session.user.role === "admin";

    const order = await prisma.order.findFirst({
      where: isAdmin ? { orderNumber } : { orderNumber, userId: session.user.id },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { name: true } },
          },
        },
        shippingAddress: true,
        coupon: { select: { code: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    const addr = order.shippingAddress;
    const shippingAddress = [
      addr?.recipientName,
      `${addr?.detail ?? ""}`.trim(),
      `${addr?.district ?? ""}, ${addr?.city ?? ""}`.trim(),
      `${addr?.province ?? ""} ${addr?.postalCode ?? ""}`.trim(),
    ]
      .filter((s) => s && s.trim().length > 0)
      .join("\n");

    const data: InvoiceData = {
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      status: String(order.status),
      paymentStatus: String(order.paymentStatus),
      paymentMethod: order.paymentMethod,
      customerName: addr?.recipientName ?? session.user.name ?? "Pelanggan",
      customerEmail: session.user.email ?? "-",
      customerPhone: addr?.phone ?? null,
      shippingAddress,
      shippingCourier: order.shippingCourier,
      shippingService: order.shippingService,
      shippingEtd: order.shippingEtd,
      items: order.items.map((it) => ({
        productName: it.product?.name ?? "Produk",
        variantName: it.variant?.name ?? null,
        quantity: it.quantity,
        price: Number(it.price),
        subtotal: Number(it.total),
      })),
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      shippingCost: Number(order.shippingCost),
      insuranceFee: Number(order.insuranceFee),
      total: Number(order.total),
      couponCode: order.coupon?.code ?? null,
    };

    const pdf = buildInvoicePdf(data);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${order.orderNumber}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[Invoice API] Error:", error);
    return NextResponse.json({ error: "Gagal membuat invoice." }, { status: 500 });
  }
}
