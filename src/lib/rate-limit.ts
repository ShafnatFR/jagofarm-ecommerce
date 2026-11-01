/**
 * Rate limiter in-memory (sliding window) untuk route /api/*.
 *
 * Dipakai dari `src/proxy.ts` (konvensi proxy Next.js, dulu `middleware.ts`),
 * jadi modul ini hanya boleh memakai API Web (tidak ada `fs`/`crypto` Node,
 * tidak ada Prisma).
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
  { pattern: /^\/api\/contact$/, rule: { limit: 5, windowMs: 60_000 } },
  // Tiket konsultasi tamu: pembuatan tiket dibatasi ketat (anti-spam),
  // pembacaan/pengiriman pesan lebih longgar karena dipakai polling.
  { pattern: /^\/api\/consultation\/ticket$/, rule: { limit: 5, windowMs: 60_000 } },
  { pattern: /^\/api\/consultation\/ticket\//, rule: { limit: 120, windowMs: 60_000 } },
  // Webhook: termasuk varian ber-provider (/api/payments/webhook/mayar).
  { pattern: /^\/api\/payments\/webhook(\/|$)/, rule: { limit: 100, windowMs: 60_000 } },
  { pattern: /^\/api\/admin\//, rule: { limit: 120, windowMs: 60_000 } },
  { pattern: /^\/api\/(cart|orders)\//, rule: { limit: 60, windowMs: 60_000 } },
  { pattern: /^\/api\/(cart|orders)$/, rule: { limit: 60, windowMs: 60_000 } },
  { pattern: /^\/api\/reviews$/, rule: { limit: 30, windowMs: 60_000 } },
  // Catatan: pathname di middleware TIDAK pernah memuat query string, jadi
  // alternasi `\?` sengaja tidak dipakai (dead code).
  { pattern: /^\/api\/products(\/|$)/, rule: { limit: 120, windowMs: 60_000 } },
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
 *
 * Mode Upstash (opsional): bila env UPSTASH_REDIS_REST_URL +
 * UPSTASH_REDIS_REST_TOKEN diisi, hit dicatat ke Redis lintas instance
 * (atomic INCR + EXPIRE via pipeline). Gagal Redis = fallback in-memory,
 * tidak pernah menggagalkan request.
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

/**
 * Ambil IP klien untuk rate limiting.
 *
 * PENTING (keamanan): JANGAN pakai elemen KIRI `x-forwarded-for` — nilai kiri
 * adalah yang dikirim klien sendiri, jadi bisa dipalsukan (rate limit jadi
 * bisa dilewati). Header `x-real-ip` / `cf-connecting-ip` diset oleh platform
 * (Vercel/Cloudflare) dan tidak bisa di-set klien. Bila terpaksa memakai
 * `x-forwarded-for`, pakai elemen KANAN (ditambahkan oleh proxy terakhir).
 */
export function getClientIp(headers: Headers): string {
  const real = headers.get("x-real-ip") || headers.get("cf-connecting-ip");
  if (real) return real.trim();

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }

  return "unknown";
}

/** Hanya untuk test: kosongkan semua bucket. */
export function resetRateLimitBuckets() {
  buckets.clear();
}

/**
 * Varian async dengan backend Upstash bila dikonfigurasi.
 * Tanpa env Upstash = sama dengan consume() in-memory.
 */
export async function consumeAsync(key: string, rule: RateLimitRule): Promise<RateLimitResult> {
  const url = (process.env.UPSTASH_REDIS_REST_URL ?? "").trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN ?? "").trim();
  if (!url || !token) return consume(key, rule);
  try {
    const windowS = Math.max(1, Math.ceil(rule.windowMs / 1000));
    const rkey = `rl:${key}`;
    const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([["INCR", rkey], ["EXPIRE", rkey, windowS, "NX"], ["TTL", rkey]]),
    });
    if (!res.ok) return consume(key, rule);
    const data = (await res.json()) as Array<{ result: number }>;
    const count = Number(data?.[0]?.result ?? 1);
    const ttl = Number(data?.[2]?.result ?? windowS);
    const allowed = count <= rule.limit;
    const now = Date.now();
    return {
      allowed,
      limit: rule.limit,
      remaining: Math.max(0, rule.limit - count),
      retryAfterSeconds: allowed ? 0 : Math.max(1, ttl),
      resetAt: now + Math.max(1, ttl) * 1000,
    };
  } catch {
    return consume(key, rule);
  }
}
