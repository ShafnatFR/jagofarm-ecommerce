"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";
import {
  HOME_HERO_DEFAULT,
  normalizeHero,
  type HeroSetting,
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
