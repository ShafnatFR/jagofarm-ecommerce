import { PdfBuilder } from "@/lib/pdf";
import { SITE_CONFIG } from "@/lib/constants";
import { APP_TIME_ZONE } from "@/lib/utils";

/** Data minimal yang dibutuhkan untuk membuat invoice. */
export interface InvoiceOrderItem {
  productName: string;
  variantName?: string | null;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface InvoiceData {
  orderNumber: string;
  createdAt: Date | string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  shippingAddress: string;
  shippingCourier?: string | null;
  shippingService?: string | null;
  shippingEtd?: string | null;
  items: InvoiceOrderItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  insuranceFee?: number;
  total: number;
  couponCode?: string | null;
}

function rupiah(n: number): string {
  return "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(n));
}

function tanggal(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  // Server (Vercel) = UTC; pakai WIB agar tanggal & jam invoice benar.
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE,
  }).format(date);
}

/**
 * Bangun invoice PDF (A2) dari data order. Mengembalikan Buffer PDF.
 */
export function buildInvoicePdf(order: InvoiceData): Buffer {
  const pdf = new PdfBuilder();
  const brand = SITE_CONFIG.name;

  // ── Kop ────────────────────────────────────────────────────────────────
  pdf.text(brand, { size: 22, bold: true, color: [21, 128, 61] });
  pdf.text("Invoice / Nota Pesanan", { size: 11, color: [100, 116, 139] });
  pdf.space(6);
  pdf.line();
  pdf.space(6);

  // ── Info pesanan (kiri) & status (kanan) ────────────────────────────────
  pdf.row(`No. Pesanan: ${order.orderNumber}`, `Tanggal: ${tanggal(order.createdAt)}`);
  pdf.row(
    `Status: ${order.status}`,
    `Pembayaran: ${order.paymentStatus}${
      order.paymentMethod ? ` (${order.paymentMethod})` : ""
    }`
  );
  pdf.space(8);

  // ── Alamat pengiriman ───────────────────────────────────────────────────
  pdf.text("Dikirim ke:", { size: 11, bold: true });
  pdf.text(order.customerName, { size: 11 });
  if (order.customerPhone) pdf.text(order.customerPhone, { size: 10, color: [100, 116, 139] });
  pdf.text(order.customerEmail, { size: 10, color: [100, 116, 139] });
  for (const line of order.shippingAddress.split("\n")) {
    pdf.text(line, { size: 10, color: [100, 116, 139] });
  }
  if (order.shippingCourier) {
    pdf.text(
      `Kurir: ${order.shippingCourier}${
        order.shippingService ? ` - ${order.shippingService}` : ""
      }${order.shippingEtd ? ` (${order.shippingEtd})` : ""}`,
      { size: 10, color: [100, 116, 139] }
    );
  }
  pdf.space(10);
  pdf.line();
  pdf.space(6);

  // ── Header tabel ────────────────────────────────────────────────────────
  pdf.row("Produk", "Subtotal", { size: 10, bold: true, color: [71, 85, 105] });
  pdf.space(2);

  // ── Baris item ──────────────────────────────────────────────────────────
  for (const it of order.items) {
    const name = it.variantName ? `${it.productName} (${it.variantName})` : it.productName;
    pdf.text(name, { size: 10 });
    pdf.row(
      `  ${it.quantity} x ${rupiah(it.price)}`,
      rupiah(it.subtotal),
      { size: 10, color: [100, 116, 139] }
    );
  }

  pdf.space(6);
  pdf.line();
  pdf.space(6);

  // ── Ringkasan biaya ─────────────────────────────────────────────────────
  pdf.row("Subtotal", rupiah(order.subtotal), { size: 10 });
  if (order.discount > 0) {
    pdf.row(
      `Diskon${order.couponCode ? ` (${order.couponCode})` : ""}`,
      `- ${rupiah(order.discount)}`,
      { size: 10, color: [21, 128, 61] }
    );
  }
  pdf.row("Ongkos kirim", rupiah(order.shippingCost), { size: 10 });
  if (order.insuranceFee && order.insuranceFee > 0) {
    pdf.row("Asuransi pengiriman", rupiah(order.insuranceFee), { size: 10 });
  }
  pdf.space(2);
  pdf.row("TOTAL", rupiah(order.total), { size: 13, bold: true, color: [21, 128, 61] });

  pdf.space(16);
  pdf.line();
  pdf.space(6);
  pdf.text(
    "Terima kasih telah berbelanja di " + brand + ".",
    { size: 10, color: [100, 116, 139] }
  );
  pdf.text(
    "Invoice ini dibuat otomatis dan sah tanpa tanda tangan.",
    { size: 9, color: [148, 163, 184] }
  );

  return Buffer.from(pdf.build(), "latin1");
}
