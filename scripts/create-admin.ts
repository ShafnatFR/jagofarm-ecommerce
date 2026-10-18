/**
 * Buat akun admin baru dengan password, lalu sinkronkan ke tabel users.
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts --email superadmin@jagofarm.id
 *
 * Password dibaca dari prompt tersembunyi (tidak lewat argumen/chat) supaya
 * tidak tersimpan di riwayat shell maupun log.
 *
 * Kenapa butuh kunci service-role:
 *   `supabase.auth.signUp()` dari anon key akan mengirim email konfirmasi dan
 *   TIDAK memberi sesi, sehingga akun belum bisa langsung dipakai. Pembuatan
 *   user terverifikasi butuh `auth.admin.createUser()` yang hanya tersedia
 *   dengan SERVICE_ROLE_KEY. Tanpa kunci itu, skrip berhenti dengan petunjuk.
 */
import { PrismaClient } from "@prisma/client";
import { createInterface } from "node:readline";

const prisma = new PrismaClient();

async function loadEnvFile() {
  const { readFileSync } = await import("node:fs");
  const { resolve } = await import("node:path");
  try {
    const content = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of content.split(/\r?\n/)) {
      const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
      if (!m) continue;
      const [, key, raw] = m;
      if (!process.env[key]) process.env[key] = raw.replace(/^['"]|['"]$/g, "");
    }
  } catch {
    /* andalkan process.env */
  }
}

/** Prompt password tanpa menampilkan karakter yang diketik. */
function askPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const onData = (char: string) => {
      if (["\n", "\r", "\u0004"].includes(char)) return;
      // Tulis ulang baris tanpa menampilkan isi.
      process.stdout.clearLine?.(0);
      process.stdout.cursorTo?.(0);
      process.stdout.write(prompt);
    };
    process.stdin.on("data", onData);
    rl.question(prompt, (answer) => {
      process.stdin.off("data", onData);
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

function usage() {
  console.log("Cara pakai: npx tsx scripts/create-admin.ts --email <email> [--role admin]");
  console.log("  --email   email akun yang akan dibuat (wajib)");
  console.log("  --role    admin (default) — enum Role saat ini hanya: customer, admin");
}

async function main() {
  await loadEnvFile();

  const args = process.argv.slice(2).filter((a) => a !== "--");
  // --email <alamat>  atau  posisi bebas yang mengandung "@"
  const emailFlagIdx = args.indexOf("--email");
  const email = (
    emailFlagIdx >= 0 ? args[emailFlagIdx + 1] : args.find((a) => !a.startsWith("--") && a.includes("@"))
  )
    ?.trim()
    .toLowerCase();
  const roleFlagIdx = args.indexOf("--role");
  const role = roleFlagIdx >= 0 && args[roleFlagIdx + 1] ? args[roleFlagIdx + 1] : "admin";

  if (!email) {
    usage();
    process.exitCode = 1;
    return;
  }
  if (!["customer", "admin"].includes(role)) {
    console.error(`Peran "${role}" tidak dikenal. Enum Role saat ini hanya: customer, admin.`);
    process.exitCode = 1;
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(
      [
        "SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.",
        "",
        "Tanpa kunci itu akun tidak bisa dibuat dalam keadaan sudah terverifikasi.",
        "Alternatif tanpa service role (tetap aman, tanpa menyentuh kredensial):",
        "  1. Daftar sendiri lewat /register memakai email tsb.",
        "  2. Konfirmasi email dari inbox.",
        "  3. Jalankan: npx tsx scripts/promote-admin.ts " + email,
        "",
        "Kalau mau cara otomatis: ambil Service Role Key di",
        "Supabase Dashboard -> Project Settings -> API, tambahkan ke .env",
        "sebagai SUPABASE_SERVICE_ROLE_KEY, lalu ulangi perintah ini.",
      ].join("\n")
    );
    process.exitCode = 1;
    return;
  }

  // Cegah duplikat sebelum memanggil Supabase.
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    console.error(`Email ${email} sudah ada di tabel users. Gunakan promote-admin.ts untuk menaikkan perannya.`);
    process.exitCode = 1;
    return;
  }

  const password = await askPassword("Password (tidak ditampilkan): ");
  if (password.length < 8) {
    console.error("Password minimal 8 karakter (MIN_PASSWORD_LENGTH).");
    process.exitCode = 1;
    return;
  }
  const confirm = await askPassword("Ulangi password: ");
  if (confirm !== password) {
    console.error("Password tidak sama.");
    process.exitCode = 1;
    return;
  }

  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // langsung aktif, tanpa klik tautan di email
    user_metadata: { full_name: email.split("@")[0] },
  });

  if (error || !data.user) {
    console.error("Gagal membuat user Supabase:", error?.message ?? "tidak diketahui");
    process.exitCode = 1;
    return;
  }

  try {
    const user = await prisma.user.create({
      data: {
        id: data.user.id,
        supabaseId: data.user.id,
        email,
        name: email.split("@")[0],
        role: role as "customer" | "admin",
      },
      select: { id: true, email: true, role: true },
    });
    await prisma.cart.create({ data: { userId: user.id } }).catch(() => null);
    console.log(`\nBerhasil. ${user.email} (${user.role}) id=${user.id}`);
  } catch (e) {
    // Rollback agar tidak ada user Supabase tanpa baris users.
    await admin.auth.admin.deleteUser(data.user.id).catch(() => null);
    console.error("Gagal menyinkronkan ke tabel users, user Supabase dibatalkan:", e);
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
