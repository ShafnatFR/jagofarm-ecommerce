/**
 * Template email transaksional JagoFarm.
 *
 * - Tanpa dependensi tambahan: HTML disusun sebagai string dengan gaya inline
 *   (email client modern memblokir <style> di beberapa klien).
 * - Warna brand: hijau tua #1B4D3E. Tanpa emoji.
 * - Semua fungsi template murni: menerima data order yang sudah dinormalisasi
 *   dan mengembalikan `{ subject, html, text }` siap dipakai `sendEmail`.
 * - Tautan situs memakai NEXT_PUBLIC_SITE_URL (fallback http://localhost:3000).
 */

import { formatPrice } from "@/lib/format";
import { SHIPPING_COURIER_LABELS } from "@/lib/constants";

const BRAND_COLOR = "#1B4D3E";
const BRAND_SOFT = "#E8F1EC";
const TEXT_MUTED = "#6B7280";
const BORDER = "#E5E7EB";

const DEFAULT_SITE_URL = "http://localhost:3000";

// ── Tipe data order (sudah dinormalisasi) ────────────────────────────────────

/** Nilai uang: number, string, atau Prisma Decimal. */
export type PriceLike = number | string | { toString(): string };

export interface EmailOrderItem {
  productName: string;
  variantName?: string | null;
  quantity: number;
  price: number;
  total: number;
}

export interface EmailShippingAddress {
  recipientName?: string | null;
  phone?: string | null;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  postalCode?: string | null;
  detail?: string | null;
}

