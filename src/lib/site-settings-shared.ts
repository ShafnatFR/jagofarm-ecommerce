/**
 * Tipe & default pengaturan tampilan (tanpa impor Prisma/Server) — aman
 * dipakai dari client components maupun server.
 */

import { SITE_CONFIG, WAREHOUSE } from "@/lib/constants";

/**
 * Daftar kurir yang boleh diaktifkan admin — sama dengan daftar yang didukung
 * integrasi pengiriman (DEFAULT_COURIERS di @/lib/shipping). Sengaja di-embed
 * sebagai string agar modul ini tetap bebas dependensi runtime.
 */
export const ALLOWED_SHIPPING_COURIERS: readonly string[] = ["jne", "pos", "tiki"];

/** Pembagi berat volumetrik (cm³/kg) — sama dengan fallback env di @/lib/shipping-quote. */
export const VOLUMETRIC_DIVISOR_FALLBACK = 5000;

/** Pembagi volumetrik bawaan: nilai env SHIPPING_VOLUMETRIC_DIVISOR bila valid. */
function defaultVolumetricDivisor(): number {
  const parsed = Number(
    process.env.SHIPPING_VOLUMETRIC_DIVISOR ?? VOLUMETRIC_DIVISOR_FALLBACK
  );
  return Number.isFinite(parsed) && parsed > 0 ? parsed : VOLUMETRIC_DIVISOR_FALLBACK;
}

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

// ── Profil Toko (kontak & brand) ────────────────────────
// Default diambil dari SITE_CONFIG supaya tampilan awal identik dengan
// hardskode lama; admin bisa menimpanya lewat Pengaturan Situs.

export interface StoreProfile {
  name: string;
  tagline: string;
  email: string;
  /** Nomor telepon untuk ditampilkan (mis. "0852-1537-6975"). */
  phone: string;
  /** Nomor WhatsApp format internasional tanpa "+" (mis. "6285215376975") — dipakai tautan wa.me & tel. */
  whatsapp: string;
  address: string;
  /** Jam operasional lengkap (mis. "Senin - Jumat: 08:00 - 17:00 WIB"). */
  hours: string;
  /** Versi pendek jam layanan untuk badge (mis. "08.00 - 17.00"). */
  hoursShort: string;
  instagram: string;
  website: string;
  /** URL embed Google Maps untuk iframe peta lokasi. */
  mapsUrl: string;
}

export const STORE_PROFILE_DEFAULT: StoreProfile = {
  name: SITE_CONFIG.name,
  tagline: SITE_CONFIG.tagline,
  email: SITE_CONFIG.email,
  phone: SITE_CONFIG.phoneDisplay,
  whatsapp: SITE_CONFIG.whatsappIntl,
  address: SITE_CONFIG.address,
  hours: SITE_CONFIG.hours,
  hoursShort: SITE_CONFIG.hoursShort,
  instagram: SITE_CONFIG.social.instagram,
  website: SITE_CONFIG.social.website,
  mapsUrl: SITE_CONFIG.mapsEmbedUrl,
};

const STORE_PROFILE_FIELDS: { key: keyof StoreProfile; maxLength: number }[] = [
  { key: "name", maxLength: 100 },
  { key: "tagline", maxLength: 200 },
  { key: "email", maxLength: 200 },
  { key: "phone", maxLength: 50 },
  { key: "whatsapp", maxLength: 30 },
  { key: "address", maxLength: 500 },
  { key: "hours", maxLength: 200 },
  { key: "hoursShort", maxLength: 50 },
  { key: "instagram", maxLength: 300 },
  { key: "website", maxLength: 300 },
  { key: "mapsUrl", maxLength: 1000 },
];

/** Nomor WhatsApp hanya boleh berisi digit — buang spasi, "+", dan tanda hubung. */
function normalizeWhatsapp(value: string, fallback: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 8 && digits.length <= 20) return digits;
  return fallback;
}

/** Email sederhana: satu "@", domain bertitik, tanpa spasi. */
function normalizeEmail(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return trimmed;
  return fallback;
}

