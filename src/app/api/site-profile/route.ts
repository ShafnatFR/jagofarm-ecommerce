import { NextResponse } from "next/server";
import { getStoreProfile } from "@/lib/site-settings";

/**
 * Profil toko publik (nama, tagline, kontak, alamat, jam layanan, tautan
 * sosial) untuk komponen klien - mis. badge jam layanan di halaman masuk.
 * Semua field bersifat publik; tidak ada data sensitif di sini.
 * Di-cache 60 detik (ISR) dan di-purge oleh aksi admin lewat revalidatePath.
 */
export const revalidate = 60;

export async function GET() {
  try {
    const profile = await getStoreProfile();
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[Site Profile] Error:", error);
    return NextResponse.json(
      { error: "Gagal memuat profil toko" },
      { status: 500 }
    );
  }
}