export interface EmailOrderData {
  orderNumber: string;
  status?: string | null;
  customerName?: string | null;
  items: EmailOrderItem[];
  subtotal?: number | null;
  discount?: number | null;
  shippingCost?: number | null;
  total: number;
  shippingCourier?: string | null;
  shippingService?: string | null;
  shippingEtd?: string | null;
  trackingNumber?: string | null;
  paymentMethod?: string | null;
  shippingAddress?: EmailShippingAddress | null;
  notes?: string | null;
  createdAt?: Date | string | null;
  paidAt?: Date | string | null;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// ── Normalisasi dari bentuk Prisma (include items.product/items.variant) ─────

/** Bentuk longgar yang bisa dinormalisasi dari payload Prisma order. */
export interface EmailOrderSource {
  orderNumber: string;
  status?: string | null;
  total: PriceLike;
  subtotal?: PriceLike | null;
  discount?: PriceLike | null;
  shippingCost?: PriceLike | null;
  shippingCourier?: string | null;
  shippingService?: string | null;
  shippingEtd?: string | null;
  trackingNumber?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
  createdAt?: Date | string | null;
  paidAt?: Date | string | null;
  customerName?: string | null;
  shippingAddress?: EmailShippingAddress | null;
  items?:
    | Array<{
        quantity: number;
        price: PriceLike;
        total: PriceLike;
        product?: { name?: string | null } | null;
        variant?: { name?: string | null } | null;
      }>
    | null;
}

export interface EmailOrderOverrides {
  status?: string | null;
  customerName?: string | null;
  trackingNumber?: string | null;
  shippingCourier?: string | null;
  paidAt?: Date | string | null;
  paymentMethod?: string | null;
}

/**
 * Ubah payload Prisma order menjadi {@link EmailOrderData}.
 * Nama produk diambil dari relasi `items.product.name` (OrderItem hanya
 * menyimpan id/varian/harga), dengan fallback "Produk".
 */
export function toEmailOrder(
  source: EmailOrderSource,
  overrides: EmailOrderOverrides = {}
): EmailOrderData {
  return {
    orderNumber: source.orderNumber,
    status: overrides.status ?? source.status ?? null,
    customerName: overrides.customerName ?? source.customerName ?? null,
    items: (source.items ?? []).map((item) => ({
      productName: item.product?.name?.trim() || "Produk",
      variantName: item.variant?.name?.trim() || null,
      quantity: item.quantity,
      price: toNumber(item.price),
      total: toNumber(item.total),
    })),
    subtotal: source.subtotal != null ? toNumber(source.subtotal) : null,
    discount: source.discount != null ? toNumber(source.discount) : 0,
    shippingCost: source.shippingCost != null ? toNumber(source.shippingCost) : 0,
    total: toNumber(source.total),
    shippingCourier: overrides.shippingCourier ?? source.shippingCourier ?? null,
    shippingService: source.shippingService ?? null,
    shippingEtd: source.shippingEtd ?? null,
    trackingNumber: overrides.trackingNumber ?? source.trackingNumber ?? null,
    paymentMethod: overrides.paymentMethod ?? source.paymentMethod ?? null,
    shippingAddress: source.shippingAddress ?? null,
    notes: source.notes ?? null,
    createdAt: source.createdAt ?? null,
    paidAt: overrides.paidAt ?? source.paidAt ?? null,
  };
}

// ── Helper kecil ────────────────────────────────────────────────────────────

function toNumber(value: PriceLike | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const parsed = Number.parseFloat(value.toString());
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: PriceLike | null | undefined): string {
  return formatPrice(toNumber(value));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Base URL situs; dibaca per pemanggilan supaya bisa diuji/di-set runtime. */
export function getSiteUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  return (configured || DEFAULT_SITE_URL).replace(/\/+$/, "");
}

/** Tautan ke halaman detail pesanan. */
export function getOrderUrl(orderNumber: string): string {
  return `${getSiteUrl()}/orders/${encodeURIComponent(orderNumber)}`;
}

/** Format tanggal-waktu gaya Indonesia (mis. 24 September 2026, 14:05). */
function formatDateTimeId(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Label kurir (mis. "jne" -> "JNE"); fallback: nilai apa adanya. */
export function getCourierLabel(courier: string | null | undefined): string | null {
  if (!courier) return null;
  const key = courier.trim().toLowerCase();
  if (!key) return null;
  return SHIPPING_COURIER_LABELS[key] ?? courier.trim();
}

/**
 * Halaman pelacakan resmi kurir. Halaman ini umumnya meminta nomor resi
 * dimasukkan ulang, jadi email juga selalu mencetak nomor resinya.
 */
const COURIER_TRACKING_URLS: Record<string, string> = {
  jne: "https://www.jne.co.id/id/tracking/trace",
  pos: "https://www.posindonesia.co.id/id/tracking",
  tiki: "https://www.tiki.id/id/track",
  sicepat: "https://www.sicepat.com/checkAwb",
  jnt: "https://www.jet.co.id/track",
  anteraja: "https://anteraja.id/tracking",
  ninja: "https://www.ninjaxpress.co/id-id/track",
  lion: "https://www.lionparcel.com/track-package",
  wahana: "https://www.wahana.com/tracking",
  pandu: "https://pandulogistics.co.id/",
};

export function getCourierTrackingUrl(
  courier: string | null | undefined
): string | null {
  if (!courier) return null;
  return COURIER_TRACKING_URLS[courier.trim().toLowerCase()] ?? null;
}

/** "JF-260924-AB12" -> "JF-260924-AB12" (dipakai sebagai judul blok ringkasan). */
function orderLabel(orderNumber: string): string {
  return escapeHtml(orderNumber);
}

// ── Blok HTML ───────────────────────────────────────────────────────────────

interface LayoutOptions {
  title: string;
  heading: string;
  intro?: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footnote?: string;
}

function renderLayout(options: LayoutOptions): string {
  const { title, heading, intro, bodyHtml, ctaLabel, ctaUrl, footnote } = options;

  const cta =
    ctaLabel && ctaUrl
      ? `
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
                <tr>
                  <td style="background-color:${BRAND_COLOR};border-radius:6px;">
                    <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:12px 22px;color:#FFFFFF;font-size:14px;font-weight:bold;text-decoration:none;">${escapeHtml(
                      ctaLabel
                    )}</a>
                  </td>
                </tr>
              </table>`
      : "";

  const introHtml = intro
    ? `<p style="margin:0 0 16px;font-size:14px;line-height:22px;color:#374151;">${intro}</p>`
    : "";

  const footnoteHtml = footnote
    ? `<p style="margin:20px 0 0;font-size:12px;line-height:20px;color:${TEXT_MUTED};">${footnote}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#F4F5F3;font-family:Helvetica,Arial,sans-serif;color:#1F2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F5F3;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background-color:#FFFFFF;border:1px solid ${BORDER};border-radius:8px;">
          <tr>
            <td style="background-color:${BRAND_COLOR};padding:20px 24px;border-radius:8px 8px 0 0;">
              <div style="color:#FFFFFF;font-size:20px;font-weight:bold;letter-spacing:0.5px;">JagoFarm</div>
              <div style="color:#C9E0D5;font-size:12px;margin-top:4px;">Produk pertanian segar langsung dari petani</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <h1 style="margin:0 0 12px;font-size:18px;line-height:26px;color:${BRAND_COLOR};">${escapeHtml(
    heading
  )}</h1>
              ${introHtml}
              ${bodyHtml}
              ${cta}
              ${footnoteHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 24px;border-top:1px solid ${BORDER};font-size:12px;line-height:18px;color:${TEXT_MUTED};">
              Email ini dikirim otomatis oleh JagoFarm. Jangan membalas email ini.<br />
              <a href="${escapeHtml(
                getSiteUrl()
              )}" style="color:${BRAND_COLOR};text-decoration:underline;">${escapeHtml(
    getSiteUrl()
  )}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderSummaryCard(order: EmailOrderData): string {
  const rows: Array<[string, string]> = [
    ["Nomor pesanan", orderLabel(order.orderNumber)],
    ["Status", escapeHtml(statusLabel(order.status))],
  ];
  const created = formatDateTimeId(order.createdAt);
  if (created) rows.push(["Tanggal pesanan", escapeHtml(created)]);
  if (order.paymentMethod) {
    rows.push(["Metode pembayaran", escapeHtml(order.paymentMethod)]);
  }

  const rowsHtml = rows
    .map(
      ([label, value], index) =>
        `<tr>
          <td style="padding:6px 0;font-size:13px;color:${TEXT_MUTED};${
          index < rows.length - 1 ? `border-bottom:1px solid ${BORDER};` : ""
        }">${label}</td>
          <td style="padding:6px 0;font-size:13px;color:#111827;font-weight:bold;text-align:right;${
          index < rows.length - 1 ? `border-bottom:1px solid ${BORDER};` : ""
        }">${value}</td>
        </tr>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND_SOFT};border-radius:6px;padding:4px 16px;margin:0 0 20px;">
    <tr><td style="padding:12px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${rowsHtml}
      </table>
    </td></tr>
  </table>`;
}

function renderItemsTable(order: EmailOrderData): string {
  if (order.items.length === 0) return "";

  const head = `<tr>
    <td style="padding:8px 0;border-bottom:1px solid ${BORDER};font-size:11px;letter-spacing:0.4px;color:${TEXT_MUTED};font-weight:bold;text-transform:uppercase;">Produk</td>
    <td align="center" style="padding:8px 0;border-bottom:1px solid ${BORDER};font-size:11px;letter-spacing:0.4px;color:${TEXT_MUTED};font-weight:bold;text-transform:uppercase;">Qty</td>
    <td align="right" style="padding:8px 0;border-bottom:1px solid ${BORDER};font-size:11px;letter-spacing:0.4px;color:${TEXT_MUTED};font-weight:bold;text-transform:uppercase;">Harga</td>
    <td align="right" style="padding:8px 0;border-bottom:1px solid ${BORDER};font-size:11px;letter-spacing:0.4px;color:${TEXT_MUTED};font-weight:bold;text-transform:uppercase;">Subtotal</td>
  </tr>`;

  const rows = order.items
    .map((item) => {
      const variant = item.variantName
        ? `<div style="font-size:12px;color:${TEXT_MUTED};margin-top:2px;">${escapeHtml(
            item.variantName
          )}</div>`
        : "";
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:#111827;">
          ${escapeHtml(item.productName)}${variant}
        </td>
        <td align="center" style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:#111827;">${item.quantity}</td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:#111827;">${escapeHtml(
          money(item.price)
        )}</td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:#111827;">${escapeHtml(
          money(item.total)
        )}</td>
      </tr>`;
    })
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 16px;">
  ${head}
  ${rows}
