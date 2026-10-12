/**
 * Ekspor produk aktif yang belum punya dimensi paket ke docs/dimensi-produk.csv.
 *
 * Jalankan ulang setiap kali daftar produk berubah. Kolom dimensi sengaja
 * dikosongkan: ukur kemasan sebenarnya lalu isi, baru jalankan
 * scripts/apply-dimensions.ts.
 *
 *   npx tsx scripts/export-dimensions.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

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

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

async function main() {
  await loadEnvFile();

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      weightGram: true,
      category: { select: { name: true } },
    },
  });

  const rows = [
    ["nama_produk", "slug", "kategori", "berat_gram", "panjang_cm", "lebar_cm", "tinggi_cm", "catatan"],
    ...products.map((product) => [
      product.name,
      product.slug,
      product.category?.name ?? "",
      String(product.weightGram ?? ""),
      "",
      "",
      "",
      "isi ukuran kemasan (cm), kosongkan bila belum diukur",
    ]),
  ];

  const target = resolve(process.cwd(), "docs");
  mkdirSync(target, { recursive: true });
  const file = resolve(target, "dimensi-produk.csv");
  writeFileSync(file, rows.map((row) => row.map(csvCell).join(",")).join("\n") + "\n", "utf8");

  console.log(`✔ ${products.length} produk aktif diekspor ke ${file}`);
  console.log("Isi kolom panjang_cm/lebar_cm/tinggi_cm, lalu:");
  console.log("  npx tsx scripts/apply-dimensions.ts --dry-run   # cek dulu");
  console.log("  npx tsx scripts/apply-dimensions.ts --apply     # terapkan");
}

main()
  .catch((error) => {
    console.error("Gagal mengekspor:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });