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

const SETUP_STEPS =
  "Supabase Storage belum siap. Langkah setup: (1) pastikan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY terisi di .env, " +
  "(2) buka Supabase Dashboard → Storage → New bucket, buat bucket bernama \"product-images\" (atau sesuaikan env SUPABASE_STORAGE_BUCKET) dan centang Public bucket, " +
  "(3) tambahkan policy agar gambar bisa diunggah dan dibaca publik, contoh: CREATE POLICY \"public read\" ON storage.objects FOR SELECT USING (bucket_id = 'product-images'); " +
  "dan CREATE POLICY \"anon upload\" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'product-images');";

function getExtension(file: File): string | null {
  const byMime = ALLOWED_TYPES[file.type?.toLowerCase?.() ?? ""];
  if (byMime) return byMime;

  const ext = (file.name.split(".").pop() || "").toLowerCase();
  return ALLOWED_EXTENSIONS[ext] ?? null;
}

/** Nama file acak: timestamp + uuid + ekstensi asli */
function randomFileName(ext: string): string {
  const unique =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);

  return `${Date.now()}-${unique}.${ext}`;
}

/** Bersihkan folder: hanya huruf/angka/tanda hubung/garis miring, tanpa traversal */
function sanitizeFolder(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, "")
    .replace(/\.+/g, "")
    .replace(/\/{2,}/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .slice(0, 120);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Cek konfigurasi Supabase lebih dulu supaya errornya jelas (503, bukan 500)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: `Supabase belum dikonfigurasi. ${SETUP_STEPS}` },
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
      return NextResponse.json(
        { error: "File gambar wajib diunggah pada field \"file\"." },
        { status: 400 }
      );
    }

    const file = fileEntry as File;

    if (!file.size || file.size === 0) {
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
        {
          error:
            "Tipe file tidak didukung. Gunakan gambar JPEG, PNG, WebP, atau AVIF.",
        },
        { status: 400 }
      );
    }

    const bucket = process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET;
    const folder = sanitizeFolder(formData.get("folder"));
    const fileName = randomFileName(extension);
    const path = folder ? `${folder}/${fileName}` : fileName;

    const supabase = await createClient();

    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: ALLOWED_TYPES[file.type?.toLowerCase?.() ?? ""]
        ? file.type
        : `image/${extension === "jpg" ? "jpeg" : extension}`,
      cacheControl: "31536000",
      upsert: false,
    });

    if (uploadError) {
      const message = uploadError.message || "";
      console.error("Admin upload error:", message);

      if (/bucket not found|not found|does not exist/i.test(message)) {
        return NextResponse.json(
          {
            error: `Bucket Storage "${bucket}" tidak ditemukan. ${SETUP_STEPS}`,
          },
          { status: 503 }
        );
      }

      if (/policy|permission|unauthorized|row-level security|jwt|not allowed/i.test(message)) {
        return NextResponse.json(
          {
            error: `Akses upload ke bucket "${bucket}" ditolak. ${SETUP_STEPS}`,
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: `Gagal mengunggah gambar ke Supabase Storage: ${message}` },
        { status: 502 }
      );
    }

    const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path);

    return NextResponse.json(
      { url: publicUrl.publicUrl, path, bucket },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin upload error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengunggah gambar. Coba lagi." },
      { status: 500 }
    );
  }
}
