import { prisma } from "@/lib/prisma";
import {
  HOME_HERO_DEFAULT,
  normalizeHero,
  type HeroSetting,
  STORE_PROFILE_DEFAULT,
  normalizeStoreProfile,
  type StoreProfile,
  SHIPPING_SETTINGS_DEFAULT,
  normalizeShippingSettings,
  type ShippingSettings,
  SITE_CONTENT_DEFAULT,
  normalizeSiteContent,
  type SiteContent,
} from "@/lib/site-settings-shared";

/**
 * Ambil pengaturan hero homepage dari DB (tabel site_settings).
 * Selalu mengembalikan objek valid: nilai tidak valid/kosong -> default.
 */
export async function getHomeHero(): Promise<HeroSetting> {
  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: "home_hero" } });
    return normalizeHero(setting?.value) ?? HOME_HERO_DEFAULT;
  } catch {
    // DB tidak terjangkau (mis. saat build) -> tampilan default, jangan crash.
    return HOME_HERO_DEFAULT;
  }
}

/**
 * Ambil profil toko (kontak & brand) dari DB (tabel site_settings).
 * Selalu mengembalikan objek valid: nilai tidak valid/kosong -> default.
 *
 * Dibaca segar seperti getHomeHero: profil toko tampil di halaman kontak dan
 * endpoint publik /api/site-profile (yang punya cache ISR sendiri), jadi admin
 * langsung melihat hasil edit tanpa menunggu cache.
 */
export async function getStoreProfile(): Promise<StoreProfile> {
  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: "store_profile" } });
    return normalizeStoreProfile(setting?.value) ?? STORE_PROFILE_DEFAULT;
  } catch {
    // DB tidak terjangkau (mis. saat build) -> tampilan default, jangan crash.
    return STORE_PROFILE_DEFAULT;
  }
}

/**
 * Ambil pengaturan pengiriman (kurir aktif, kota asal gudang, pembagi berat
 * volumetrik) dari DB (tabel site_settings). Selalu mengembalikan objek valid:
 * nilai tidak valid/kosong -> default.
 *
 * Dibaca segar seperti getHomeHero: endpoint ongkir dipanggil setiap kali
 * checkout meminta quote, jadi admin langsung melihat hasil edit tanpa
 * menunggu cache. Tanpa baris "shipping_settings" default yang dikembalikan
 * sama dengan nilai env/konstanta yang dipakai sebelumnya, sehingga perilaku
 * checkout tidak berubah.
 */
export async function getShippingSettings(): Promise<ShippingSettings> {
  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: "shipping_settings" } });
    return normalizeShippingSettings(setting?.value) ?? SHIPPING_SETTINGS_DEFAULT;
  } catch {
    // DB tidak terjangkau (mis. saat build) -> default, jangan crash.
    return SHIPPING_SETTINGS_DEFAULT;
  }
}

/**
 * Ambil teks konten situs (marketing copy: navbar, strip keunggulan, banner CTA,
 * kartu FAQ kontak, panel halaman masuk/daftar) dari DB (tabel site_settings).
 * Selalu mengembalikan objek valid: nilai tidak valid/kosong -> default.
 *
 * Dibaca segar seperti getHomeHero supaya admin langsung melihat hasil edit.
 * Tanpa baris "site_content" default yang dikembalikan identik dengan teks
 * hardcode lama, sehingga tampilan tidak berubah.
 */
export async function getSiteContent(): Promise<SiteContent> {
  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: "site_content" } });
    return normalizeSiteContent(setting?.value) ?? SITE_CONTENT_DEFAULT;
  } catch {
    // DB tidak terjangkau (mis. saat build) -> teks default, jangan crash.
    return SITE_CONTENT_DEFAULT;
  }
}
