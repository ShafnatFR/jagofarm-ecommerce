import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Upload gambar butuh Node runtime (FormData/File) — jangan pakai edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Batas ukuran file: 5 MB */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Tipe MIME yang diizinkan beserta ekstensi yang dipakai untuk nama file */
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** Ekstensi cadangan kalau browser tidak mengirim MIME type yang benar */
const ALLOWED_EXTENSIONS: Record<string, string> = {
  jpg: "jpg",
  jpeg: "jpg",
  png: "png",
  webp: "webp",
  avif: "avif",
};

const DEFAULT_BUCKET = "product-images";
/** Semua foto ulasan disimpan di sub-folder ini agar rapi. */
const REVIEW_FOLDER = "review-images";

function getExtension(file: File): string | null {
  const byMime = ALLOWED_TYPES[file.type?.toLowerCase?.() ?? ""];
  if (byMime) return byMime;
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  return ALLOWED_EXTENSIONS[ext] ?? null;
}

function randomFileName(ext: string): string {
  const unique =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${Date.now()}-${unique}.${ext}`;
}

/**
 * POST /api/reviews/upload
 *
 * Unggah satu foto ulasan (B20). Perlu login. Body: multipart/form-data, field "file".
 * Mengembalikan { url } yang bisa dipakai sebagai `imageUrl` saat membuat ulasan.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Silakan masuk untuk mengunggah foto." }, { status: 401 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: "Penyimpanan gambar belum dikonfigurasi." },
        { status: 503 }
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Format request tidak valid. Kirim data sebagai multipart/form-data." },
        { status: 400 }
      );
    }

    const fileEntry = formData.get("file");
    if (!fileEntry || typeof fileEntry === "string") {
      return NextResponse.json({ error: "File gambar wajib diunggah." }, { status: 400 });
    }
    const file = fileEntry as File;

    if (!file.size) {
      return NextResponse.json({ error: "File kosong atau tidak terbaca." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        { error: `Ukuran file maksimal 5 MB. File Anda ${sizeMb} MB.` },
        { status: 400 }
      );
    }

    const extension = getExtension(file);
    if (!extension) {
      return NextResponse.json(
        { error: "Tipe file tidak didukung. Gunakan gambar JPEG, PNG, WebP, atau AVIF." },
        { status: 400 }
      );
    }

    const bucket = process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET;
    const fileName = randomFileName(extension);
    const path = `${REVIEW_FOLDER}/${fileName}`;

    const supabase = await createClient();
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: ALLOWED_TYPES[file.type?.toLowerCase?.() ?? ""]
        ? file.type
        : `image/${extension === "jpg" ? "jpeg" : extension}`,
      cacheControl: "31536000",
      upsert: false,
    });

    if (uploadError) {
      console.error("[Review Upload] error:", uploadError.message);
      return NextResponse.json(
        { error: "Gagal mengunggah foto. Coba lagi sebentar lagi." },
        { status: 502 }
      );
    }

    const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ url: publicUrl.publicUrl }, { status: 201 });
  } catch (error) {
    console.error("[Review Upload] Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan saat mengunggah foto." }, { status: 500 });
  }
}
