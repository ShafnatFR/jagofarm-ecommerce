"use client";

import { useState } from "react";
import Link from "next/link";

type AddressFormValues = {
  label: string;
  recipientName: string;
  phone: string;
  detail: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
};

type Props = {
  initialValues: Partial<AddressFormValues>;
  existingCount: number;
};

export function AddressForm({ initialValues, existingCount }: Props) {
  const [values, setValues] = useState<AddressFormValues>({
    label: initialValues.label ?? "Rumah",
    recipientName: initialValues.recipientName ?? "",
    phone: initialValues.phone ?? "",
    detail: initialValues.detail ?? "",
    city: initialValues.city ?? "",
    province: initialValues.province ?? "",
    postalCode: initialValues.postalCode ?? "",
    isDefault: existingCount === 0,
  });
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mapUrl, setMapUrl] = useState<string | null>(null);

  function update<K extends keyof AddressFormValues>(key: K, value: AddressFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("Browser ini tidak mendukung GPS.");
      return;
    }

    setLocating(true);
    setLocationMessage("Mencari lokasi Anda...");
    setError("");

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const params = new URLSearchParams({ lat: String(coords.latitude), lon: String(coords.longitude) });
          const response = await fetch(`/api/geocode/reverse?${params.toString()}`, { cache: "no-store" });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Lokasi tidak dapat dibaca.");

          setValues((current) => ({
            ...current,
            label: current.label || "Rumah",
            detail: data.detail || current.detail,
            city: data.city || current.city,
            province: data.province || current.province,
            postalCode: data.postalCode || current.postalCode,
          }));
          setMapUrl(`https://www.google.com/maps?q=${encodeURIComponent(`${coords.latitude},${coords.longitude}`)}&z=17&output=embed`);
          setLocationMessage("Lokasi ditemukan. Periksa alamat sebelum menyimpan.");
        } catch (caught) {
          setLocationMessage("");
          setError(caught instanceof Error ? caught.message : "Gagal membaca alamat dari lokasi.");
        } finally {
          setLocating(false);
        }
      },
      (geoError) => {
        setLocating(false);
        setLocationMessage("");
        setError(geoError.code === geoError.PERMISSION_DENIED ? "Izin lokasi ditolak. Izinkan akses lokasi di browser lalu coba lagi." : "Lokasi tidak tersedia. Pastikan GPS aktif dan coba lagi.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, district: "" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Alamat gagal disimpan.");
      window.location.assign("/account/addresses");
    } catch (caught) {
      setSaving(false);
      setError(caught instanceof Error ? caught.message : "Alamat gagal disimpan.");
    }
  }

  const inputClass = "w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="bg-card p-6 rounded-lg border border-border space-y-4">
        <div className="flex items-center justify-between gap-3 border-b pb-2">
          <h2 className="text-lg font-semibold">Detail Alamat</h2>
          <button type="button" onClick={useCurrentLocation} disabled={locating} className="inline-flex items-center gap-2 rounded-lg border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black hover:text-white disabled:cursor-wait disabled:opacity-60">
            <span className="material-symbols-outlined text-[18px]">my_location</span>
            {locating ? "Mencari lokasi..." : "Gunakan lokasi saya"}
          </button>
        </div>

        {locationMessage && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{locationMessage}</p>}
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="label" className="block text-sm font-medium mb-1">Label Alamat <span className="text-red-500">*</span></label>
            <input type="text" id="label" value={values.label} onChange={(event) => update("label", event.target.value)} required placeholder="Contoh: Rumah, Kantor, Orang Tua" className={inputClass} />
          </div>
          <div>
            <label htmlFor="recipientName" className="block text-sm font-medium mb-1">Nama Penerima <span className="text-red-500">*</span></label>
            <input type="text" id="recipientName" value={values.recipientName} onChange={(event) => update("recipientName", event.target.value)} required className={inputClass} />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">No. Telepon <span className="text-red-500">*</span></label>
            <input type="tel" id="phone" value={values.phone} onChange={(event) => update("phone", event.target.value)} required placeholder="08xxxxxxxxxx" className={inputClass} />
          </div>
        </div>

        <div>
          <label htmlFor="detail" className="block text-sm font-medium mb-1">Alamat Lengkap <span className="text-red-500">*</span></label>
          <textarea id="detail" value={values.detail} onChange={(event) => update("detail", event.target.value)} required rows={3} placeholder="Jalan, Nomor, RT/RW, Kelurahan" className={inputClass} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="city" className="block text-sm font-medium mb-1">Kota/Kabupaten <span className="text-red-500">*</span></label>
            <input type="text" id="city" value={values.city} onChange={(event) => update("city", event.target.value)} required className={inputClass} />
          </div>
          <div>
            <label htmlFor="province" className="block text-sm font-medium mb-1">Provinsi <span className="text-red-500">*</span></label>
            <input type="text" id="province" value={values.province} onChange={(event) => update("province", event.target.value)} required className={inputClass} />
          </div>
          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium mb-1">Kode Pos <span className="text-red-500">*</span></label>
            <input type="text" id="postalCode" value={values.postalCode} onChange={(event) => update("postalCode", event.target.value)} required pattern="[0-9]{5}" className={inputClass} />
          </div>
        </div>

        <div className="rounded-lg border border-border overflow-hidden bg-slate-50">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold">Peta Lokasi</h3>
              <p className="text-xs text-muted-foreground">Gunakan lokasi saya untuk menampilkan titik GPS di Google Maps.</p>
            </div>
            {mapUrl && <a href={mapUrl.replace("&output=embed", "")} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary hover:underline">Buka Maps</a>}
          </div>
          {mapUrl ? (
            <iframe title="Peta lokasi alamat" src={mapUrl} className="h-64 w-full border-0" loading="lazy" allowFullScreen />
          ) : (
            <div className="flex h-40 items-center justify-center px-6 text-center text-sm text-muted-foreground">Peta akan muncul setelah lokasi GPS ditemukan.</div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="isDefault" checked={values.isDefault} onChange={(event) => update("isDefault", event.target.checked)} className="h-4 w-4 rounded border-input text-primary focus:ring-primary" />
          <label htmlFor="isDefault" className="text-sm">Jadikan alamat utama {existingCount === 0 && <span className="text-muted-foreground ml-1">(otomatis karena pertama)</span>}</label>
        </div>
      </div>

      <div className="flex gap-4">
        <button type="submit" disabled={saving || locating} className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-60">{saving ? "Menyimpan..." : "Simpan Alamat"}</button>
        <Link href="/account/addresses" className="flex-1 px-4 py-2 text-center text-foreground hover:text-primary border border-border rounded-lg hover:bg-muted transition-colors font-medium">Batal</Link>
      </div>
    </form>
  );
}
