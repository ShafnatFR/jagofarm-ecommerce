import Link from "next/link";

/**
 * Halaman 404 global (App Router). Tanpa file ini, Next.js menampilkan halaman
 * bawaan yang tidak bergaya. Dipakai untuk semua rute yang tidak ditemukan.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-6xl font-extrabold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold text-foreground">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Halaman yang Anda cari tidak ada atau sudah dipindahkan.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Ke Beranda
        </Link>
        <Link
          href="/products"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
        >
          Lihat Produk
        </Link>
      </div>
    </div>
  );
}
