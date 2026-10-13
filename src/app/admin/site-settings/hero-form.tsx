"use client";

import { useState, useTransition } from "react";
import { updateHomeHero, resetHomeHero, updateStoreProfile, resetStoreProfile, updateShippingSettings, resetShippingSettings, updateSiteContent, resetSiteContent } from "./actions";
import {
  HOME_HERO_DEFAULT,
  STORE_PROFILE_DEFAULT,
  ALLOWED_SHIPPING_COURIERS,
  SITE_CONTENT_DEFAULT,
  type HeroSetting,
  type StoreProfile,
  type ShippingSettings,
  type SiteContent,
} from "@/lib/site-settings-shared";
import { SHIPPING_COURIER_LABELS } from "@/lib/constants";

interface Props {
  initial: HeroSetting;
  /** True bila nilai di layar masih default (belum ada override di DB). */
  isDefault: boolean;
}

interface StoreProfileFormProps {
  initial: StoreProfile;
  /** True bila nilai di layar masih default (belum ada override di DB). */
  isDefault: boolean;
}

interface ShippingSettingsFormProps {
  initial: ShippingSettings;
  /** True bila nilai di layar masih default (belum ada override di DB). */
  isDefault: boolean;
}

const FIELDS: { key: keyof HeroSetting; label: string; hint?: string; multiline?: boolean }[] = [
  { key: "eyebrow", label: "Eyebrow (badge kecil di atas judul)" },
  { key: "headline", label: "Judul Utama" },
  { key: "headlineHighlight", label: "Bagian Judul yang Digarisbawahi" },
  { key: "subtitle", label: "Subjudul", multiline: true },
  { key: "primaryCtaLabel", label: "Label Tombol Utama" },
  { key: "primaryCtaHref", label: "Tautan Tombol Utama", hint: "Mis. #produk atau /products" },
  { key: "secondaryCtaLabel", label: "Label Tombol Kedua" },
  { key: "secondaryCtaHref", label: "Tautan Tombol Kedua", hint: "Mis. /contact" },
];

