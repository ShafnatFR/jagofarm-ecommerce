import { NextResponse } from "next/server";
import { getSiteContent } from "@/lib/site-settings";

/**
 * Teks konten situs publik (marketing copy: navbar, strip keunggulan, banner
 * CTA, kartu FAQ kontak, panel halaman masuk/daftar) untuk komponen klien.
 * Semua field bersifat publik; tidak ada data sensitif.
 * Di-cache 60 detik (ISR) dan di-purge oleh aksi admin lewat revalidatePath.
 */
export const revalidate = 60;

export async function GET() {
  try {
    const content = await getSiteContent();
    return NextResponse.json({ content });
  } catch (error) {
    console.error("[Site Content] Error:", error);
    return NextResponse.json(
      { error: "Gagal memuat konten situs" },
      { status: 500 }
    );
  }
}
