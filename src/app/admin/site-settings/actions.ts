"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";
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
} from "@/lib/site-settings-shared";

export async function updateHomeHero(input: HeroSetting) {
  await requireAdminUser();
  const normalized = normalizeHero(input);
  if (!normalized) throw new Error("Data hero tidak valid.");

  // Semua field berupa string -> objek plain agar sesuai tipe Json Prisma.
  const payload: Record<string, string> = { ...normalized };

  await prisma.siteSetting.upsert({
    where: { key: "home_hero" },
    update: { value: payload },
    create: { key: "home_hero", value: payload },
  });

  revalidatePath("/");
  revalidatePath("/admin/site-settings");
  return normalized;
}

/** Kembalikan ke default bawaan (hapus override di DB). */
export async function resetHomeHero() {
  await requireAdminUser();
  await prisma.siteSetting.deleteMany({ where: { key: "home_hero" } });
  revalidatePath("/");
  revalidatePath("/admin/site-settings");
  return HOME_HERO_DEFAULT;
}

export async function updateStoreProfile(input: StoreProfile) {
  await requireAdminUser();
  const normalized = normalizeStoreProfile(input);
  if (!normalized) throw new Error("Data profil toko tidak valid.");

  // Semua field berupa string -> objek plain agar sesuai tipe Json Prisma.
  const payload: Record<string, string> = { ...normalized };

  await prisma.siteSetting.upsert({
    where: { key: "store_profile" },
    update: { value: payload },
    create: { key: "store_profile", value: payload },
  });

  // Semua halaman yang memakai root layout (footer/JSON-LD) di-render ulang,
  // dan cache endpoint publik untuk komponen klien dibuang.
  revalidatePath("/", "layout");
  revalidatePath("/api/site-profile");
  revalidatePath("/admin/site-settings");
  return normalized;
}

/** Kembalikan ke default bawaan (hapus override di DB). */
export async function resetStoreProfile() {
  await requireAdminUser();
  await prisma.siteSetting.deleteMany({ where: { key: "store_profile" } });

  revalidatePath("/", "layout");
  revalidatePath("/api/site-profile");
  revalidatePath("/admin/site-settings");
  return STORE_PROFILE_DEFAULT;
}

export async function updateShippingSettings(input: ShippingSettings) {
  await requireAdminUser();
  const normalized = normalizeShippingSettings(input);
  if (!normalized) throw new Error("Data pengiriman tidak valid.");

  // Field bertipe primitif/array of string -> objek plain sesuai tipe Json Prisma.
  const payload = {
    couriers: normalized.couriers,
    warehouseCityId: normalized.warehouseCityId,
    volumetricDivisor: normalized.volumetricDivisor,
  };

  await prisma.siteSetting.upsert({
    where: { key: "shipping_settings" },
    update: { value: payload },
    create: { key: "shipping_settings", value: payload },
  });

  // Halaman checkout & endpoint quote ongkir dibaca ulang; tanpa baris DB
  // perilaku identik dengan default env/konstanta sebelumnya.
  revalidatePath("/checkout");
  revalidatePath("/api/shipping/cost");
  revalidatePath("/admin/site-settings");
  return normalized;
}

/** Kembalikan ke default bawaan (hapus override di DB). */
export async function resetShippingSettings() {
  await requireAdminUser();
  await prisma.siteSetting.deleteMany({ where: { key: "shipping_settings" } });

  revalidatePath("/checkout");
  revalidatePath("/api/shipping/cost");
  revalidatePath("/admin/site-settings");
  return SHIPPING_SETTINGS_DEFAULT;
}
