/**
 * Isi halaman konten (about, faq, terms, ...) tanpa menjalankan seed penuh.
 *
 * Kenapa skrip ini ada: `npm run db:seed` menjalankan
 * `product.upsert({ update: data })` untuk SETIAP produk, jadi harga, stok,
 * dan deskripsi katalog akan ditimpa dengan nilai seed. Pada database yang
 * sudah berisi katalog asli (dan sudah pernah diedit admin), itu merusak data.
 * Skrip ini hanya menyentuh tabel content_pages, dan aman dijalankan ulang.
 *
 *   npx tsx scripts/seed-content-pages.ts            # isi yang belum ada
 *   npx tsx scripts/seed-content-pages.ts --overwrite# timpa dengan isi seed
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { seedContentPages } from "../prisma/content-pages-seed";

const prisma = new PrismaClient();

async function loadEnvFile() {
  if (process.env.DATABASE_URL) return;
  try {
    const content = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of content.split(/\r?\n/)) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (!process.env[key]) process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
    }
  } catch {
    // Abaikan — andalkan process.env.
  }
}

async function main() {
  await loadEnvFile();
  const overwrite = process.argv.includes("--overwrite");

  let created = 0;
  let kept = 0;

  for (const page of seedContentPages) {
    const existing = await prisma.contentPage.findUnique({
      where: { slug: page.slug },
      select: { id: true, title: true, updatedAt: true },
    });

    if (existing && !overwrite) {
      kept += 1;
      console.log(`• ${page.slug} — sudah ada (diperbarui ${existing.updatedAt.toISOString().slice(0, 10)}), dilewati.`);
      continue;
    }

    await prisma.contentPage.upsert({
      where: { slug: page.slug },
      update: overwrite
        ? {
            title: page.title,
            seoTitle: page.seoTitle,
            seoDesc: page.seoDesc,
            contentHtml: page.contentHtml,
          }
        : {},
      create: page,
    });
    if (existing) {
      kept += 1;
      console.log(`↻ ${page.slug} — ditimpa dengan isi seed (--overwrite).`);
    } else {
      created += 1;
      console.log(`+ ${page.slug} — dibuat.`);
    }
  }

  console.log("");
  console.log(`${created} halaman dibuat, ${kept} dilewati/diubah.`);
  console.log("Periksa hasilnya di Admin → Content Pages.");
}

main()
  .catch((error) => {
    console.error("Gagal mengisi halaman konten:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });