"use client";

/**
 * Global error boundary (App Router).
 *
 * Menangkap error yang lolos dari error boundary level segmen — termasuk error
 * di root layout. Tanpa file ini, Next.js menampilkan halaman bawaan yang jelek
 * ("Application error: a client-side exception has occurred"). Wajib memuat
 * <html> dan <body> sendiri karena root layout di-bypass saat error terjadi.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          background: "#f7f9f7",
          color: "#1a1c1a",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>
            Terjadi kesalahan
          </h1>
          <p style={{ color: "#5b615b", margin: "0 0 20px", lineHeight: 1.6 }}>
            Maaf, ada gangguan teknis saat memuat halaman. Silakan coba lagi.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#1B4D3E",
              color: "#fff",
              border: 0,
              borderRadius: 10,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Coba lagi
          </button>
          {error.digest ? (
            <p style={{ color: "#9aa09a", fontSize: 12, marginTop: 16 }}>
              Kode kesalahan: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