/** URL sosial & peta hanya boleh http(s) — tolak skema berbahaya. */
function normalizeUrl(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return fallback;
}

/** Validasi ringan: semua field wajib string non-kosong & tidak lebih dari batas wajar. */
export function normalizeStoreProfile(value: unknown): StoreProfile | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const result = { ...STORE_PROFILE_DEFAULT };
  for (const { key, maxLength } of STORE_PROFILE_FIELDS) {
    const raw = record[key];
    if (typeof raw === "string" && raw.trim() && raw.length <= maxLength) {
      result[key] = raw.trim();
    } else if (raw !== undefined) {
      // Ada nilai tersimpan yang tidak valid -> pakai default untuk field itu.
      result[key] = STORE_PROFILE_DEFAULT[key];
    }
  }
  result.whatsapp = normalizeWhatsapp(result.whatsapp, STORE_PROFILE_DEFAULT.whatsapp);
  result.email = normalizeEmail(result.email, STORE_PROFILE_DEFAULT.email);
  result.instagram = normalizeUrl(result.instagram, STORE_PROFILE_DEFAULT.instagram);
  result.website = normalizeUrl(result.website, STORE_PROFILE_DEFAULT.website);
  result.mapsUrl = normalizeUrl(result.mapsUrl, STORE_PROFILE_DEFAULT.mapsUrl);
  return result;
}

// ── Pengiriman (kurir aktif, kota asal gudang, pembagi volumetrik) ──
// Default sengaja diambil dari nilai env/konstanta yang sekarang dipakai
// (DEFAULT_COURIERS, WAREHOUSE.CITY_ID, SHIPPING_VOLUMETRIC_DIVISOR) supaya
// perilaku tanpa baris DB "shipping_settings" tetap identik dengan sebelumnya.

export interface ShippingSettings {
  /** Kode kurir yang aktif di checkout (mis. ["jne","pos","tiki"]). */
  couriers: string[];
  /** city_id RajaOngkir (numerik) untuk kota asal/gudang, mis. "5099". */
  warehouseCityId: string;
  /** Pembagi berat volumetrik dalam cm³/kg, mis. 5000. */
  volumetricDivisor: number;
}

export const SHIPPING_SETTINGS_DEFAULT: ShippingSettings = {
  couriers: [...ALLOWED_SHIPPING_COURIERS],
  warehouseCityId: WAREHOUSE.CITY_ID,
  volumetricDivisor: defaultVolumetricDivisor(),
};

const SHIPPING_CITY_ID_RE = /^\d+$/;

/** city_id RajaOngkir hanya boleh berisi angka. */
function normalizeWarehouseCityId(value: unknown, fallback: string): string {
  let raw = "";
  if (typeof value === "string") {
    raw = value.trim();
  } else if (typeof value === "number" && Number.isFinite(value)) {
    raw = String(Math.trunc(value));
  }
  return SHIPPING_CITY_ID_RE.test(raw) ? raw : fallback;
}

/** Pembagi volumetrik harus berupa angka positif yang masuk akal. */
function normalizeVolumetricDivisor(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

/**
 * Validasi ringan pengaturan pengiriman. Setiap field yang tidak valid
 * kembali ke default, dan daftar kurir yang kosong/tidak dikenal juga
 * kembali ke default supaya checkout tidak pernah kehilangan kurir.
 */
export function normalizeShippingSettings(value: unknown): ShippingSettings | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;

  const couriers = Array.isArray(record.couriers)
    ? Array.from(
        new Set(
          record.couriers
            .filter((code): code is string => typeof code === "string")
            .map((code) => code.trim().toLowerCase())
            .filter((code) => ALLOWED_SHIPPING_COURIERS.includes(code))
        )
      )
    : [];

  return {
    couriers: couriers.length > 0 ? couriers : [...SHIPPING_SETTINGS_DEFAULT.couriers],
    warehouseCityId: normalizeWarehouseCityId(
      record.warehouseCityId,
      SHIPPING_SETTINGS_DEFAULT.warehouseCityId
    ),
    volumetricDivisor: normalizeVolumetricDivisor(
      record.volumetricDivisor,
      SHIPPING_SETTINGS_DEFAULT.volumetricDivisor
    ),
  };
}