</table>`;
}

function renderTotals(order: EmailOrderData): string {
  const rows: Array<[string, string, boolean]> = [];

  const subtotal =
    order.subtotal != null
      ? order.subtotal
      : order.items.reduce((sum, item) => sum + item.total, 0);
  rows.push(["Subtotal Produk", escapeHtml(money(subtotal)), false]);

  const discount = toNumber(order.discount ?? 0);
  if (discount > 0) {
    rows.push(["Diskon", `-${escapeHtml(money(discount))}`, false]);
  }

  const shippingCost = toNumber(order.shippingCost ?? 0);
  rows.push(["Ongkos Kirim", escapeHtml(money(shippingCost)), false]);
  rows.push(["Total", escapeHtml(money(order.total)), true]);

  const rowsHtml = rows
    .map(([label, value, strong]) => {
      const inner = strong
        ? `border-top:1px solid ${BORDER};padding-top:10px;font-weight:bold;color:${BRAND_COLOR};`
        : `color:#374151;`;
      return `<tr>
        <td style="padding:6px 0;font-size:${strong ? "15px" : "14px"};${inner}">${label}</td>
        <td align="right" style="padding:6px 0;font-size:${
          strong ? "15px" : "14px"
        };${inner}">${value}</td>
      </tr>`;
    })
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 20px;">
  ${rowsHtml}
