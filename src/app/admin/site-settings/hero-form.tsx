"use client";

import { useState, useTransition } from "react";
import { updateHomeHero, resetHomeHero } from "./actions";
import { HOME_HERO_DEFAULT, type HeroSetting } from "@/lib/site-settings-shared";

interface Props {
  initial: HeroSetting;
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
