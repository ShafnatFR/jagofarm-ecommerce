import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Zona waktu resmi toko. Server (Vercel) berjalan di UTC, jadi format tanggal
 * di sisi server WAJIB menyebut timeZone ini — kalau tidak, tanggal bisa
 * berbeda satu hari dari yang dilihat pelanggan di WIB.
 */
export const APP_TIME_ZONE = "Asia/Jakarta";

/**
 * Merge class names with Tailwind CSS conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Indonesian Rupiah
 * Accepts number, string, or Prisma Decimal
 */
export function formatPrice(
  price: number | string | { toString(): string }
): string {
  const parsed =
    typeof price === "number"
      ? price
      : typeof price === "string"
        ? parseFloat(price)
        : parseFloat(price.toString());
  // Guard: nilai tak valid jangan tampil sebagai "RpNaN".
  const amount = Number.isFinite(parsed) ? parsed : 0;

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a date for Indonesian locale
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: APP_TIME_ZONE,
  }).format(d);
}

/**
 * Format a date-time for Indonesian locale
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE,
  }).format(d);
}

/**
 * Generate a unique order number: JF-YYMMDD-XXXX
 * JF = JagoFarm prefix, date portion, 4-char random hex
 */
export function generateOrderNumber(): string {
  // Bagian tanggal harus mengikuti WIB (bukan UTC server), agar nomor pesanan
  // tidak bertanggal "kemarin/besok" relatif waktu pelanggan.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `JF-${get("year")}${get("month")}${get("day")}-${rand}`;
}

/**
 * Convert a string to a URL-safe slug
 * - Lowercases, trims, replaces spaces/special chars with hyphens
 * - Collapses multiple hyphens, strips leading/trailing hyphens
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

/**
 * Calculate discount percentage between base price and discounted price
 */
export function calcDiscountPercent(
  basePrice: number | string,
  discountPrice: number | string
): number {
  const base =
    typeof basePrice === "string" ? parseFloat(basePrice) : basePrice;
  const discount =
    typeof discountPrice === "string"
      ? parseFloat(discountPrice)
      : discountPrice;
  if (base <= 0) return 0;
  return Math.round(((base - discount) / base) * 100);
}

/**
 * Get the effective price of a product (discount price if available, otherwise base price)
 */
export function getEffectivePrice(
  basePrice: number | string,
  discountPrice?: number | string | null
): number {
  const base =
    typeof basePrice === "string" ? parseFloat(basePrice) : basePrice;
  if (discountPrice == null) return base;
  const discount =
    typeof discountPrice === "string"
      ? parseFloat(discountPrice)
      : discountPrice;
  return discount > 0 && discount < base ? discount : base;
}

/**
 * Sleep utility for rate limiting or delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
