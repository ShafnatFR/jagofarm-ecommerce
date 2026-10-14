"use client";

import { useEffect } from "react";

/** Error boundary untuk halaman auth (login/register/lupa password). */
export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Auth render error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-bold text-foreground">Terjadi kesalahan</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Gagal memuat halaman. Silakan coba lagi.
      </p>
      <button
        onClick={() => reset()}
        className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Coba lagi
      </button>
    </div>
  );
}