// ── Teks konten situs (marketing copy) ──────────────────
// Semua teks pemasaran storefront yang dulu hardcode di JSX dikumpulkan di sini
// supaya admin bisa mengubahnya lewat Pengaturan Situs tanpa deploy.
// Default sengaja disamakan dengan teks hardcode lama agar tampilan tidak berubah.

export interface SiteContent {
  /** Tagline kecil di samping logo navbar (mis. "Agri & Aqua Tech"). */
  navBrandTagline: string;
  /** Strip pengumuman navbar (kiri, desktop). */
  navAnnouncement: string;
  /** Teks promo navbar (tengah). */
  navPromo: string;
  /** Badge dukungan navbar (kanan, mis. "Konsultasi CS 24/7"). */
  navSupportBadge: string;

  // Home — strip 4 keunggulan
  trustShippingTitle: string;
  trustShippingDesc: string;
  trustGuaranteeTitle: string;
  trustGuaranteeDesc: string;
  trustConsultTitle: string;
  trustConsultDesc: string;
  trustPaymentTitle: string;
  trustPaymentDesc: string;

  // Home — banner ajakan konsultasi
  homeCtaBadge: string;
  homeCtaTitle: string;
  homeCtaSubtitle: string;
  homeCtaPoint1: string;
  homeCtaPoint2: string;

  // Halaman kontak
  contactSubtitle: string;
  contactResponseBadge: string;
  contactFaqTitle: string;
  contactFaqSubtitle: string;
  contactFaq1Title: string;
  contactFaq1Body: string;
  contactFaq2Title: string;
  contactFaq2Body: string;
  contactFaq3Title: string;
  contactFaq3Body: string;

  // Halaman masuk & daftar (panel pemasaran)
  authBadge: string;
  authHeadline: string;
  authSubtitle: string;
  authStatusBadge: string;
  authFeature1Title: string;
  authFeature1Desc: string;
  authFeature2Title: string;
  authFeature2Desc: string;
  authReach: string;

  // CTA kecil
  cartConsultLabel: string;
  productConsultNote: string;
  /** Deskripsi banner konsultasi di halaman katalog produk. */
  productsConsultDesc: string;
  /** Tagline footer di halaman lupa password. */
  footerTagline: string;
}