</table>`;
}

function renderShippingBlock(order: EmailOrderData): string {
  const address = order.shippingAddress;
  const courier = getCourierLabel(order.shippingCourier);
  const lines: string[] = [];

  if (address?.recipientName) {
    lines.push(
      `<div style="font-size:14px;color:#111827;font-weight:bold;">${escapeHtml(
        address.recipientName
      )}</div>`
    );
  }
  if (address?.phone) {
    lines.push(
      `<div style="font-size:13px;color:#374151;">${escapeHtml(address.phone)}</div>`
    );
  }

  const region = [address?.detail, address?.district, address?.city, address?.province, address?.postalCode]
    .map((part) => (part ?? "").trim())
    .filter((part) => part.length > 0)
    .map((part) => escapeHtml(part))
    .join(", ");
  if (region) {
    lines.push(`<div style="font-size:13px;color:#374151;line-height:20px;">${region}</div>`);
  }

  const courierLine = [courier, order.shippingService ? escapeHtml(order.shippingService) : null]
    .filter(Boolean)
    .join(" - ");
  if (courierLine) {
    const etd = order.shippingEtd
      ? ` (estimasi ${escapeHtml(order.shippingEtd)})`
      : "";
    lines.push(
      `<div style="font-size:13px;color:${TEXT_MUTED};margin-top:4px;">Pengiriman: ${courierLine}${etd}</div>`
    );
  }

  if (lines.length === 0) return "";

  return `<h2 style="margin:0 0 8px;font-size:14px;color:${BRAND_COLOR};">Alamat Pengiriman</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF9;border:1px solid ${BORDER};border-radius:6px;margin:0 0 20px;">
  <tr><td style="padding:14px 16px;">${lines.join("")}</td></tr>
</table>`;
}

function renderTrackingBlock(order: EmailOrderData): string {
  if (!order.trackingNumber) return "";

  const courier = getCourierLabel(order.shippingCourier);
  const trackingUrl = getCourierTrackingUrl(order.shippingCourier);

  const link = trackingUrl
    ? `<p style="margin:10px 0 0;font-size:13px;line-height:20px;">
        <a href="${escapeHtml(
          trackingUrl
        )}" style="color:${BRAND_COLOR};text-decoration:underline;">Lacak paket di situs ${escapeHtml(
        courier ?? "kurir"
      )}</a>
        <span style="color:${TEXT_MUTED};">(masukkan nomor resi di halaman tersebut)</span>
      </p>`
    : "";

  return `<h2 style="margin:0 0 8px;font-size:14px;color:${BRAND_COLOR};">Nomor Resi</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND_SOFT};border-radius:6px;margin:0 0 20px;">
  <tr><td style="padding:14px 16px;">
    <div style="font-size:16px;font-weight:bold;color:#111827;letter-spacing:0.5px;">${escapeHtml(
      order.trackingNumber
    )}</div>
    ${
      courier
        ? `<div style="font-size:13px;color:#374151;margin-top:4px;">Kurir: ${escapeHtml(
            courier
          )}${
            order.shippingService
              ? ` - ${escapeHtml(order.shippingService)}`
              : ""
          }</div>`
        : ""
    }
    ${link}
  </td></tr>
