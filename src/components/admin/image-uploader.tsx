"use client";

import { useCallback, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Batas ukuran file: 5 MB (samakan dengan validasi di API /api/admin/upload) */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"];

export interface ImageUploaderProps {
  /** Daftar URL gambar yang sudah tersimpan (gambar pertama = utama) */
  value: string[];
  /** Callback saat daftar URL berubah */
  onChange: (urls: string[]) => void;
  /** Jumlah maksimal gambar, default 6 */
  max?: number;
  /** Nonaktifkan interaksi (mis. saat form sedang disimpan) */
  disabled?: boolean;
  /** Sub-folder opsional di dalam bucket Supabase Storage */
  folder?: string;
  className?: string;
}

function validateFile(file: File): string | null {
  const type = file.type?.toLowerCase() ?? "";
  const ext = (file.name.split(".").pop() || "").toLowerCase();

  if (!ALLOWED_TYPES.includes(type) && !ALLOWED_EXTENSIONS.includes(ext)) {
    return `${file.name}: tipe file tidak didukung. Gunakan JPEG, PNG, WebP, atau AVIF.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `${file.name}: ukuran melebihi 5 MB (${(file.size / (1024 * 1024)).toFixed(2)} MB).`;
  }
  if (file.size === 0) {
    return `${file.name}: file kosong.`;
  }
  return null;
}

export function ImageUploader({
  value,
  onChange,
  max = 6,
  disabled = false,
  folder,
  className,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const remaining = Math.max(0, max - value.length);
  const isBusy = uploading > 0;
  const locked = disabled || isBusy;

  const uploadOne = useCallback(
    async (file: File): Promise<string> => {
      const body = new FormData();
      body.append("file", file);
      if (folder) body.append("folder", folder);

      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || `Gagal mengunggah ${file.name} (HTTP ${res.status}).`);
      }
      return data.url;
    },
    [folder]
  );

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      if (locked) return;

      const incoming = Array.from(fileList);
      const accepted: File[] = [];
      const rejected: string[] = [];

      for (const file of incoming) {
        if (accepted.length >= remaining) {
          rejected.push(`${file.name}: maksimal ${max} gambar per produk.`);
          continue;
        }
        const problem = validateFile(file);
        if (problem) rejected.push(problem);
        else accepted.push(file);
      }

      setErrors(rejected);
      if (accepted.length === 0) return;

      setUploading(accepted.length);

      const uploaded: string[] = [];
      for (const file of accepted) {
        try {
          uploaded.push(await uploadOne(file));
        } catch (e) {
          rejected.push(e instanceof Error && e.message ? e.message : `Gagal mengunggah ${file.name}.`);
        } finally {
          setUploading((n) => Math.max(0, n - 1));
        }
      }

      if (uploaded.length > 0) onChange([...value, ...uploaded]);
      if (rejected.length > 0) setErrors(rejected);
    },
    [locked, max, onChange, remaining, uploadOne, value]
  );

  const removeAt = (index: number) => {
    if (locked) return;
    onChange(value.filter((_, i) => i !== index));
  };

  const makePrimary = (index: number) => {
    if (locked || index === 0) return;
    const next = [...value];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    onChange(next);
  };

  const openPicker = () => {
    if (locked) return;
    inputRef.current?.click();
  };

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        multiple
        className="hidden"
        disabled={locked}
        onChange={(e) => {
          if (e.target.files?.length) void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-surface-container-low"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Gambar produk ${index + 1}`}
                className="h-full w-full object-cover"
                title={index === 0 ? "Gambar utama produk" : `Gambar ${index + 1}`}
              />

              {index === 0 && (
                <span className="absolute left-1 top-1 rounded-full bg-[#1B4D3E] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Utama
                </span>
              )}

              <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => makePrimary(index)}
                    disabled={locked}
                    title="Jadikan gambar utama"
                    aria-label={`Jadikan gambar ${index + 1} sebagai gambar utama`}
                    className="rounded-full bg-white/90 p-1 text-[#1B4D3E] shadow hover:bg-white disabled:opacity-50"
                  >
                    <Icon name="star" size={12} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  disabled={locked}
                  title="Hapus gambar"
                  aria-label={`Hapus gambar ${index + 1}`}
                  className="rounded-full bg-white/90 p-1 text-red-500 shadow hover:bg-white disabled:opacity-50"
                >
                  <Icon name="close" size={12} />
                </button>
              </div>
            </div>
          ))}

          {remaining > 0 && (
            <button
              type="button"
              onClick={openPicker}
              disabled={locked}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-low text-gray-400 transition-colors hover:border-[#1B4D3E]/40 hover:text-[#1B4D3E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBusy ? (
                <Icon name="progress_activity" size={20} className="animate-spin" />
              ) : (
                <Icon name="image" size={20} />
              )}
              <span className="text-[11px] font-medium">Tambah</span>
            </button>
          )}
        </div>
      )}

      {(value.length === 0 || remaining > 0) && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!locked) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer?.files?.length) void handleFiles(e.dataTransfer.files);
          }}
          onClick={openPicker}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPicker();
            }
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors",
            dragging
              ? "border-[#1B4D3E] bg-[#1B4D3E]/5"
              : "border-outline-variant bg-surface-container-low hover:border-[#1B4D3E]/40",
            locked && "cursor-not-allowed opacity-60"
          )}
        >
          {isBusy ? (
            <>
              <Icon name="progress_activity" size={28} className="mb-2 animate-spin text-[#1B4D3E]" />
              <p className="text-sm text-on-surface-variant">Mengunggah {uploading} gambar...</p>
            </>
          ) : (
            <>
              <Icon name="upload" size={28} />
              <p className="text-sm text-on-surface-variant">Seret &amp; lepas gambar di sini</p>
              <p className="text-xs text-gray-400">atau klik untuk memilih (maks. {max} gambar, 5 MB/gambar)</p>
              <Button variant="secondary" size="sm" className="mt-3" type="button" disabled={locked}>
                Pilih File
              </Button>
            </>
          )}
        </div>
      )}

      {remaining === 0 && (
        <p className="text-xs text-gray-400">
          Sudah mencapai batas maksimal {max} gambar. Hapus salah satu untuk menambah gambar baru.
        </p>
      )}

      {value.length > 0 && (
        <p className="text-xs text-gray-400">
          Gambar pertama dipakai sebagai gambar utama produk. Gunakan ikon bintang untuk mengubahnya.
        </p>
      )}

      {errors.length > 0 && (
        <ul className="space-y-1 rounded-lg bg-red-50 p-3">
          {errors.map((message, i) => (
            <li key={`${message}-${i}`} className="flex items-start gap-1.5 text-xs text-red-600">
              <Icon name="info" size={12} className="mt-0.5 shrink-0" />
              <span>{message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ImageUploader;
