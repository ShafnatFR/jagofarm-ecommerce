"use client";

import * as React from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const MIN_COMMENT_LENGTH = 10;

export interface ReviewFormProps {
  productId: string;
  /** Dipanggil setelah ulasan berhasil dikirim (mis. untuk refresh daftar ulasan). */
  onSuccess?: () => void;
  className?: string;
}

const textareaClass =
  "flex min-h-[110px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

/** Ambil pesan error human-readable dari respons API. */
function extractErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "error" in payload) {
    const err = (payload as { error?: unknown }).error;
    if (typeof err === "string" && err.trim()) return err;
    if (err && typeof err === "object") {
      const first = Object.values(err as Record<string, unknown>)
        .flat()
        .find((value) => typeof value === "string" && value.trim());
      if (typeof first === "string") return first;
    }
  }
  return fallback;
}

export function ReviewForm({ productId, onSuccess, className }: ReviewFormProps) {
  const { toast } = useToast();

  const [rating, setRating] = React.useState(0);
  const [hovered, setHovered] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const activeRating = hovered || rating;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!productId) {
      setError("Produk tidak valid.");
      return;
    }
    if (rating < 1) {
      setError("Pilih rating bintang 1 sampai 5 terlebih dahulu.");
      return;
    }
    if (comment.trim().length < MIN_COMMENT_LENGTH) {
      setError(`Tulis ulasan minimal ${MIN_COMMENT_LENGTH} karakter.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          comment: comment.trim(),
          // Kirim undefined (bukan "") supaya validasi zod URL tetap lolos.
          imageUrl: imageUrl.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          res.status === 401
            ? "Anda harus masuk terlebih dahulu untuk menulis ulasan."
            : extractErrorMessage(
                data,
                "Ulasan gagal dikirim. Silakan coba lagi."
              );
        setError(message);
        toast({
          variant: "destructive",
          title: "Ulasan gagal dikirim",
          description: message,
        });
        return;
      }

      setSuccess(true);
      setRating(0);
      setHovered(0);
      setComment("");
      setImageUrl("");
      toast({
        title: "Ulasan berhasil dikirim",
        description: "Terima kasih! Ulasan Anda sudah tayang.",
      });
      onSuccess?.();
    } catch {
      const message =
        "Tidak dapat menghubungi server. Periksa koneksi Anda lalu coba lagi.";
      setError(message);
      toast({
        variant: "destructive",
        title: "Ulasan gagal dikirim",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }

  /** Unggah foto ulasan ke storage; isi `imageUrl` dengan hasilnya (B20). */
  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran foto maksimal 5 MB.");
      event.target.value = "";
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/reviews/upload", { method: "POST", body });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          res.status === 401
            ? "Masuk terlebih dahulu untuk mengunggah foto."
            : extractErrorMessage(data, "Foto gagal diunggah. Coba lagi.");
        setError(message);
        return;
      }

      setImageUrl((data?.url as string) ?? "");
      toast({ title: "Foto terunggah", description: "Foto akan dilampirkan pada ulasan Anda." });
    } catch {
      setError("Tidak dapat mengunggah foto. Periksa koneksi Anda.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "rounded-xl border border-border bg-card p-4 sm:p-5",
        className
      )}
    >
      <h3 className="text-base font-semibold">Tulis Ulasan</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Ulasan hanya bisa ditulis untuk produk yang sudah Anda beli dan bayar.
      </p>

      {success && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800">
          <Icon name="check_circle" size={16} className="mt-0.5 shrink-0" />
          <span>Ulasan Anda sudah dikirim dan langsung tayang.</span>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <Icon name="info" size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Rating */}
      <div className="mt-4">
        <span className="mb-1.5 block text-sm font-medium">Rating</span>
        <div
          className="flex items-center gap-1"
          role="radiogroup"
          aria-label="Pilih rating"
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`Bintang ${value}`}
              disabled={loading}
              onMouseEnter={() => setHovered(value)}
              onMouseLeave={() => setHovered(0)}
              onFocus={() => setHovered(value)}
              onBlur={() => setHovered(0)}
              onClick={() => setRating(value)}
              className="rounded p-0.5 disabled:cursor-not-allowed"
            >
              <Icon name="star" size={24} />
            </button>
          ))}
          <span className="ml-2 text-sm text-muted-foreground">
            {activeRating > 0 ? `${activeRating}/5` : "Belum dipilih"}
          </span>
        </div>
      </div>

      {/* Komentar */}
      <div className="mt-4">
        <label
          htmlFor="review-comment"
          className="mb-1.5 block text-sm font-medium"
        >
          Ulasan
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          disabled={loading}
          maxLength={1000}
          placeholder="Ceritakan pengalaman Anda memakai produk ini (minimal 10 karakter)"
          className={textareaClass}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {comment.trim().length}/1000 karakter
        </p>
      </div>

      {/* Foto opsional */}
      <div className="mt-4">
        <span className="mb-1.5 block text-sm font-medium">Foto (opsional)</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={handleFileChange}
          disabled={uploading || loading}
          className="hidden"
          id="review-photo"
        />
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={uploading || loading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon name={uploading ? "progress_activity" : "add_photo_alternate"} size={16} className={uploading ? "mr-1.5 animate-spin" : "mr-1.5"} />
            {uploading ? "Mengunggah…" : imageUrl ? "Ganti Foto" : "Unggah Foto"}
          </Button>
          {imageUrl && (
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="text-xs font-medium text-destructive hover:underline"
            >
              Hapus foto
            </button>
          )}
        </div>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- pratinjau unggahan pengguna, ukuran tak diketahui
          <img
            src={imageUrl}
            alt="Pratinjau foto ulasan"
            className="mt-2 h-24 w-24 rounded-lg border border-border object-cover"
          />
        )}
        <p className="mt-1 text-xs text-muted-foreground">Format JPG/PNG/WebP, maksimal 5 MB.</p>
      </div>

      <Button type="submit" className="mt-5 w-full" disabled={loading}>
        {loading ? (
          <>
            <Icon name="progress_activity" size={16} className="mr-2 animate-spin" /> Mengirim...
          </>
        ) : (
          "Kirim Ulasan"
        )}
      </Button>
    </form>
  );
}

export default ReviewForm;