</table>`;
}

function renderNotes(order: EmailOrderData): string {
  if (!order.notes) return "";
  return `<h2 style="margin:0 0 8px;font-size:14px;color:${BRAND_COLOR};">Catatan Pesanan</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF9;border:1px solid ${BORDER};border-radius:6px;margin:0 0 20px;">
  <tr><td style="padding:14px 16px;font-size:13px;line-height:20px;color:#374151;">${escapeHtml(
    order.notes
  )}</td></tr>
</table>`;
}

// ── Teks polos (fallback email client tanpa HTML) ───────────────────────────

function itemsToText(order: EmailOrderData): string[] {
  return order.items.map((item) => {
    const variant = item.variantName ? ` (${item.variantName})` : "";
    return `- ${item.productName}${variant} x${item.quantity} @ ${money(
      item.price
    )} = ${money(item.total)}`;
  });
}

function totalsToText(order: EmailOrderData): string[] {
  const subtotal =
    order.subtotal != null
      ? order.subtotal
      : order.items.reduce((sum, item) => sum + item.total, 0);
  const lines = [`Subtotal Produk : ${money(subtotal)}`];
  const discount = toNumber(order.discount ?? 0);
  if (discount > 0) lines.push(`Diskon          : -${money(discount)}`);
  lines.push(`Ongkos Kirim    : ${money(order.shippingCost ?? 0)}`);
  lines.push(`Total           : ${money(order.total)}`);
  return lines;
}

function addressToText(order: EmailOrderData): string[] {
  const address = order.shippingAddress;
  if (!address) return [];
  const lines: string[] = [];
  if (address.recipientName) lines.push(address.recipientName);
  if (address.phone) lines.push(address.phone);
  const region = [
    address.detail,
    address.district,
    address.city,
    address.province,
    address.postalCode,
  ]
    .map((part) => (part ?? "").trim())
    .filter((part) => part.length > 0)
    .join(", ");
  if (region) lines.push(region);
  const courier = getCourierLabel(order.shippingCourier);
  if (courier) {
    lines.push(
      `Pengiriman: ${[courier, order.shippingService]
        .filter(Boolean)
        .join(" - ")}${order.shippingEtd ? ` (estimasi ${order.shippingEtd})` : ""}`
    );
  }
  return lines;
}

function statusLabel(status: string | null | undefined): string {
  switch (status) {
    case "pending":
      return "Menunggu Pembayaran";
    case "paid":
      return "Dibayar";
    case "processing":
      return "Diproses";
    case "shipped":
      return "Dikirim";
    case "delivered":
      return "Selesai";
    case "cancelled":
      return "Dibatalkan";
    case "expired":
      return "Kedaluwarsa";
    default:
      return status ? status : "-";
  }
}

// ── Template publik ─────────────────────────────────────────────────────────

/**
 * Email "pesanan dibuat" — rincian item, total, ongkir, dan tautan ke
 * /orders/<orderNumber>.
 */
export function orderCreatedEmail(order: EmailOrderData): EmailTemplate {
  const url = getOrderUrl(order.orderNumber);
  const greeting = order.customerName ? `Halo ${order.customerName},` : "Halo,";

  const bodyHtml = [
    renderSummaryCard(order),
    `<h2 style="margin:0 0 8px;font-size:14px;color:${BRAND_COLOR};">Rincian Pesanan</h2>`,
    renderItemsTable(order),
    renderTotals(order),
    renderShippingBlock(order),
    renderNotes(order),
  ].join("\n");

  const html = renderLayout({
    title: `Pesanan ${order.orderNumber} diterima`,
    heading: "Pesanan Anda sudah kami terima",
    intro: `${escapeHtml(
      greeting
    )} terima kasih telah berbelanja di JagoFarm. Pesanan <strong>${escapeHtml(
      order.orderNumber
    )}</strong> sudah tercatat dengan status <strong>${escapeHtml(
      statusLabel(order.status ?? "pending")
    )}</strong>.`,
    bodyHtml,
    ctaLabel: "Lihat Detail Pesanan",
    ctaUrl: url,
    footnote:
      "Selesaikan pembayaran sebelum batas waktu agar pesanan tidak dibatalkan otomatis.",
  });

  const text = [
    greeting,
    "",
    `Pesanan ${order.orderNumber} sudah kami terima.`,
    `Status: ${statusLabel(order.status ?? "pending")}`,
    "",
    "Rincian Pesanan",
    ...itemsToText(order),
    "",
    ...totalsToText(order),
    "",
    ...addressToText(order),
    "",
    `Detail pesanan: ${url}`,
    "",
    "Selesaikan pembayaran sebelum batas waktu agar pesanan tidak dibatalkan otomatis.",
    "Email ini dikirim otomatis oleh JagoFarm.",
  ].join("\n");

  return { subject: `Pesanan ${order.orderNumber} diterima - JagoFarm`, html, text };
}

/** Email "pembayaran diterima" (transisi nyata ke paid). */
export function paymentReceivedEmail(order: EmailOrderData): EmailTemplate {
  const url = getOrderUrl(order.orderNumber);
  const greeting = order.customerName ? `Halo ${order.customerName},` : "Halo,";
  const paidAt = formatDateTimeId(order.paidAt);

  const bodyHtml = [
    renderSummaryCard(order),
    `<h2 style="margin:0 0 8px;font-size:14px;color:${BRAND_COLOR};">Rincian Pembayaran</h2>`,
    renderItemsTable(order),
    renderTotals(order),
    renderShippingBlock(order),
  ].join("\n");

  const html = renderLayout({
    title: `Pembayaran pesanan ${order.orderNumber} diterima`,
    heading: "Pembayaran diterima",
    intro: `${escapeHtml(greeting)} pembayaran untuk pesanan <strong>${escapeHtml(
      order.orderNumber
    )}</strong> sudah kami terima${
      paidAt ? ` pada <strong>${escapeHtml(paidAt)}</strong>` : ""
    }. Pesanan Anda akan segera kami proses dan siapkan untuk pengiriman.`,
    bodyHtml,
    ctaLabel: "Lihat Status Pesanan",
    ctaUrl: url,
    footnote:
      "Simpan email ini sebagai bukti pembayaran. Kami akan mengirim nomor resi setelah paket dikirim.",
  });

  const text = [
    greeting,
    "",
    `Pembayaran untuk pesanan ${order.orderNumber} sudah kami terima${
      paidAt ? ` pada ${paidAt}` : ""
    }.`,
    "",
    "Rincian Pembayaran",
    ...itemsToText(order),
    "",
    ...totalsToText(order),
    "",
    `Detail pesanan: ${url}`,
    "",
    "Kami akan mengirim nomor resi setelah paket dikirim.",
    "Email ini dikirim otomatis oleh JagoFarm.",
  ].join("\n");

  return {
    subject: `Pembayaran pesanan ${order.orderNumber} diterima - JagoFarm`,
    html,
    text,
  };
}

/** Email "pesanan dikirim" — menyertakan kurir, nomor resi, dan tautan lacak. */
export function orderShippedEmail(order: EmailOrderData): EmailTemplate {
  const url = getOrderUrl(order.orderNumber);
  const greeting = order.customerName ? `Halo ${order.customerName},` : "Halo,";
  const courier = getCourierLabel(order.shippingCourier);

  const bodyHtml = [
    renderSummaryCard(order),
    renderTrackingBlock(order),
    renderShippingBlock(order),
    `<p style="margin:0;font-size:13px;line-height:20px;color:#374151;">Detail pesanan: <a href="${escapeHtml(
      url
    )}" style="color:${BRAND_COLOR};text-decoration:underline;">${escapeHtml(url)}</a></p>`,
  ].join("\n");

  const courierText = courier ? ` melalui ${courier}` : "";
  const trackingUrl = getCourierTrackingUrl(order.shippingCourier);
  const trackingText = order.trackingNumber
    ? `Nomor resi: ${order.trackingNumber}`
    : "Nomor resi akan diinformasikan menyusul.";

  const html = renderLayout({
    title: `Pesanan ${order.orderNumber} dikirim`,
    heading: "Pesanan Anda sudah dikirim",
    intro: `${escapeHtml(
      greeting
    )} pesanan <strong>${escapeHtml(
      order.orderNumber
    )}</strong> sudah kami kirim${escapeHtml(courierText)}.`,
    bodyHtml,
    ctaLabel: "Lacak Pesanan",
    ctaUrl: trackingUrl ?? url,
    footnote:
      "Halaman pelacakan kurir biasanya meminta nomor resi dimasukkan ulang. Simpan nomor resi di atas.",
  });

  const text = [
    greeting,
    "",
    `Pesanan ${order.orderNumber} sudah kami kirim${courierText}.`,
    trackingText,
    ...addressToText(order).filter((line) => line.startsWith("Pengiriman:")),
    trackingUrl ? `Lacak paket: ${trackingUrl}` : null,
    `Detail pesanan: ${url}`,
    "",
    "Halaman pelacakan kurir biasanya meminta nomor resi dimasukkan ulang.",
    "Email ini dikirim otomatis oleh JagoFarm.",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  return {
    subject: `Pesanan ${order.orderNumber} dikirim - JagoFarm`,
    html,
    text,
  };
}

