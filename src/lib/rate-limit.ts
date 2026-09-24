/**
 * Rate limiter in-memory (sliding window) untuk route /api/*.
 *
 * Dipakai dari `src/middleware.ts` yang berjalan di Edge runtime, jadi modul ini
 * hanya boleh memakai API Web (tidak ada `fs`/`crypto` Node, tidak ada Prisma).
 *
 * Batasan yang perlu diketahui:
 * - State hidup per instance Edge: pada deployment multi-instance, limit efektif
 *   menjadi limit x jumlah instance. Untuk limit ketat lintas instance, ganti
 *   penyimpanannya ke Redis/Upstash dengan antarmuka yang sama.
 * - Tidak ada jaminan urutan atomik, tapi cukup untuk membendung brute force
 *   dan scraping ringan sesuai tabel di dokumen API Design.
 */

export interface RateLimitRule {
  /** Jumlah maksimum request dalam satu window. */
  limit: number;
  /** Panjang window dalam milidetik. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Detik sampai kuota tersedia lagi (untuk header Retry-After). */
  retryAfterSeconds: number;
  resetAt: number;
}

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

/** Bersihkan bucket lama supaya memori tidak tumbuh tanpa batas. */
const MAX_BUCKETS = 10_000;

function prune(now: number, maxWindowMs: number) {
  if (buckets.size <= MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    const last = bucket.hits[bucket.hits.length - 1] ?? 0;
    if (now - last > maxWindowMs) buckets.delete(key);
  }
  // Kalau masih penuh, buang yang paling tua (Map menjaga urutan insert).
  if (buckets.size > MAX_BUCKETS) {
    const overflow = buckets.size - MAX_BUCKETS;
    let removed = 0;
    for (const key of buckets.keys()) {
      buckets.delete(key);
      if (++removed >= overflow) break;
    }
  }
}

/**
 * Aturan per pola path. Urutan penting: pola pertama yang cocok dipakai.
 * Angka mengikuti tabel Rate Limiting di Architecture/API Design.md.
 */
export const RATE_LIMIT_RULES: Array<{ pattern: RegExp; rule: RateLimitRule }> = [
  { pattern: /^\/api\/auth\/(register|forgot-password|reset-password)$/, rule: { limit: 5, windowMs: 60_000 } },
  { pattern: /^\/api\/payments\/webhook$/, rule: { limit: 100, windowMs: 60_000 } },
  { pattern: /^\/api\/admin\//, rule: { limit: 120, windowMs: 60_000 } },
  { pattern: /^\/api\/(cart|orders)\//, rule: { limit: 60, windowMs: 60_000 } },
  { pattern: /^\/api\/(cart|orders)$/, rule: { limit: 60, windowMs: 60_000 } },
  { pattern: /^\/api\/reviews$/, rule: { limit: 30, windowMs: 60_000 } },
  { pattern: /^\/api\/products(\/|$|\?)/, rule: { limit: 120, windowMs: 60_000 } },
  { pattern: /^\/api\//, rule: { limit: 120, windowMs: 60_000 } },
];

/** Di luar produksi limit dilonggarkan agar pengembangan tidak terhambat. */
const DEV_MULTIPLIER = 10;

export function resolveRule(
  pathname: string
): { rule: RateLimitRule; pattern: string } | null {
  for (const entry of RATE_LIMIT_RULES) {
    if (entry.pattern.test(pathname)) {
      const isDev = process.env.NODE_ENV !== "production";
      return {
        rule: {
          limit: entry.rule.limit * (isDev ? DEV_MULTIPLIER : 1),
          windowMs: entry.rule.windowMs,
        },
        pattern: entry.pattern.source,
      };
    }
  }
  return null;
}

/**
 * Catat satu hit untuk `key` dan kembalikan status kuota.
 * `key` sebaiknya berisi identitas pemanggil (IP) + path agar tidak saling
 * memakan kuota antar endpoint.
 */
export function consume(key: string, rule: RateLimitRule): RateLimitResult {
  const now = Date.now();
  const windowStart = now - rule.windowMs;
  prune(now, rule.windowMs);

  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((timestamp) => timestamp > windowStart);

  const allowed = bucket.hits.length < rule.limit;
  if (allowed) bucket.hits.push(now);
  buckets.set(key, bucket);

  const oldest = bucket.hits[0] ?? now;
  const resetAt = oldest + rule.windowMs;

  return {
    allowed,
    limit: rule.limit,
    remaining: Math.max(0, rule.limit - bucket.hits.length),
    retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((resetAt - now) / 1000)),
    resetAt,
  };
}

/** Ambil IP pemanggil dari header proxy yang umum dipakai. */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

/** Hanya untuk test: kosongkan semua bucket. */
export function resetRateLimitBuckets() {
  buckets.clear();
}