export default function HeroSettingForm({ initial, isDefault }: Props) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<HeroSetting>(initial);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function setField(key: keyof HeroSetting, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        await updateHomeHero(form);
        setSuccess("Hero homepage berhasil diperbarui.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      }
    });
  }

  function handleReset() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const defaults = await resetHomeHero();
        setForm(defaults);
        setSuccess("Kembali ke teks default.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      }
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            isDefault ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-800"
          }`}
        >
          {isDefault ? "Menggunakan teks default" : "Teks kustom aktif"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.key} className={field.multiline ? "sm:col-span-2" : ""}>
            <label className="block text-sm font-medium text-green-900 mb-1">
              {field.label}
            </label>
            {field.multiline ? (
              <textarea
                value={form[field.key]}
                onChange={(e) => setField(field.key, e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-green-200 px-3 py-2 text-sm text-green-900 focus:border-green-600 focus:outline-none"
              />
            ) : (
              <input
                type="text"
                value={form[field.key]}
                onChange={(e) => setField(field.key, e.target.value)}
                maxLength={300}
                className="w-full rounded-lg border border-green-200 px-3 py-2 text-sm text-green-900 focus:border-green-600 focus:outline-none"
              />
            )}
            {field.hint && <p className="mt-1 text-xs text-green-600">{field.hint}</p>}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-50"
        >
          {isPending ? "Menyimpan..." : "Simpan Hero"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={isPending}
          className="rounded-lg border border-green-300 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-50 disabled:opacity-50"
        >
          Kembalikan ke Default
        </button>
      </div>

      <p className="text-xs text-green-600">
        Default saat ini: &ldquo;{HOME_HERO_DEFAULT.headline} {HOME_HERO_DEFAULT.headlineHighlight}&rdquo;
      </p>
    </form>
  );
}

const STORE_FIELDS: {
  key: keyof StoreProfile;
  label: string;
  hint?: string;
  multiline?: boolean;
  maxLength?: number;
}[] = [
  { key: "name", label: "Nama Toko" },
  { key: "tagline", label: "Tagline" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Nomor Telepon (tampilan)", hint: "Mis. 0852-1537-6975" },
  {
    key: "whatsapp",
    label: "Nomor WhatsApp (internasional)",
    hint: "Mis. 6285215376975 — dipakai untuk tautan wa.me & telepon",
  },
  { key: "address", label: "Alamat", multiline: true, maxLength: 500 },
  { key: "hours", label: "Jam Operasional", hint: "Mis. Senin - Jumat: 08:00 - 17:00 WIB" },
  {
    key: "hoursShort",
    label: "Jam Layanan (versi pendek)",
    hint: "Mis. 08.00 - 17.00 — dipakai badge halaman masuk",
  },
  { key: "instagram", label: "Tautan Instagram", hint: "URL lengkap, mis. https://www.instagram.com/..." },
  { key: "website", label: "Tautan Website", hint: "URL lengkap, mis. https://..." },
  {
    key: "mapsUrl",
    label: "URL Embed Google Maps",
    multiline: true,
    maxLength: 1000,
    hint: "URL embed dari Google Maps (Share > Embed a map)",
  },
];

export function StoreProfileForm({ initial, isDefault }: StoreProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<StoreProfile>(initial);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function setField(key: keyof StoreProfile, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        await updateStoreProfile(form);
        setSuccess("Profil toko berhasil diperbarui.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      }
    });
  }

  function handleReset() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const defaults = await resetStoreProfile();
        setForm(defaults);
        setSuccess("Kembali ke data default.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      }
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            isDefault ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-800"
          }`}
        >
          {isDefault ? "Menggunakan data default" : "Data kustom aktif"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {STORE_FIELDS.map((field) => (
          <div key={field.key} className={field.multiline ? "sm:col-span-2" : ""}>
            <label className="block text-sm font-medium text-green-900 mb-1">
              {field.label}
            </label>
            {field.multiline ? (
              <textarea
                value={form[field.key]}
                onChange={(e) => setField(field.key, e.target.value)}
                rows={3}
                maxLength={field.maxLength ?? 300}
                className="w-full rounded-lg border border-green-200 px-3 py-2 text-sm text-green-900 focus:border-green-600 focus:outline-none"
              />
            ) : (
              <input
                type="text"
                value={form[field.key]}
                onChange={(e) => setField(field.key, e.target.value)}
                maxLength={field.maxLength ?? 300}
                className="w-full rounded-lg border border-green-200 px-3 py-2 text-sm text-green-900 focus:border-green-600 focus:outline-none"
              />
            )}
            {field.hint && <p className="mt-1 text-xs text-green-600">{field.hint}</p>}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-50"
        >
          {isPending ? "Menyimpan..." : "Simpan Profil Toko"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={isPending}
          className="rounded-lg border border-green-300 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-50 disabled:opacity-50"
        >
          Kembalikan ke Default
        </button>
      </div>

      <p className="text-xs text-green-600">
        Default saat ini: &ldquo;{STORE_PROFILE_DEFAULT.name} — {STORE_PROFILE_DEFAULT.email}&rdquo;
      </p>
    </form>
  );
}

/** RajaOngkir city_id hanya berisi angka. */
const CITY_ID_PATTERN = /^\d+$/;

export function ShippingSettingsForm({ initial, isDefault }: ShippingSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [couriers, setCouriers] = useState<string[]>(initial.couriers);
  const [warehouseCityId, setWarehouseCityId] = useState(initial.warehouseCityId);
  const [divisorInput, setDivisorInput] = useState(String(initial.volumetricDivisor));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function toggleCourier(code: string, enabled: boolean) {
    setCouriers((prev) =>
      enabled ? [...new Set([...prev, code])] : prev.filter((item) => item !== code)
    );
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cityId = warehouseCityId.trim();
    const divisor = Number(divisorInput.trim());
    if (couriers.length === 0) {
      setError("Pilih minimal satu kurir aktif.");
      return;
    }
    if (!CITY_ID_PATTERN.test(cityId)) {
      setError("Kota asal gudang harus berupa city_id RajaOngkir (angka).");
      return;
    }
    if (!Number.isFinite(divisor) || divisor <= 0) {
      setError("Pembagi berat volumetrik harus berupa angka lebih dari 0.");
      return;
    }

    startTransition(async () => {
      try {
        await updateShippingSettings({
          couriers,
          warehouseCityId: cityId,
          volumetricDivisor: divisor,
        });
        setSuccess("Pengaturan pengiriman berhasil diperbarui.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      }
    });
  }

  function handleReset() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const defaults = await resetShippingSettings();
        setCouriers(defaults.couriers);
        setWarehouseCityId(defaults.warehouseCityId);
        setDivisorInput(String(defaults.volumetricDivisor));
        setSuccess("Kembali ke data default.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      }
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            isDefault ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-800"
          }`}
        >
          {isDefault ? "Menggunakan data default" : "Data kustom aktif"}
        </span>
      </div>

      <div>
        <span className="block text-sm font-medium text-green-900 mb-1">Kurir Aktif</span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ALLOWED_SHIPPING_COURIERS.map((code) => (
            <label key={code} className="flex items-center gap-2 text-sm text-green-900">
              <input
                type="checkbox"
                checked={couriers.includes(code)}
                onChange={(e) => toggleCourier(code, e.target.checked)}
                className="h-4 w-4 rounded border-green-300 text-green-800 focus:ring-green-600"
              />
              {SHIPPING_COURIER_LABELS[code] ?? code.toUpperCase()}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-green-600">
          Kurir yang dipilih dipakai saat checkout meminta ongkir. Tanpa override, daftar
          bawaan JNE, POS Indonesia, dan TIKI yang aktif.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-green-900 mb-1">
            Kota Asal Gudang (city_id RajaOngkir)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={warehouseCityId}
            onChange={(e) => setWarehouseCityId(e.target.value)}
            maxLength={10}
            className="w-full rounded-lg border border-green-200 px-3 py-2 text-sm text-green-900 focus:border-green-600 focus:outline-none"
          />
          <p className="mt-1 text-xs text-green-600">
            Angka city_id RajaOngkir, mis. 5099 (Bandung). Cari id kota lewat endpoint
            /api/shipping/cities (mis. <code>?province=Jawa Barat&amp;q=bandung</code>) atau
            dashboard RajaOngkir.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-green-900 mb-1">
            Pembagi Berat Volumetrik
          </label>
          <input
            type="number"
            min={1}
            step={100}
            value={divisorInput}
            onChange={(e) => setDivisorInput(e.target.value)}
            className="w-full rounded-lg border border-green-200 px-3 py-2 text-sm text-green-900 focus:border-green-600 focus:outline-none"
          />
          <p className="mt-1 text-xs text-green-600">
            Pembagi cm³/kg untuk berat volumetrik (bawaan 5000). Berat volumetrik = panjang
            &times; lebar &times; tinggi (cm) &divide; pembagi.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-50"
        >
          {isPending ? "Menyimpan..." : "Simpan Pengiriman"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={isPending}
          className="rounded-lg border border-green-300 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-50 disabled:opacity-50"
        >
          Kembalikan ke Default
        </button>
      </div>
    </form>
  );
}

// ── Teks Konten Situs (marketing copy) ──────────────────

interface SiteContentFormProps {
  initial: SiteContent;
  /** True bila nilai di layar masih default (belum ada override di DB). */
  isDefault: boolean;
}

/** Field teks konten dikelompokkan per area tampilan. */
const CONTENT_GROUPS: {
  title: string;
  fields: { key: keyof SiteContent; label: string; multiline?: boolean }[];
}[] = [
  {
    title: "Navbar",
    fields: [
      { key: "navBrandTagline", label: "Tagline di samping logo" },
      { key: "navAnnouncement", label: "Teks pengumuman (kiri)" },
      { key: "navPromo", label: "Teks promo (tengah)", multiline: true },
      { key: "navSupportBadge", label: "Badge dukungan (kanan)" },
    ],
  },
  {
    title: "Homepage — Keunggulan (4 kartu)",
    fields: [
      { key: "trustShippingTitle", label: "Kartu 1 — Judul" },
      { key: "trustShippingDesc", label: "Kartu 1 — Deskripsi" },
      { key: "trustGuaranteeTitle", label: "Kartu 2 — Judul" },
      { key: "trustGuaranteeDesc", label: "Kartu 2 — Deskripsi" },
      { key: "trustConsultTitle", label: "Kartu 3 — Judul" },
      { key: "trustConsultDesc", label: "Kartu 3 — Deskripsi" },
      { key: "trustPaymentTitle", label: "Kartu 4 — Judul" },
      { key: "trustPaymentDesc", label: "Kartu 4 — Deskripsi" },
    ],
  },
  {
    title: "Homepage — Banner Konsultasi",
    fields: [
      { key: "homeCtaBadge", label: "Badge" },
      { key: "homeCtaTitle", label: "Judul" },
      { key: "homeCtaSubtitle", label: "Subjudul", multiline: true },
      { key: "homeCtaPoint1", label: "Poin 1" },
      { key: "homeCtaPoint2", label: "Poin 2" },
    ],
  },
  {
    title: "Halaman Kontak",
    fields: [
      { key: "contactSubtitle", label: "Subjudul hero", multiline: true },
      { key: "contactResponseBadge", label: "Badge respon WhatsApp" },
      { key: "contactFaqTitle", label: "FAQ — Judul seksi" },
      { key: "contactFaqSubtitle", label: "FAQ — Subjudul seksi" },
      { key: "contactFaq1Title", label: "FAQ 1 — Judul" },
      { key: "contactFaq1Body", label: "FAQ 1 — Isi", multiline: true },
      { key: "contactFaq2Title", label: "FAQ 2 — Judul" },
      { key: "contactFaq2Body", label: "FAQ 2 — Isi", multiline: true },
      { key: "contactFaq3Title", label: "FAQ 3 — Judul" },
      { key: "contactFaq3Body", label: "FAQ 3 — Isi", multiline: true },
    ],
  },
  {
    title: "Halaman Masuk & Daftar",
    fields: [
      { key: "authBadge", label: "Badge panel" },
      { key: "authHeadline", label: "Judul utama" },
      { key: "authSubtitle", label: "Subjudul", multiline: true },
      { key: "authStatusBadge", label: "Badge status (kanan atas)" },
      { key: "authFeature1Title", label: "Fitur 1 — Judul" },
      { key: "authFeature1Desc", label: "Fitur 1 — Deskripsi" },
      { key: "authFeature2Title", label: "Fitur 2 — Judul" },
      { key: "authFeature2Desc", label: "Fitur 2 — Deskripsi" },
      { key: "authReach", label: "Teks jangkauan distribusi" },
    ],
  },
  {
    title: "Teks Lain",
    fields: [
      { key: "cartConsultLabel", label: "Label konsultasi (keranjang)" },
      { key: "productConsultNote", label: "Catatan konsultasi (detail produk)", multiline: true },
      { key: "productsConsultDesc", label: "Deskripsi banner konsultasi (katalog)", multiline: true },
      { key: "footerTagline", label: "Tagline footer (lupa password)" },
    ],
  },
];

export function SiteContentForm({ initial, isDefault }: SiteContentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<SiteContent>(initial);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function setField(key: keyof SiteContent, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        await updateSiteContent(form);
        setSuccess("Teks konten situs berhasil diperbarui.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      }
    });
  }

  function handleReset() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const defaults = await resetSiteContent();
        setForm(defaults);
        setSuccess("Kembali ke teks default.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      }
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            isDefault ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-800"
          }`}
        >
          {isDefault ? "Menggunakan teks default" : "Teks kustom aktif"}
        </span>
      </div>

      {CONTENT_GROUPS.map((group) => (
        <fieldset key={group.title} className="border border-green-100 rounded-lg p-4">
          <legend className="px-2 text-sm font-semibold text-green-900">
            {group.title}
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {group.fields.map((field) => (
              <div key={field.key} className={field.multiline ? "sm:col-span-2" : ""}>
                <label className="block text-sm font-medium text-green-900 mb-1">
                  {field.label}
                </label>
                {field.multiline ? (
                  <textarea
                    value={form[field.key]}
                    onChange={(e) => setField(field.key, e.target.value)}
                    rows={2}
                    maxLength={500}
                    className="w-full rounded-lg border border-green-200 px-3 py-2 text-sm text-green-900 focus:border-green-600 focus:outline-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={form[field.key]}
                    onChange={(e) => setField(field.key, e.target.value)}
                    maxLength={500}
                    className="w-full rounded-lg border border-green-200 px-3 py-2 text-sm text-green-900 focus:border-green-600 focus:outline-none"
                  />
                )}
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-50"
        >
          {isPending ? "Menyimpan..." : "Simpan Teks Konten"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={isPending}
          className="rounded-lg border border-green-300 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-50 disabled:opacity-50"
        >
          Kembalikan ke Default
        </button>
      </div>

      <p className="text-xs text-green-600">
        Default saat ini: &ldquo;{SITE_CONTENT_DEFAULT.navPromo}&rdquo;
      </p>
    </form>
  );
}
