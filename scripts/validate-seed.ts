/**
 * scripts/validate-seed.ts
 *
 * Pemeriksa struktur data katalog JagoFarm TANPA menyentuh database.
 *
 * Cara kerja: file ini membaca prisma/seed.ts sebagai teks, mengekstrak blok
 * data di antara penanda `slash-star @DATA:categories star-slash ... @ENDDATA`
 * dan `@DATA:products`, lalu mengevaluasinya sebagai objek literal JavaScript
 * murni. Jadi yang divalidasi benar-benar data yang akan di-insert oleh seed,
 * bukan salinan terpisah yang bisa basi.
 *
 * Jalankan: npx tsx scripts/validate-seed.ts
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ----------------------------------------------------------------- tipe data
interface RawCategory {
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentSlug: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface RawImage {
  url: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
}

interface RawVariant {
  name: string;
  sku: string;
  priceModifier: number;
  stock: number;
  attributes: Record<string, unknown>;
}

interface RawProduct {
  categorySlug: string;
  name: string;
  slug: string;
  description: string;
  shortDesc: string;
  basePrice: number;
  discountPrice?: number;
  sku: string;
  weightGram: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  metaTitle: string;
  metaDesc: string;
  images: RawImage[];
  variants: RawVariant[];
}

// ----------------------------------------------------------------- utilitas
const failures: string[] = [];
const notes: string[] = [];

function check(condition: boolean, message: string): void {
  if (!condition) failures.push(message);
}

function checkEq<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    failures.push(`${message} (dapat ${JSON.stringify(actual)}, harusnya ${JSON.stringify(expected)})`);
  }
}

const SEED_PATH = resolve(__dirname, "..", "prisma", "seed.ts");

function extractDataBlock(source: string, name: string): unknown {
  const start = `/*@DATA:${name}*/`;
  const end = "/*@ENDDATA*/";
  const startIndex = source.indexOf(start);
  if (startIndex === -1) {
    throw new Error(`Penanda ${start} tidak ditemukan di prisma/seed.ts`);
  }
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (endIndex === -1) {
    throw new Error(`Penanda ${end} setelah ${start} tidak ditemukan di prisma/seed.ts`);
  }
  const literal = source.slice(startIndex + start.length, endIndex).trim();
  if (!literal.startsWith("[") || !literal.endsWith("]")) {
    throw new Error(`Blok data "${name}" bukan array literal`);
  }
  const evaluated = new Function(`"use strict"; return (${literal});`)();
  return evaluated;
}

function extractOfficialTags(source: string): string[] {
  const match = /export const OFFICIAL_TAGS[^=]*=\s*(\[[\s\S]*?\])\s*;/.exec(source);
  if (!match) throw new Error("OFFICIAL_TAGS tidak ditemukan di prisma/seed.ts");
  return new Function(`"use strict"; return (${match[1]});`)() as string[];
}

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const v of values) {
    if (seen.has(v)) dup.add(v);
    seen.add(v);
  }
  return [...dup];
}

// ----------------------------------------------------------------- program
function main(): void {
  const source = readFileSync(SEED_PATH, "utf8");

  const categories = extractDataBlock(source, "categories") as RawCategory[];
  const products = extractDataBlock(source, "products") as RawProduct[];
  const officialTags = extractOfficialTags(source);

  check(Array.isArray(categories) && categories.length > 0, "Daftar kategori kosong");
  check(Array.isArray(products) && products.length > 0, "Daftar produk kosong");
  check(officialTags.length === 7, `Daftar tag resmi harus 7 tag (dapat ${officialTags.length})`);

  // ---- idempotensi seed (upsert, bukan create buta)
  check(
    source.includes("prisma.product.upsert("),
    "Seed harus meng-upsert produk berdasarkan slug"
  );
  check(
    source.includes("prisma.category.upsert("),
    "Seed harus meng-upsert kategori berdasarkan slug"
  );
  check(
    source.includes("prisma.productImage.deleteMany("),
    "Seed harus membersihkan gambar lama sebelum menulis ulang (idempoten)"
  );
  check(
    source.includes("prisma.productVariant.deleteMany("),
    "Seed harus memangkas varian lama yang tidak lagi dipakai (idempoten)"
  );
  check(
    source.includes("prisma.productVariant.upsert("),
    "Seed harus meng-upsert varian berdasarkan sku"
  );

  // ---- kategori
  const catSlugs = categories.map((c) => c.slug);
  const catSlugSet = new Set(catSlugs);
  checkEq(catSlugSet.size, catSlugs.length, "Slug kategori ada yang duplikat");
  for (const d of duplicates(catSlugs)) failures.push(`Slug kategori duplikat: ${d}`);

  const ROOT_SLUGS = [
    "set-tambak",
    "set-hidroponik",
    "set-aquaponik",
    "iot-smart-farming",
    "benih",
    "anakan-ikan",
  ];
  for (const root of ROOT_SLUGS) {
    check(catSlugSet.has(root), `Kategori root wajib hilang: ${root}`);
    const cat = categories.find((c) => c.slug === root);
    if (cat) checkEq(cat.parentSlug, null, `Kategori root ${root} harus parentSlug null`);
  }
  const rootCount = categories.filter((c) => c.parentSlug === null).length;
  checkEq(rootCount, 6, "Jumlah kategori root harus tepat 6");

  // sub-kategori wajib sesuai Product Catalog Structure.md
  const REQUIRED_CHILDREN: Record<string, string[]> = {
    "set-tambak": [
      "set-tambak-lele",
      "set-tambak-nila",
      "set-tambak-gurami",
      "set-tambak-patin",
      "set-tambak-udang",
    ],
    "set-hidroponik": [
      "set-hidroponik-nft",
      "set-hidroponik-dwc",
      "set-hidroponik-wick",
      "set-hidroponik-drip",
      "set-hidroponik-indoor",
    ],
    "set-aquaponik": ["set-aquaponik-mini", "set-aquaponik-medium", "set-aquaponik-komersial"],
    "iot-smart-farming": [
      "iot-sensor-monitor",
      "iot-auto-feeder",
      "iot-smart-controller",
      "iot-paket-lengkap",
    ],
    benih: [
      "benih-sayuran-hidroponik",
      "benih-tanaman-air",
      "benih-buah",
      "benih-media-tanam",
    ],
    "anakan-ikan": [
      "anakan-ikan-lele",
      "anakan-ikan-nila",
      "anakan-ikan-gurami",
      "anakan-ikan-patin",
      "anakan-ikan-hias",
    ],
  };
  const expectedChildren = Object.values(REQUIRED_CHILDREN).flat();
  checkEq(
    expectedChildren.length,
    categories.filter((c) => c.parentSlug !== null).length,
    "Jumlah sub-kategori tidak sesuai dokumen"
  );
  for (const [parent, children] of Object.entries(REQUIRED_CHILDREN)) {
    for (const child of children) {
      const cat = categories.find((c) => c.slug === child);
      check(Boolean(cat), `Sub-kategori wajib hilang: ${child}`);
      if (cat) checkEq(cat.parentSlug, parent, `parentSlug ${child} seharusnya ${parent}`);
    }
  }

  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  for (const cat of categories) {
    check(cat.name.trim().length > 0, `Nama kategori kosong: ${cat.slug}`);
    check(Number.isInteger(cat.sortOrder), `sortOrder kategori bukan integer: ${cat.slug}`);
    check(cat.isActive === true, `Kategori harus aktif: ${cat.slug}`);
    if (cat.parentSlug !== null) {
      checkEq(typeof cat.parentSlug, "string", `parentSlug bukan string: ${cat.slug}`);
      check(bySlug.has(cat.parentSlug), `parentId kategori ${cat.slug} menunjuk kategori tak dikenal: ${cat.parentSlug}`);

      // deteksi siklus
      const seen = new Set<string>([cat.slug]);
      let cursor: string | null = cat.parentSlug;
      let depth = 0;
      while (cursor) {
        if (seen.has(cursor)) {
          failures.push(`Siklus parentId terdeteksi pada kategori: ${cat.slug}`);
          break;
        }
        seen.add(cursor);
        cursor = bySlug.get(cursor)?.parentSlug ?? null;
        depth += 1;
        if (depth > categories.length) {
          failures.push(`Rantai parentId terlalu panjang (kemungkinan siklus): ${cat.slug}`);
          break;
        }
      }
    }
  }

  // ---- produk
  check(
    products.length >= 31,
    `Jumlah produk minimal 31 (dapat ${products.length})`
  );

  const prodSlugs = products.map((p) => p.slug);
  const prodSkus = products.map((p) => p.sku);
  checkEq(new Set(prodSlugs).size, prodSlugs.length, "Slug produk ada yang duplikat");
  for (const d of duplicates(prodSlugs)) failures.push(`Slug produk duplikat: ${d}`);
  checkEq(new Set(prodSkus).size, prodSkus.length, "SKU produk ada yang duplikat");
  for (const d of duplicates(prodSkus)) failures.push(`SKU produk duplikat: ${d}`);

  const prodSkuSet = new Set(prodSkus);
  const skuRe = /^JF-(TMB|HDR|AQP|IOT|BNH|ANK)-[A-Z0-9]+-\d{3}$/;
  const catCount: Record<string, number> = {};
  const variantProductSlugs: string[] = [];
  const allVariantSkus: string[] = [];
  let imageTotal = 0;
  let variantTotal = 0;

  for (const p of products) {
    const label = p.slug;

    check(skuRe.test(p.sku), `Format SKU tidak sesuai JF-[KODE]-[TIPE]-[NNN]: ${label} -> ${p.sku}`);
    check(p.slug === p.slug.toLowerCase().replace(/\s+/g, "-"), `Slug tidak rapi: ${label}`);
    check(p.name.trim().length > 0, `Nama produk kosong: ${label}`);
    check(p.name.length <= 255, `Nama produk melebihi 255 karakter: ${label}`);
    check(typeof p.description === "string" && p.description.trim().length >= 20, `Deskripsi terlalu pendek: ${label}`);
    check(typeof p.shortDesc === "string" && p.shortDesc.trim().length > 0, `shortDesc kosong: ${label}`);
    check(p.shortDesc.length <= 500, `shortDesc melebihi 500 karakter: ${label}`);
    check(p.sku.length <= 50, `SKU melebihi 50 karakter: ${label}`);

    check(bySlug.has(p.categorySlug), `Produk ${label} menunjuk kategori tak dikenal: ${p.categorySlug}`);
    catCount[p.categorySlug] = (catCount[p.categorySlug] ?? 0) + 1;

    check(p.basePrice > 0, `Harga produk harus > 0: ${label}`);
    if (p.discountPrice !== undefined) {
      check(p.discountPrice > 0, `Harga diskon harus > 0: ${label}`);
      check(p.discountPrice < p.basePrice, `Harga diskon harus lebih murah dari harga dasar: ${label}`);
    }
    check(p.basePrice >= 5000 && p.basePrice <= 20000000, `Harga di luar rentang strategi harga: ${label} -> ${p.basePrice}`);

    check(Number.isInteger(p.weightGram) && p.weightGram > 0, `weightGram harus > 0: ${label}`);
    check(Number.isInteger(p.stock) && p.stock >= 0, `stock tidak valid: ${label}`);
    check(p.isActive === true, `Produk harus aktif: ${label}`);

    check(p.tags.length > 0, `Produk tanpa tag: ${label}`);
    for (const tag of p.tags) {
      check(officialTags.includes(tag), `Tag tidak resmi "${tag}" pada produk ${label}`);
    }
    checkEq(new Set(p.tags).size, p.tags.length, `Tag duplikat pada produk ${label}`);

    check(typeof p.metaTitle === "string" && p.metaTitle.trim().length > 0, `metaTitle kosong: ${label}`);
    check(p.metaTitle.length <= 255, `metaTitle melebihi 255 karakter: ${label}`);
    check(typeof p.metaDesc === "string" && p.metaDesc.trim().length > 0, `metaDesc kosong: ${label}`);
    check(p.metaDesc.length <= 500, `metaDesc melebihi 500 karakter: ${label}`);

    // gambar: 1..4 baris, tepat satu primary, sortOrder berurutan, url placeholder
    check(
      p.images.length >= 1 && p.images.length <= 4,
      `Jumlah gambar harus 1-4: ${label} -> ${p.images.length}`
    );
    checkEq(p.images.filter((i) => i.isPrimary).length, 1, `Harus tepat 1 gambar primary: ${label}`);
    const sorted = [...p.images].sort((a, b) => a.sortOrder - b.sortOrder);
    sorted.forEach((img, index) => {
      checkEq(img.sortOrder, index, `sortOrder gambar tidak berurutan: ${label}`);
      check(
        img.url === `/images/products/${p.slug}-${index + 1}.jpg`,
        `URL gambar tidak sesuai pola placeholder: ${label} -> ${img.url}`
      );
      check(typeof img.altText === "string" && img.altText.trim().length > 0, `altText gambar kosong: ${label}`);
    });
    const primary = p.images.find((i) => i.isPrimary);
    if (primary) checkEq(primary.sortOrder, 0, `Gambar primary harus sortOrder 0: ${label}`);
    imageTotal += p.images.length;

    // varian
    if (p.variants.length > 0) {
      variantProductSlugs.push(p.slug);
      const vSkus = p.variants.map((v) => v.sku);
      checkEq(new Set(vSkus).size, vSkus.length, `SKU varian duplikat di produk ${label}`);
      for (const v of p.variants) {
        allVariantSkus.push(v.sku);
        check(!prodSkuSet.has(v.sku), `SKU varian bentrok dengan SKU produk: ${v.sku}`);
        check(v.sku.startsWith(`${p.sku}-`), `SKU varian harus berawalan SKU produk: ${v.sku}`);
        check(v.sku.length <= 50, `SKU varian melebihi 50 karakter: ${v.sku}`);
        check(v.name.trim().length > 0, `Nama varian kosong di ${label}`);
        check(v.name.length <= 100, `Nama varian melebihi 100 karakter: ${v.sku}`);
        check(Number.isFinite(v.priceModifier), `priceModifier tidak valid: ${v.sku}`);
        check(p.basePrice + v.priceModifier > 0, `Harga efektif varian harus > 0: ${v.sku}`);
        check(Number.isInteger(v.stock) && v.stock >= 0, `stock varian tidak valid: ${v.sku}`);
        check(
          v.attributes !== null && typeof v.attributes === "object" && !Array.isArray(v.attributes),
          `attributes varian harus objek JSON: ${v.sku}`
        );
        check(Object.keys(v.attributes ?? {}).length > 0, `attributes varian kosong: ${v.sku}`);
      }
      variantTotal += p.variants.length;
    }
  }

  // pemetaan kategori produk harus benar-benar ada & tidak boleh kategori bersub-kategori
  for (const [slug, count] of Object.entries(catCount)) {
    const cat = bySlug.get(slug);
    if (cat) {
      check(
        cat.parentSlug === null,
        `Produk ditempel ke sub-kategori (${slug}) - API /api/products memfilter slug persis, jadi produk bisa "hilang" dari kategori induk`
      );
    }
    notes.push(`  ${slug}: ${count} produk`);
  }

  checkEq(new Set(allVariantSkus).size, allVariantSkus.length, "SKU varian duplikat antar produk");
  for (const d of duplicates(allVariantSkus)) failures.push(`SKU varian duplikat: ${d}`);

  check(
    variantProductSlugs.length >= 8,
    `Minimal 8 produk harus punya varian (dapat ${variantProductSlugs.length})`
  );
  const maxVariants = Math.max(...products.map((p) => p.variants.length));
  check(maxVariants >= 3, `Minimal satu produk harus punya 3 varian (maksimum sekarang ${maxVariants})`);

  const featured = products.filter((p) => p.isFeatured).map((p) => p.slug);
  check(featured.length >= 6 && featured.length <= 8, `Produk unggulan harus 6-8 (dapat ${featured.length})`);

  // target jumlah produk per kategori root sesuai dokumen
  const TARGETS: Record<string, number> = {
    "set-tambak": 5,
    "set-hidroponik": 5,
    "set-aquaponik": 3,
    "iot-smart-farming": 7,
    benih: 4,
    "anakan-ikan": 7,
  };
  for (const [slug, target] of Object.entries(TARGETS)) {
    check(
      (catCount[slug] ?? 0) >= target,
      `Kategori ${slug} harus punya minimal ${target} produk (dapat ${catCount[slug] ?? 0})`
    );
  }

  // pastikan 13 slug produk lama tetap ada (tidak boleh hilang saat menambah data)
  const LEGACY_SLUGS = [
    "set-tambak-lele-starter",
    "set-tambak-nila-premium",
    "set-tambak-udang-vaname",
    "set-hidroponik-nft-6-lubang",
    "set-hidroponik-dwc-12-lubang",
    "set-hidroponik-indoor-mini",
    "sensor-ph-meter-digital",
    "paket-iot-kolam-lengkap",
    "benih-pakcoy-premium",
    "benih-selada-hijau",
    "benih-lele-sangkuriang",
    "benih-nila-gift",
  ];
  for (const legacy of LEGACY_SLUGS) {
    check(prodSlugs.includes(legacy), `Produk lama hilang (slug tidak boleh berubah): ${legacy}`);
  }

  // ---- laporan
  const lines: string[] = [];
  lines.push("=== Validasi seed JagoFarm ===");
  lines.push(`Sumber data            : prisma/seed.ts (blok @DATA)`);
  lines.push(`Kategori               : ${categories.length} (root ${rootCount}, sub ${categories.length - rootCount})`);
  lines.push(`Produk                 : ${products.length}`);
  lines.push(`Produk dengan varian   : ${variantProductSlugs.length}`);
  lines.push(`Varian                 : ${variantTotal}`);
  lines.push(`Gambar                 : ${imageTotal}`);
  lines.push(`Produk unggulan        : ${featured.length}`);
  lines.push("");
  lines.push("Produk per kategori:");
  lines.push(...notes);
  lines.push("");
  if (failures.length === 0) {
    lines.push("VALID: semua pemeriksaan lolos.");
  } else {
    lines.push(`TIDAK VALID: ${failures.length} masalah ditemukan:`);
    for (const f of failures) lines.push(`  - ${f}`);
  }
  console.log(lines.join("\n"));

  if (failures.length > 0) process.exit(1);
}

main();
