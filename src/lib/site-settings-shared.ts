/**
 * Tipe & default pengaturan tampilan (tanpa impor Prisma/Server) — aman
 * dipakai dari client components maupun server.
 */

export interface HeroSetting {
  eyebrow: string;
  headline: string;
  /** Bagian headline yang digarisbawahi (mis. "Lebih Terukur"). */
  headlineHighlight: string;
  subtitle: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
}

export const HOME_HERO_DEFAULT: HeroSetting = {
  eyebrow: "Set Tambak Siap Pakai & IoT Terintegrasi",
  headline: "Budi Daya Tambak",
  headlineHighlight: "Lebih Terukur",
  subtitle:
    "Set tambak lengkap — dari pompa, aerator, hingga sensor pintar kualitas air — untuk hasil panen yang lebih stabil dan menguntungkan sepanjang musim.",
  primaryCtaLabel: "Lihat Set Tambak",
  primaryCtaHref: "#produk",
  secondaryCtaLabel: "Konsultasi Gratis",
  secondaryCtaHref: "/contact",
};

const HOME_HERO_FIELDS: (keyof HeroSetting)[] = [
  "eyebrow",
  "headline",
  "headlineHighlight",
  "subtitle",
  "primaryCtaLabel",
  "primaryCtaHref",
  "secondaryCtaLabel",
  "secondaryCtaHref",
];

/** Tautan hanya boleh berupa path internal, anchor, atau http(s) — tolak skema berbahaya. */
function normalizeHref(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return fallback;
}

/** Validasi ringan: semua field wajib string non-kosong & tidak lebih dari batas wajar. */
export function normalizeHero(value: unknown): HeroSetting | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const result = { ...HOME_HERO_DEFAULT };
  for (const field of HOME_HERO_FIELDS) {
    const raw = record[field];
    if (typeof raw === "string" && raw.trim() && raw.length <= 300) {
      result[field] = raw.trim();
    } else if (raw !== undefined) {
      // Ada nilai tersimpan yang tidak valid -> pakai default untuk field itu.
      result[field] = HOME_HERO_DEFAULT[field];
    }
  }
  result.primaryCtaHref = normalizeHref(result.primaryCtaHref, HOME_HERO_DEFAULT.primaryCtaHref);
  result.secondaryCtaHref = normalizeHref(result.secondaryCtaHref, HOME_HERO_DEFAULT.secondaryCtaHref);
  return result;
}
