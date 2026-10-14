"use client";

import { useEffect } from "react";

/**
 * Error boundary untuk area admin. Menangkap error render/data pada halaman
 * admin sehingga panel tidak menampilkan halaman default Next.js.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin render error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <span className="material-symbols-outlined text-3xl">error</span>
      </div>
      <h1 className="text-xl font-bold text-foreground">Terjadi kesalahan</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Gagal memuat halaman admin ini. Silakan coba lagi.
      </p>
      <button
        onClick={() => reset()}
        className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Coba lagi
      </button>
      {error.digest ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Kode: {error.digest}
        </p>
      ) : null}
    </div>
  );
}
