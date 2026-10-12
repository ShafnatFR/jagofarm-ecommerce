import { requireAdminUser } from "@/lib/auth";
import { getHomeHero } from "@/lib/site-settings";
import { HOME_HERO_DEFAULT } from "@/lib/site-settings-shared";
import HeroSettingForm from "./hero-form";

export const metadata = { title: "Pengaturan Situs - Admin" };

export default async function SiteSettingsAdminPage() {
  await requireAdminUser();
  const hero = await getHomeHero();
  const isDefault = JSON.stringify(hero) === JSON.stringify(HOME_HERO_DEFAULT);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-green-900">Pengaturan Situs</h1>
        <p className="mt-1 text-sm text-green-700">
          Ubah teks tampilan storefront tanpa deploy. Perubahan langsung terlihat di halaman utama.
        </p>
      </header>

      <section className="border border-green-200 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-green-900 mb-1">Hero Halaman Utama</h2>
        <p className="mb-4 text-sm text-green-700">
          Teks pembuka homepage: badge, judul, subjudul, dan dua tombol aksi.
        </p>
        <HeroSettingForm initial={hero} isDefault={isDefault} />
      </section>
    </div>
  );
}