export const SITE_CONTENT_DEFAULT: SiteContent = {
  navBrandTagline: "Agri & Aqua Tech",
  navAnnouncement: "Ekosistem Smart Farming Terintegrasi IoT Pertama di Indonesia",
  navPromo:
    "Promo Musim Panen: Gratis Ongkir & Diskon hingga 25% untuk Paket Tambak Baru!",
  navSupportBadge: "Konsultasi CS 24/7",

  trustShippingTitle: "Pengiriman Cepat",
  trustShippingDesc: "Kirim ke seluruh Indonesia",
  trustGuaranteeTitle: "Garansi Produk",
  trustGuaranteeDesc: "Jaminan kualitas 100% orisinil",
  trustConsultTitle: "Konsultasi Gratis",
  trustConsultDesc: "Tim ahli agronom siap bantu",
  trustPaymentTitle: "Pembayaran Aman",
  trustPaymentDesc: "QRIS, VA & E-Wallet",

  homeCtaBadge: "Pendampingan Agronomi & Desain Sistem",
  homeCtaTitle: "Butuh Konsultasi untuk Proyek Pertanian Anda?",
  homeCtaSubtitle:
    "Tim ahli JagoFarm siap membantu merancang sistem pertanian modern yang sesuai dengan kebutuhan, luas lahan, dan budget Anda.",
  homeCtaPoint1: "Respon Cepat < 15 Menit",
  homeCtaPoint2: "Gratis Sketsa Rancangan Awal",

  contactSubtitle:
    "Ada pertanyaan? Kami senang bisa membantu Anda memulai dan mengembangkan ekosistem agrikultur masa depan.",
  contactResponseBadge: "Respon Cepat",
  contactFaqTitle: "Pertanyaan yang Sering Diajukan",
  contactFaqSubtitle:
    "Dapatkan jawaban instan seputar operasional dan pengiriman JagoFarm.",
  contactFaq1Title: "Jangkauan Pengiriman",
  contactFaq1Body:
    "Kami melayani pengiriman peralatan tambak, hidroponik, & sensor IoT ke seluruh wilayah Indonesia melalui ekspedisi logistik khusus kargo terpercaya.",
  contactFaq2Title: "Garansi Bibit & Benih",
  contactFaq2Body:
    "Semua benih dan anakan ikan tersertifikasi viabilitas tinggi dengan jaminan garansi hidup saat sampai di lokasi Anda dengan protokol klaim 1x24 jam.",
  contactFaq3Title: "Konsultasi Instalasi IoT",
  contactFaq3Body:
    "Tersedia layanan survei teknis serta instalasi langsung sistem automasi hidroponik dan tambak cerdas untuk proyek skala komersial maupun rumahan.",

  authBadge: "Platform Agroteknologi Terpadu",
  authHeadline: "Solusi Pertanian & Akuakultur Modern Berbasis IoT",
  authSubtitle:
    "Kelola kolam bioflok, monitoring kualitas air, otomasi fertigasi, dan pantau hasil panen dalam satu ekosistem presisi terpercaya.",
  authStatusBadge: "IoT Sensor Aktif 24/7",
  authFeature1Title: "Monitoring Kolam",
  authFeature1Desc: "Suhu, pH, DO, & amonia terpantau otomatis",
  authFeature2Title: "Bibit & Agronomi",
  authFeature2Desc: "Jaminan bibit unggul & panduan ahli agronomi",
  authReach: "Seluruh Indonesia",

  cartConsultLabel: "Konsultasi CS 24/7",
  productConsultNote:
    "kepada tim agronom kami atau menghubungi kami via WhatsApp.",
  productsConsultDesc:
    "Tim akuakultur JagoFarm siap mendesain kolam, instalasi aerasi, atau sistem filtrasi sesuai ukuran lahan Anda.",
  footerTagline: "Solusi Pertanian & Akuakultur Modern.",
};

const SITE_CONTENT_FIELDS: (keyof SiteContent)[] = [
  "navBrandTagline",
  "navAnnouncement",
  "navPromo",
  "navSupportBadge",
  "trustShippingTitle",
  "trustShippingDesc",
  "trustGuaranteeTitle",
  "trustGuaranteeDesc",
  "trustConsultTitle",
  "trustConsultDesc",
  "trustPaymentTitle",
  "trustPaymentDesc",
  "homeCtaBadge",
  "homeCtaTitle",
  "homeCtaSubtitle",
  "homeCtaPoint1",
  "homeCtaPoint2",
  "contactSubtitle",
  "contactResponseBadge",
  "contactFaqTitle",
  "contactFaqSubtitle",
  "contactFaq1Title",
  "contactFaq1Body",
  "contactFaq2Title",
  "contactFaq2Body",
  "contactFaq3Title",
  "contactFaq3Body",
  "authBadge",
  "authHeadline",
  "authSubtitle",
  "authStatusBadge",
  "authFeature1Title",
  "authFeature1Desc",
  "authFeature2Title",
  "authFeature2Desc",
  "authReach",
  "cartConsultLabel",
  "productConsultNote",
  "productsConsultDesc",
  "footerTagline",
];

/**
 * Validasi ringan teks konten: field wajib string non-kosong & <= 500 karakter.
 * Field kosong/tidak valid jatuh kembali ke default per-field, sehingga
 * tampilan tidak pernah kosong walau data tersimpan rusak.
 */
export function normalizeSiteContent(value: unknown): SiteContent | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const result = { ...SITE_CONTENT_DEFAULT };
  for (const field of SITE_CONTENT_FIELDS) {
    const raw = record[field];
    if (typeof raw === "string" && raw.trim() && raw.length <= 500) {
      result[field] = raw.trim();
    } else if (raw !== undefined) {
      result[field] = SITE_CONTENT_DEFAULT[field];
    }
  }
  return result;
}