/**
 * Email pembatalan/kedaluwarsa. Status order menentukan judul:
 * "expired" -> kedaluwarsa, selain itu -> dibatalkan.
 */
export function orderCancelledEmail(order: EmailOrderData): EmailTemplate {
  const expired = order.status === "expired";
  const stateLabel = expired ? "kedaluwarsa" : "dibatalkan";
  const url = getOrderUrl(order.orderNumber);
  const greeting = order.customerName ? `Halo ${order.customerName},` : "Halo,";

  const reasonText = expired
    ? "Pesanan melewati batas waktu pembayaran sehingga dibatalkan otomatis oleh sistem."
    : "Pesanan dibatalkan sehingga tidak akan diproses lebih lanjut.";

  const bodyHtml = [
    renderSummaryCard(order),
    `<p style="margin:0 0 16px;font-size:14px;line-height:22px;color:#374151;">${escapeHtml(
      reasonText
    )}</p>`,
    `<h2 style="margin:0 0 8px;font-size:14px;color:${BRAND_COLOR};">Rincian Pesanan</h2>`,
    renderItemsTable(order),
    renderTotals(order),
    order.notes ? renderNotes(order) : "",
  ]
    .filter(Boolean)
    .join("\n");

  const html = renderLayout({
    title: `Pesanan ${order.orderNumber} ${stateLabel}`,
    heading: `Pesanan ${stateLabel}`,
    intro: `${escapeHtml(greeting)} pesanan <strong>${escapeHtml(
      order.orderNumber
    )}</strong> telah <strong>${escapeHtml(stateLabel)}</strong>.`,
    bodyHtml,
    ctaLabel: "Lihat Detail Pesanan",
    ctaUrl: url,
    footnote:
      "Jika Anda sudah melakukan pembayaran, hubungi kami melalui halaman kontak agar dapat kami tindak lanjuti.",
  });

  const text = [
    greeting,
    "",
    `Pesanan ${order.orderNumber} telah ${stateLabel}.`,
    reasonText,
    "",
    "Rincian Pesanan",
    ...itemsToText(order),
    "",
    ...totalsToText(order),
    "",
    `Detail pesanan: ${url}`,
    "",
    "Jika Anda sudah melakukan pembayaran, hubungi kami melalui halaman kontak.",
    "Email ini dikirim otomatis oleh JagoFarm.",
  ].join("\n");

  return {
    subject: `Pesanan ${order.orderNumber} ${stateLabel} - JagoFarm`,
    html,
    text,
  };
}
