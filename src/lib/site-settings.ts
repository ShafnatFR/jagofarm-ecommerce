import { prisma } from "@/lib/prisma";
import {
  HOME_HERO_DEFAULT,
  normalizeHero,
  type HeroSetting,
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
