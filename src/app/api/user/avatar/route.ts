import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { UPLOAD } from "@/lib/constants";

// Upload gambar butuh Node runtime (FormData/File) — jangan pakai edge.
// Sama seperti implementasi /api/admin/upload yang sudah terbukti jalan.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Tipe MIME yang diizinkan (dari UPLOAD.ACCEPTED_IMAGE_TYPES) + ekstensi. */
const ACCEPTED_TYPES = new Set(
  UPLOAD.ACCEPTED_IMAGE_TYPES.map((t) => t.toLowerCase())
);

/** Map MIME -> ekstensi yang dipakai untuk nama file. */
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Ekstensi cadangan kalau browser tidak mengirim MIME type yang benar. */
const ALLOWED_EXTENSIONS: Record<string, string> = {
  jpg: "jpg",
  jpeg: "jpg",
  png: "png",
  webp: "webp",
};

const DEFAULT_BUCKET = "product-images";

const SETUP_STEPS =
  "Supabase Storage belum siap. Langkah setup: (1) pastikan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY terisi di .env, " +
  "(2) buka Supabase Dashboard → Storage → pastikan bucket \"" +
  DEFAULT_BUCKET +
  "\" ada dan Public bucket, " +
  "(3) tambahkan policy agar gambar bisa diunggah dan dibaca publik, contoh: CREATE POLICY \"public read\" ON storage.objects FOR SELECT USING (bucket_id = '" +
  DEFAULT_BUCKET +
  "'); " +
  "dan CREATE POLICY \"authenticated upload\" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = '" +
  DEFAULT_BUCKET +
  "');";

function getExtension(file: File): string | null {
  const type = file.type?.toLowerCase?.() ?? "";
  if (ACCEPTED_TYPES.has(type)) {
    return MIME_TO_EXT[type] ?? null;
  }

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

/** Bersihkan satu segmen path (userId/id) — hanya huruf/angka, tanpa traversal. */
function sanitizeSegment(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, 120);
}

function contentTypeFor(ext: string): string {
  return ext === "jpg" ? "image/jpeg" : `image/${ext}`;
}

export async function POST(request: NextRequest) {
  try {
    // Auth: cukup user login (TIDAK ada cek role admin — ini upload avatar sendiri).
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = sanitizeSegment(session.user.id);
    if (!userId) {
      return NextResponse.json(
        { error: "Sesi user tidak valid. Coba masuk kembali." },
        { status: 401 }
      );
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

    const maxSizeMb = (UPLOAD.MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    if (file.size > UPLOAD.MAX_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        { error: `Ukuran file maksimal ${maxSizeMb} MB. File Anda ${sizeMb} MB.` },
        { status: 400 }
      );
    }

    const extension = getExtension(file);
    if (!extension) {
      return NextResponse.json(
        {
          error:
            "Tipe file tidak didukung. Gunakan gambar JPEG, PNG, atau WebP.",
        },
        { status: 400 }
      );
    }

    const bucket = process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET;
    // Path di-scope ke user id supaya file avatar tiap user terpisah.
    const fileName = randomFileName(extension);
    const path = `avatars/${userId}/${fileName}`;

    const supabase = await createClient();

    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: contentTypeFor(extension),
      cacheControl: "31536000",
      upsert: false,
    });

    if (uploadError) {
      const message = uploadError.message || "";
      console.error("Avatar upload error:", message);

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
          { error: `Akses upload ke bucket "${bucket}" ditolak. ${SETUP_STEPS}` },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: `Gagal mengunggah gambar ke Supabase Storage: ${message}` },
        { status: 502 }
      );
    }

    const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path);
    const imageUrl = publicUrl.publicUrl;

    // Simpan URL avatar ke kolom user.image (avatar_url) milik user ini saja.
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl },
    });

    return NextResponse.json(
      { url: imageUrl, path, bucket },
      { status: 201 }
    );
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengunggah foto profil. Coba lagi." },
      { status: 500 }
    );
  }
}
