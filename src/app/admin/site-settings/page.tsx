import { requireAdminUser } from "@/lib/auth";
import { getHomeHero, getStoreProfile, getShippingSettings } from "@/lib/site-settings";
import { HOME_HERO_DEFAULT, STORE_PROFILE_DEFAULT, SHIPPING_SETTINGS_DEFAULT } from "@/lib/site-settings-shared";
import HeroSettingForm, { StoreProfileForm, ShippingSettingsForm } from "./hero-form";

export const metadata = { title: "Pengaturan Situs - Admin" };

export default async function SiteSettingsAdminPage() {
  await requireAdminUser();
  const [hero, storeProfile, shipping] = await Promise.all([
    getHomeHero(),
    getStoreProfile(),
    getShippingSettings(),
  ]);
  const isDefault = JSON.stringify(hero) === JSON.stringify(HOME_HERO_DEFAULT);
  const isStoreDefault =
    JSON.stringify(storeProfile) === JSON.stringify(STORE_PROFILE_DEFAULT);
  const isShippingDefault =
    JSON.stringify(shipping) === JSON.stringify(SHIPPING_SETTINGS_DEFAULT);

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

      <section className="mt-8 border border-green-200 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-green-900 mb-1">Profil Toko</h2>
        <p className="mb-4 text-sm text-green-700">
          Identitas & kontak toko: nama, tagline, email, telepon/WhatsApp, alamat, jam
          operasional, dan tautan sosial. Dipakai di footer, halaman kontak, dan halaman masuk.
        </p>
        <StoreProfileForm initial={storeProfile} isDefault={isStoreDefault} />
      </section>

      <section className="mt-8 border border-green-200 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-green-900 mb-1">Pengiriman</h2>
        <p className="mb-4 text-sm text-green-700">
          Kurir yang aktif saat checkout, kota asal gudang (city_id RajaOngkir), dan pembagi
          berat volumetrik. Dipakai halaman checkout saat menghitung ongkir. Tanpa perubahan di
          sini, nilai bawaan dari konfigurasi server tetap dipakai.
        </p>
        <ShippingSettingsForm initial={shipping} isDefault={isShippingDefault} />
      </section>
    </div>
  );
}
