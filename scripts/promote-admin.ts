/**
 * Promote an existing user to admin.
 *
 * Usage:
 *   npx tsx scripts/promote-admin.ts <email>
 *   npm run admin:promote -- <email>
 *
 * The account must already exist in the `users` table: Supabase Auth is the
 * source of truth for credentials, so create the account first (register at
 * /register, sign in with Google, or reset its password) and then run this script.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Best-effort .env loader so the script works without exporting DATABASE_URL. */
async function loadEnvFile() {
  if (process.env.DATABASE_URL) return;
  try {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const content = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of content.split(/\r?\n/)) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (!process.env[key]) process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
    }
  } catch {
    // Ignore — rely on process.env (same behaviour as prisma/seed.ts).
  }
}

function printUsage() {
  console.log("Cara pakai: npx tsx scripts/promote-admin.ts <email>");
  console.log("  <email>   email user yang sudah ada di tabel users");
}

async function main() {
  await loadEnvFile();

  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const email = args.find((arg) => !arg.startsWith("--"))?.trim().toLowerCase();

  if (!email) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!existing) {
    console.error(`✖ User dengan email "${email}" belum ada di tabel users.`);
    console.error("");
    console.error("Akun Supabase Auth harus dibuat lebih dulu, karena Supabase adalah");
    console.error("sumber kredensial (registrasi lama berbasis bcrypt sudah tidak dipakai):");
    console.error("  1) Daftarkan akun lewat halaman /register, atau");
    console.error("  2) Masuk dengan Google memakai email yang sama, atau");
    console.error("  3) Minta user menekan 'Lupa Password' agar akun Supabase-nya terbentuk.");
    console.error("");
    console.error("Setelah baris users muncul (getCurrentUser otomatis membuatnya saat login),");
    console.error(`jalankan lagi: npx tsx scripts/promote-admin.ts ${email}`);
    process.exitCode = 1;
    return;
  }

  const updated = await prisma.user.update({
    where: { id: existing.id },
    data: { role: "admin" },
    select: { id: true, email: true, name: true, role: true },
  });

  console.log(`✔ ${updated.email} sekarang memiliki role '${updated.role}'.`);
  console.log(`  id   : ${updated.id}`);
  console.log(`  nama : ${updated.name ?? "(tanpa nama)"}`);
  console.log("");
  console.log("Akses admin aktif setelah user login ulang (session refresh).");
}

main()
  .catch((error) => {
    console.error("Gagal mengubah role:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
