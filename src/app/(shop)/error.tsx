"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Error boundary untuk seluruh area toko (route group `(shop)`).
 * Menangkap error render/data pada halaman toko sehingga pengguna melihat
 * pesan yang ramah (bukan halaman default Next.js) dan bisa mencoba lagi.
 */
export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Shop render error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <span className="material-symbols-outlined text-3xl">error</span>
      </div>
      <h1 className="text-2xl font-bold text-foreground">Terjadi kesalahan</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Maaf, ada gangguan saat memuat halaman ini. Silakan coba lagi.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Coba lagi
        </button>
        <Link
          href="/"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
        >
          Ke Beranda
        </Link>
      </div>
    </div>
  );
}
