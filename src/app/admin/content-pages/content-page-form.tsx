"use client";

import { useState, useTransition } from "react";
import {
  createContentPage,
  updateContentPage,
  deactivateContentPage,
  type ContentPageRow,
  type CreateContentPageInput,
  type UpdateContentPageInput,
} from "@/lib/content-pages";
import { sanitizeHtml } from "@/lib/sanitize";

interface Props {
  initial: ContentPageRow | null;
}

export default function ContentPageForm({ initial }: Props) {
  const [isPending, startTransition] = useTransition();
  const existing = initial;
  const isEditing = existing !== null;

  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [seoTitle, setSeoTitle] = useState(existing?.seoTitle ?? "");
  const [seoDesc, setSeoDesc] = useState(existing?.seoDesc ?? "");
  const [contentHtml, setContentHtml] = useState("");
  const [active, setActive] = useState(
    isEditing ? String(existing.isActive) : "true"
  );

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        // Payload dibangun di dalam cabang: kalau dibuat sekali di luar, TypeScript
        // menyatukan keduanya jadi union yang tak bisa di-assign ke input create/update.
        if (isEditing) {
          await updateContentPage({
            id: existing.id,
            title,
            seoTitle: seoTitle || undefined,
            seoDesc: seoDesc || undefined,
            contentHtml,
            isActive: active === "true",
          } satisfies UpdateContentPageInput);
          setSuccess("Halaman berhasil diperbarui.");
        } else {
          await createContentPage({
            slug,
            title,
            seoTitle: seoTitle || undefined,
            seoDesc: seoDesc || undefined,
            contentHtml,
            isActive: active === "true",
          } satisfies CreateContentPageInput);
          setSuccess("Halaman berhasil dibuat.");
          setSlug("");
          setTitle("");
          setSeoTitle("");
          setSeoDesc("");
          setContentHtml("");
          setActive("true");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      }
    });
  }

  if (!isEditing) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-green-900">
              Slug <span className="text-red-600">*</span>
            </label>
            <input
              className="w-full rounded-lg border border-green-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="about, faq, privacy-policy"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-green-900">
              Judul <span className="text-red-600">*</span>
            </label>
            <input
              className="w-full rounded-lg border border-green-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tentang Kami"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-green-900">Judul SEO</label>
            <input
              className="w-full rounded-lg border border-green-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Tentang Kami - JagoFarm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-green-900">Deskripsi SEO</label>
            <input
              className="w-full rounded-lg border border-green-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
              value={seoDesc}
              onChange={(e) => setSeoDesc(e.target.value)}
              placeholder="Saya ingin belajar..."
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-green-900">
            Konten HTML <span className="text-red-600">*</span>
          </label>
          <textarea
            className="h-48 w-full rounded-lg border border-green-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            value={contentHtml}
            onChange={(e) => setContentHtml(e.target.value)}
            placeholder="<html>..."
            required
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-green-900">
            <input
              type="checkbox"
              checked={active === "true"}
              onChange={(e) => setActive(e.target.checked ? "true" : "false")}
              className="h-4 w-4 rounded border-green-300 text-green-800 focus:ring-green-700"
            />
            Aktifkan halaman
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-green-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 disabled:opacity-50"
          >
            {isPending ? "Menyimpan..." : "Simpan Halaman"}
          </button>
          {success && <span className="text-sm text-green-800">{success}</span>}
          {error && <span className="text-sm text-red-700">{error}</span>}
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-green-900">Aktif: {existing.isActive ? "Ya" : "Tidak"}</span>
        {!existing.isActive && (
          <button
            className="rounded-lg border border-red-200 bg-white px-3 py-1 text-sm font-medium text-red-700 transition hover:bg-red-50"
            onClick={() => {
              if (existing.id) {
                startTransition(async () => {
                  try {
                    await deactivateContentPage(existing.id);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Gagal menonaktifkan halaman.");
                  }
                });
              }
            }}
          >
            Nonaktifkan
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-green-900">Judul</label>
          <input
            className="w-full rounded-lg border border-green-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-green-900">Judul SEO</label>
            <input
              className="w-full rounded-lg border border-green-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-green-900">Deskripsi SEO</label>
            <input
              className="w-full rounded-lg border border-green-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
              value={seoDesc}
              onChange={(e) => setSeoDesc(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-green-900">Konten HTML</label>
          <textarea
            className="h-48 w-full rounded-lg border border-green-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            value={contentHtml}
            onChange={(e) => setContentHtml(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-green-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 disabled:opacity-50"
          >
            {isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
          {success && <span className="text-sm text-green-800">{success}</span>}
          {error && <span className="text-sm text-red-700">{error}</span>}
        </div>
      </form>

      {contentHtml && (
        <div className="mt-6 border-t border-green-200 pt-4">
          <h3 className="mb-2 text-sm font-semibold text-green-900">Preview</h3>
          <div className="min-h-[120px] border border-green-200 rounded-lg bg-white p-4">
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(contentHtml) }} />
          </div>
        </div>
      )}
    </div>
  );
}
