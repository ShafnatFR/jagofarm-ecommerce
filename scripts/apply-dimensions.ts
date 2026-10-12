/**
 * Isi dimensi paket (cm) untuk produk aktif dari file CSV.
 *
 * Dipakai karena 43 produk aktif belum punya length/width/height, sehingga
 * berat volumetrik dihitung 0 dan ongkir hanya memakai berat aktual
 * (lihat src/lib/shipping-quote.ts). voluntarily TIDAK menebak dimensi:
 * angka mengarang bisa bikin ongkir customer melonjak atau JagoFarm subsidisi
 * ongkir. Isi kolom Panjang/Lebar/Tinggi dengan ukuran kemasan sebenarnya.
 *
 * Cara pakai:
 *   1) Buka docs/dimensi-produk.csv, isi kolom panjang_cm/lebar_cm/tinggi_cm
 *      (boleh dikosongkan = produk itu dilewati).
 *   2) Cek dulu tanpa menulis:   npx tsx scripts/apply-dimensions.ts --dry-run
 *   3) Terapkan:                npx tsx scripts/apply-dimensions.ts --apply
 *
 * Baris CSV yang tidak diubah tetap aman: kolom yang kosong tidak ditimpa.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DIVISOR = Number(process.env.SHIPPING_VOLUMETRIC_DIVISOR ?? 5000);

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

/** CSV sederhana: pisahkan koma, buang tanda kutip. */
function parseCsv(content: string): Record<string, string>[] {
  const [headerLine, ...rows] = content
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());
  return rows.map((line) => {
    const cells = line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
}

function toPositiveInt(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.trunc(parsed);
}

async function main() {
  await loadEnvFile();
  const apply = process.argv.includes("--apply");
  const dryRun = process.argv.includes("--dry-run") || !apply;

  const csvPath = resolve(process.cwd(), "docs", "dimensi-produk.csv");
  let content: string;
  try {
    content = readFileSync(csvPath, "utf8");
  } catch {
    console.error(`✖ File tidak ditemukan: ${csvPath}`);
    console.error("  Jalankan dulu: npx tsx scripts/export-dimensions.ts");
    process.exitCode = 1;
    return;
  }

  const rows = parseCsv(content);
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = row.nama_produk;
    if (!name) continue;
    const length = toPositiveInt(row.panjang_cm ?? "");
    const width = toPositiveInt(row.lebar_cm ?? "");
    const height = toPositiveInt(row.tinggi_cm ?? "");
    if (length === null || width === null || height === null) {
      skipped += 1;
      continue;
    }

    const product = await prisma.product.findFirst({
      where: { name },
      select: { id: true, name: true, weightGram: true, isActive: true },
    });
    if (!product) {
      console.log(`?  "${name}" tidak ada di database — dilewati.`);
      skipped += 1;
      continue;
    }

    const volumeCm3 = length * width * height;
    const volumetric = (volumeCm3 / DIVISOR) * 1000;
    const before = product.weightGram;
    const after = Math.max(before, volumetric);
    const deltaKg = (after - before) / 1000;

    console.log(
      `${dryRun ? "[dry-run]" : "[apply]  "} ${product.name} (${product.isActive ? "aktif" : "nonaktif"}) ` +
        `→ ${length}x${width}x${height} cm | ongkir ${(before / 1000).toFixed(2)}kg → ${(after / 1000).toFixed(2)}kg ` +
        `(${deltaKg >= 0 ? "+" : ""}${deltaKg.toFixed(2)}kg)`
    );

    if (!dryRun) {
      await prisma.product.update({
        where: { id: product.id },
        data: { lengthCm: length, widthCm: width, heightCm: height },
      });
    }
    updated += 1;
  }

  console.log("");
  console.log(`${updated} baris diproses, ${skipped} dilewati (kolom dimensi kosong).`);
  if (dryRun) {
    console.log("Mode dry-run: tidak ada perubahan di database.");
    console.log("Ubah ke --apply kalau angkanya sudah benar.");
  }
}

main()
  .catch((error) => {
    console.error("Gagal menerapkan dimensi:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });