import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Data katalog JagoFarm.
 * Sumber struktur & harga: dokumen Products/Product Catalog Structure.md,
 * Set Tambak.md, Set Hidroponik.md, Set Aquaponik.md, IoT.md, Benih.md, Anakan Ikan.md.
 *
 * CATALOG_CATEGORIES dan CATALOG_PRODUCTS sengaja ditulis sebagai objek literal murni
 * (tanpa pemanggilan fungsi) supaya scripts/validate-seed.ts bisa mengekstrak dan
 * memvalidasi isinya tanpa menyentuh database.
 */

export const OFFICIAL_TAGS: string[] = ["bestseller", "new", "starter", "komersial", "ready-stock", "pre-order", "free-shipping"];

export interface SeedCategory {
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  parentSlug: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface SeedImage {
  url: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface SeedVariant {
  name: string;
  sku: string;
  priceModifier: number;
  stock: number;
  attributes: Record<string, string | number>;
}

export interface SeedProduct {
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
  images: SeedImage[];
  variants: SeedVariant[];
}

// ============================================================ DATA KATEGORI
// 6 kategori root + sub-kategori (parentSlug) sesuai Product Catalog Structure.md.
export const CATALOG_CATEGORIES: SeedCategory[] =
  /*@DATA:categories*/
[
  {
    name: "Set Tambak",
    slug: "set-tambak",
    description: "Paket kolam tambak lengkap untuk budidaya ikan air tawar",
    imageUrl: "/placeholder-product.png",
    parentSlug: null,
    sortOrder: 1,
    isActive: true,
  },
  {
    name: "Set Hidroponik",
    slug: "set-hidroponik",
    description: "Kit hidroponik NFT/DWC/Wick/Drip untuk pertanian modern",
    imageUrl: "/placeholder-product.png",
    parentSlug: null,
    sortOrder: 2,
    isActive: true,
  },
  {
    name: "Set Aquaponik",
    slug: "set-aquaponik",
    description: "Sistem terpadu budidaya ikan dan tanaman",
    imageUrl: "/placeholder-product.png",
    parentSlug: null,
    sortOrder: 3,
    isActive: true,
  },
  {
    name: "IoT & Smart Farming",
    slug: "iot-smart-farming",
    description: "Sensor, monitor, dan kontroler otomatis untuk budidaya",
    imageUrl: "/placeholder-product.png",
    parentSlug: null,
    sortOrder: 4,
    isActive: true,
  },
  {
    name: "Benih",
    slug: "benih",
    description: "Benih sayuran, tanaman air, buah, dan media tanam",
    imageUrl: "/placeholder-product.png",
    parentSlug: null,
    sortOrder: 5,
    isActive: true,
  },
  {
    name: "Anakan Ikan",
    slug: "anakan-ikan",
    description: "Benih ikan lele, nila, gurami, patin, dan ikan hias",
    imageUrl: "/placeholder-product.png",
    parentSlug: null,
    sortOrder: 6,
    isActive: true,
  },
  {
    name: "Set Tambak Lele",
    slug: "set-tambak-lele",
    description: "Set kolam dan paket budidaya lele sangkuriang",
    imageUrl: "/placeholder-product.png",
    parentSlug: "set-tambak",
    sortOrder: 1,
    isActive: true,
  },
  {
    name: "Set Tambak Nila",
    slug: "set-tambak-nila",
    description: "Set kolam dan paket budidaya nila",
    imageUrl: "/placeholder-product.png",
    parentSlug: "set-tambak",
    sortOrder: 2,
    isActive: true,
  },
  {
    name: "Set Tambak Gurami",
    slug: "set-tambak-gurami",
    description: "Set kolam dan paket budidaya gurami",
    imageUrl: "/placeholder-product.png",
    parentSlug: "set-tambak",
    sortOrder: 3,
    isActive: true,
  },
  {
    name: "Set Tambak Patin",
    slug: "set-tambak-patin",
    description: "Set kolam dan paket budidaya patin",
    imageUrl: "/placeholder-product.png",
    parentSlug: "set-tambak",
    sortOrder: 4,
    isActive: true,
  },
  {
    name: "Set Tambak Udang",
    slug: "set-tambak-udang",
    description: "Set kolam dan paket budidaya udang vaname",
    imageUrl: "/placeholder-product.png",
    parentSlug: "set-tambak",
    sortOrder: 5,
    isActive: true,
  },
  {
    name: "Sistem NFT",
    slug: "set-hidroponik-nft",
    description: "Sistem Nutrient Film Technique (NFT) siap pakai",
    imageUrl: "/placeholder-product.png",
    parentSlug: "set-hidroponik",
    sortOrder: 1,
    isActive: true,
  },
  {
    name: "Sistem DWC",
    slug: "set-hidroponik-dwc",
    description: "Sistem Deep Water Culture (DWC) untuk sayuran daun",
    imageUrl: "/placeholder-product.png",
    parentSlug: "set-hidroponik",
    sortOrder: 2,
    isActive: true,
  },
  {
    name: "Sistem Wick",
    slug: "set-hidroponik-wick",
    description: "Sistem wick (sumbu) tanpa listrik, cocok pemula",
    imageUrl: "/placeholder-product.png",
    parentSlug: "set-hidroponik",
    sortOrder: 3,
    isActive: true,
  },
  {
    name: "Sistem Drip",
    slug: "set-hidroponik-drip",
    description: "Sistem drip irigasi tetes hemat nutrisi",
    imageUrl: "/placeholder-product.png",
    parentSlug: "set-hidroponik",
    sortOrder: 4,
    isActive: true,
  },
  {
    name: "Set Hidroponik Indoor",
    slug: "set-hidroponik-indoor",
    description: "Set hidroponik indoor dengan lampu grow LED",
    imageUrl: "/placeholder-product.png",
    parentSlug: "set-hidroponik",
    sortOrder: 5,
    isActive: true,
  },
  {
    name: "Set Aquaponik Mini",
    slug: "set-aquaponik-mini",
    description: "Aquaponik rumahan skala mini",
    imageUrl: "/placeholder-product.png",
    parentSlug: "set-aquaponik",
    sortOrder: 1,
    isActive: true,
  },
  {
    name: "Set Aquaponik Medium",
    slug: "set-aquaponik-medium",
    description: "Aquaponik skala rumah besar, sekolah, komunitas",
    imageUrl: "/placeholder-product.png",
    parentSlug: "set-aquaponik",
    sortOrder: 2,
    isActive: true,
  },
  {
    name: "Set Aquaponik Komersial",
    slug: "set-aquaponik-komersial",
    description: "Aquaponik skala bisnis dengan instalasi dan training",
    imageUrl: "/placeholder-product.png",
    parentSlug: "set-aquaponik",
    sortOrder: 3,
    isActive: true,
  },
  {
    name: "Sensor & Monitor",
    slug: "iot-sensor-monitor",
    description: "Sensor pH, DO, suhu, dan TDS untuk monitoring kualitas air",
    imageUrl: "/placeholder-product.png",
    parentSlug: "iot-smart-farming",
    sortOrder: 1,
    isActive: true,
  },
  {
    name: "Auto Feeder",
    slug: "iot-auto-feeder",
    description: "Pemberi pakan otomatis terjadwal",
    imageUrl: "/placeholder-product.png",
    parentSlug: "iot-smart-farming",
    sortOrder: 2,
    isActive: true,
  },
  {
    name: "Smart Controller",
    slug: "iot-smart-controller",
    description: "Kontroler pintar berbasis ESP32",
    imageUrl: "/placeholder-product.png",
    parentSlug: "iot-smart-farming",
    sortOrder: 3,
    isActive: true,
  },
  {
    name: "Paket Lengkap IoT",
    slug: "iot-paket-lengkap",
    description: "Paket IoT lengkap siap pakai dengan training",
    imageUrl: "/placeholder-product.png",
    parentSlug: "iot-smart-farming",
    sortOrder: 4,
    isActive: true,
  },
  {
    name: "Benih Sayuran Hidroponik",
    slug: "benih-sayuran-hidroponik",
    description: "Benih sayuran untuk hidroponik dan tanam langsung",
    imageUrl: "/placeholder-product.png",
    parentSlug: "benih",
    sortOrder: 1,
    isActive: true,
  },
  {
    name: "Benih Tanaman Air",
    slug: "benih-tanaman-air",
    description: "Benih dan stek tanaman air untuk kolam",
    imageUrl: "/placeholder-product.png",
    parentSlug: "benih",
    sortOrder: 2,
    isActive: true,
  },
  {
    name: "Benih Buah",
    slug: "benih-buah",
    description: "Benih tanaman buah untuk kebun dan polibag",
    imageUrl: "/placeholder-product.png",
    parentSlug: "benih",
    sortOrder: 3,
    isActive: true,
  },
  {
    name: "Media Tanam",
    slug: "benih-media-tanam",
    description: "Rockwool, nutrisi AB Mix, dan media tanam lain",
    imageUrl: "/placeholder-product.png",
    parentSlug: "benih",
    sortOrder: 4,
    isActive: true,
  },
  {
    name: "Anakan Lele",
    slug: "anakan-ikan-lele",
    description: "Benih lele sangkuriang siap tebar",
    imageUrl: "/placeholder-product.png",
    parentSlug: "anakan-ikan",
    sortOrder: 1,
    isActive: true,
  },
  {
    name: "Anakan Nila",
    slug: "anakan-ikan-nila",
    description: "Benih nila merah dan nila hitam (gift)",
    imageUrl: "/placeholder-product.png",
    parentSlug: "anakan-ikan",
    sortOrder: 2,
    isActive: true,
  },
  {
    name: "Anakan Gurami",
    slug: "anakan-ikan-gurami",
    description: "Benih gurami siap tebar",
    imageUrl: "/placeholder-product.png",
    parentSlug: "anakan-ikan",
    sortOrder: 3,
    isActive: true,
  },
  {
    name: "Anakan Patin",
    slug: "anakan-ikan-patin",
    description: "Benih patin siap tebar",
    imageUrl: "/placeholder-product.png",
    parentSlug: "anakan-ikan",
    sortOrder: 4,
    isActive: true,
  },
  {
    name: "Anakan Ikan Hias",
    slug: "anakan-ikan-hias",
    description: "Benih ikan hias koi dan mas koki",
    imageUrl: "/placeholder-product.png",
    parentSlug: "anakan-ikan",
    sortOrder: 5,
    isActive: true,
  },
]
  /*@ENDDATA*/;

// ============================================================ DATA PRODUK
export const CATALOG_PRODUCTS: SeedProduct[] =
  /*@DATA:products*/
[
  {
    categorySlug: "set-tambak",
    name: "Set Tambak Lele Starter",
    slug: "set-tambak-lele-starter",
    description: "Paket lengkap untuk memulai budidaya lele dari nol. Sudah termasuk kolam terpal bulat 2x2m dengan frame besi, aerator 2 lubang beserta stone diffuser, filter mekanis, pakan lele PF-1000 2kg, benih lele sangkuriang 100 ekor ukuran 5-7cm, plus panduan budidaya cetak dan akses video tutorial. Tinggal pasang, isi air, dan tebar benih.",
    shortDesc: "Paket lengkap budidaya lele untuk pemula, tanpa ribet cari komponen.",
    basePrice: 1850000,
    discountPrice: 1650000,
    sku: "JF-TMB-LELE-001",
    weightGram: 15000,
    stock: 25,
    isActive: true,
    isFeatured: true,
    tags: ["bestseller", "starter"],
    metaTitle: "Set Tambak Lele Starter - JagoFarm",
    metaDesc: "Paket lengkap budidaya lele untuk pemula, tanpa ribet cari komponen.",
    images: [
      { url: "/placeholder-product.png", altText: "Set Tambak Lele Starter - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Set Tambak Lele Starter - foto 2", sortOrder: 1, isPrimary: false },
      { url: "/placeholder-product.png", altText: "Set Tambak Lele Starter - foto 3", sortOrder: 2, isPrimary: false },
    ],
    variants: [
      { name: "Paket Basic", sku: "JF-TMB-LELE-001-BAS", priceModifier: -150000, stock: 15, attributes: { paket: "Basic", ukuranKolam: "2x2m", kapasitas: "50 ekor", aerator: "2 lubang" } },
      { name: "Paket Standard", sku: "JF-TMB-LELE-001-STD", priceModifier: 0, stock: 25, attributes: { paket: "Standard", ukuranKolam: "2x2m", kapasitas: "100 ekor", aerator: "2 lubang" } },
      { name: "Paket Premium", sku: "JF-TMB-LELE-001-PRM", priceModifier: 1350000, stock: 10, attributes: { paket: "Premium", ukuranKolam: "3x2m", kapasitas: "300 ekor", aerator: "4 lubang" } },
    ],
  },
  {
    categorySlug: "set-tambak",
    name: "Set Tambak Nila Premium",
    slug: "set-tambak-nila-premium",
    description: "Set tambak nila dengan kolam terpal 2x3m, aerator 2 lubang, filter mekanis, pakan nila 3kg, dan benih nila merah 200 ekor. Cocok untuk pembudidaya pemula hingga menengah yang ingin hasil panen lebih cepat dengan manajemen pakan yang rapi.",
    shortDesc: "Paket premium budidaya nila skala rumah tangga serius.",
    basePrice: 2100000,
    sku: "JF-TMB-NILA-001",
    weightGram: 25000,
    stock: 15,
    isActive: true,
    isFeatured: false,
    tags: ["ready-stock"],
    metaTitle: "Set Tambak Nila Premium - JagoFarm",
    metaDesc: "Paket premium budidaya nila skala rumah tangga serius.",
    images: [
      { url: "/placeholder-product.png", altText: "Set Tambak Nila Premium - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Set Tambak Nila Premium - foto 2", sortOrder: 1, isPrimary: false },
      { url: "/placeholder-product.png", altText: "Set Tambak Nila Premium - foto 3", sortOrder: 2, isPrimary: false },
    ],
    variants: [
      { name: "Paket Standard", sku: "JF-TMB-NILA-001-STD", priceModifier: 0, stock: 15, attributes: { paket: "Standard", ukuranKolam: "2x3m", kapasitas: "200 ekor" } },
      { name: "Paket Komersial", sku: "JF-TMB-NILA-001-KOM", priceModifier: 1400000, stock: 6, attributes: { paket: "Komersial", ukuranKolam: "3x4m", kapasitas: "600 ekor" } },
    ],
  },
  {
    categorySlug: "set-tambak",
    name: "Set Tambak Udang Vaname",
    slug: "set-tambak-udang-vaname",
    description: "Paket budidaya udang vaname skala usaha: kolam terpal 4x4m frame heavy duty, aerasi 6 lubang dengan blower, filter biologis lengkap, salinity meter, pakan udang 5kg, PL vaname 5.000 ekor, dan logbook monitoring harian. Ditujukan untuk pembudidaya yang serius menekuni vaname.",
    shortDesc: "Paket budidaya udang vaname dengan aerasi dan biofilter lengkap.",
    basePrice: 4500000,
    sku: "JF-TMB-UDANG-001",
    weightGram: 35000,
    stock: 8,
    isActive: true,
    isFeatured: false,
    tags: ["komersial"],
    metaTitle: "Set Tambak Udang Vaname - JagoFarm",
    metaDesc: "Paket budidaya udang vaname dengan aerasi dan biofilter lengkap.",
    images: [
      { url: "/placeholder-product.png", altText: "Set Tambak Udang Vaname - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Set Tambak Udang Vaname - foto 2", sortOrder: 1, isPrimary: false },
      { url: "/placeholder-product.png", altText: "Set Tambak Udang Vaname - foto 3", sortOrder: 2, isPrimary: false },
    ],
    variants: [
      { name: "Paket Komersial", sku: "JF-TMB-UDANG-001-KOM", priceModifier: 0, stock: 8, attributes: { paket: "Komersial", ukuranKolam: "4x4m", kapasitas: "5.000 ekor", blok: "1 petak" } },
      { name: "Paket Komersial Plus", sku: "JF-TMB-UDANG-001-KPP", priceModifier: 3500000, stock: 3, attributes: { paket: "Komersial Plus", ukuranKolam: "6x4m", kapasitas: "10.000 ekor", blok: "2 petak" } },
    ],
  },
  {
    categorySlug: "set-tambak",
    name: "Set Tambak Gurami",
    slug: "set-tambak-gurami",
    description: "Gurami butuh perawatan ekstra, dan set ini sudah disiapkan untuk itu: kolam tembok atau terpal 3x3m, aerasi dan filter, pakan gurami berupa pelet apung, serta benih gurami 100 ekor. Termasuk panduan cetak perawatan gurami fase pembesaran.",
    shortDesc: "Set budidaya gurami dengan pelet apung dan aerasi memadai.",
    basePrice: 2500000,
    sku: "JF-TMB-GURAMI-001",
    weightGram: 22000,
    stock: 12,
    isActive: true,
    isFeatured: false,
    tags: ["new", "ready-stock"],
    metaTitle: "Set Tambak Gurami - JagoFarm",
    metaDesc: "Set budidaya gurami dengan pelet apung dan aerasi memadai.",
    images: [
      { url: "/placeholder-product.png", altText: "Set Tambak Gurami - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Set Tambak Gurami - foto 2", sortOrder: 1, isPrimary: false },
    ],
    variants: [
      { name: "Paket Standard", sku: "JF-TMB-GURAMI-001-STD", priceModifier: 0, stock: 12, attributes: { paket: "Standard", ukuranKolam: "3x3m", kapasitas: "100 ekor" } },
      { name: "Paket Premium", sku: "JF-TMB-GURAMI-001-PRM", priceModifier: 900000, stock: 5, attributes: { paket: "Premium", ukuranKolam: "4x3m", kapasitas: "250 ekor", aerator: "4 lubang" } },
    ],
  },
  {
    categorySlug: "set-tambak",
    name: "Set Tambak Patin",
    slug: "set-tambak-patin",
    description: "Set budidaya patin untuk kolam terpal 3x3m lengkap dengan aerator 2 lubang, filter mekanis, pakan patin 4kg, dan benih patin 150 ekor ukuran 5-7cm. Patin tumbuh cepat dan tahan terhadap kepadatan tinggi, cocok untuk pemula yang ingin panen cepat.",
    shortDesc: "Paket budidaya patin dengan pakan dan aerasi siap jalan.",
    basePrice: 2750000,
    sku: "JF-TMB-PATIN-001",
    weightGram: 23000,
    stock: 12,
    isActive: true,
    isFeatured: false,
    tags: ["new", "ready-stock"],
    metaTitle: "Set Tambak Patin - JagoFarm",
    metaDesc: "Paket budidaya patin dengan pakan dan aerasi siap jalan.",
    images: [
      { url: "/placeholder-product.png", altText: "Set Tambak Patin - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Set Tambak Patin - foto 2", sortOrder: 1, isPrimary: false },
    ],
    variants: [
      { name: "Paket Standard", sku: "JF-TMB-PATIN-001-STD", priceModifier: 0, stock: 12, attributes: { paket: "Standard", ukuranKolam: "3x3m", kapasitas: "150 ekor" } },
      { name: "Paket Premium", sku: "JF-TMB-PATIN-001-PRM", priceModifier: 850000, stock: 5, attributes: { paket: "Premium", ukuranKolam: "4x3m", kapasitas: "400 ekor" } },
    ],
  },
  {
    categorySlug: "set-hidroponik",
    name: "Set Hidroponik NFT 6 Lubang",
    slug: "set-hidroponik-nft-6-lubang",
    description: "Sistem NFT (Nutrient Film Technique) 6 lubang dengan talang PVC food grade. Paket sudah termasuk netpot 6 pcs, rockwool 1 slab, nutrisi AB Mix A dan B, bibit sayuran 6 bibit, pompa air mini beserta selang, dan manual book. Sistem paling populer untuk hidroponik rumahan karena mudah dirawat.",
    shortDesc: "Sistem NFT siap pakai untuk pemula, panen mulai 3 minggu.",
    basePrice: 850000,
    discountPrice: 750000,
    sku: "JF-HDR-NFT-001",
    weightGram: 8000,
    stock: 42,
    isActive: true,
    isFeatured: true,
    tags: ["bestseller", "starter"],
    metaTitle: "Set Hidroponik NFT 6 Lubang - JagoFarm",
    metaDesc: "Sistem NFT siap pakai untuk pemula, panen mulai 3 minggu.",
    images: [
      { url: "/placeholder-product.png", altText: "Set Hidroponik NFT 6 Lubang - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Set Hidroponik NFT 6 Lubang - foto 2", sortOrder: 1, isPrimary: false },
      { url: "/placeholder-product.png", altText: "Set Hidroponik NFT 6 Lubang - foto 3", sortOrder: 2, isPrimary: false },
    ],
    variants: [
      { name: "Paket 6 Lubang", sku: "JF-HDR-NFT-001-P6", priceModifier: 0, stock: 30, attributes: { jumlahLubang: 6, tingkat: 1, rockwool: "1 slab" } },
      { name: "Paket 12 Lubang", sku: "JF-HDR-NFT-001-P12", priceModifier: 500000, stock: 18, attributes: { jumlahLubang: 12, tingkat: 2, rockwool: "1 slab", timer: "ada" } },
    ],
  },
  {
    categorySlug: "set-hidroponik",
    name: "Set Hidroponik DWC 12 Lubang",
    slug: "set-hidroponik-dwc-12-lubang",
    description: "Sistem DWC (Deep Water Culture) 12 lubang dengan bak styrofoam food grade dan reservoir nutrisi. Termasuk netpot 12 pcs, rockwool dan arang sekam, AB Mix 500ml, aerator 1 lubang beserta stone, bibit sayuran 12 bibit, dan manual book. DWC lebih toleran terhadap kesalahan pemula dibanding NFT.",
    shortDesc: "Sistem DWC 12 lubang, paling mudah dirawat untuk sayuran daun.",
    basePrice: 950000,
    sku: "JF-HDR-DWC-001",
    weightGram: 7000,
    stock: 30,
    isActive: true,
    isFeatured: false,
    tags: ["starter", "ready-stock"],
    metaTitle: "Set Hidroponik DWC 12 Lubang - JagoFarm",
    metaDesc: "Sistem DWC 12 lubang, paling mudah dirawat untuk sayuran daun.",
    images: [
      { url: "/placeholder-product.png", altText: "Set Hidroponik DWC 12 Lubang - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Set Hidroponik DWC 12 Lubang - foto 2", sortOrder: 1, isPrimary: false },
    ],
    variants: [
      { name: "Paket 12 Lubang", sku: "JF-HDR-DWC-001-P12", priceModifier: 0, stock: 30, attributes: { jumlahLubang: 12, kapasitasAir: "40 liter" } },
      { name: "Paket 24 Lubang", sku: "JF-HDR-DWC-001-P24", priceModifier: 650000, stock: 14, attributes: { jumlahLubang: 24, kapasitasAir: "80 liter", aerator: "2 lubang" } },
    ],
  },
  {
    categorySlug: "set-hidroponik",
    name: "Set Hidroponik Indoor LED",
    slug: "set-hidroponik-indoor-mini",
    description: "Set hidroponik indoor lengkap dengan rak besi dan lampu grow LED, sistem NFT 18 lubang total, pompa, timer, serta pH dan TDS meter. Cahaya LED diatur otomatis sehingga tanaman tetap tumbuh optimal meski di dalam ruangan minim cahaya matahari. Pas untuk apartemen dan indoor gardening.",
    shortDesc: "Hidroponik indoor dengan lampu grow LED, cocok apartemen.",
    basePrice: 1800000,
    sku: "JF-HDR-INDOOR-001",
    weightGram: 12000,
    stock: 18,
    isActive: true,
    isFeatured: false,
    tags: ["new", "starter"],
    metaTitle: "Set Hidroponik Indoor LED - JagoFarm",
    metaDesc: "Hidroponik indoor dengan lampu grow LED, cocok apartemen.",
    images: [
      { url: "/placeholder-product.png", altText: "Set Hidroponik Indoor LED - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Set Hidroponik Indoor LED - foto 2", sortOrder: 1, isPrimary: false },
      { url: "/placeholder-product.png", altText: "Set Hidroponik Indoor LED - foto 3", sortOrder: 2, isPrimary: false },
    ],
    variants: [
      { name: "Rak 2 Tingkat", sku: "JF-HDR-INDOOR-001-R2", priceModifier: -300000, stock: 10, attributes: { tingkat: 2, jumlahLubang: 12, led: "60 watt" } },
      { name: "Rak 3 Tingkat", sku: "JF-HDR-INDOOR-001-R3", priceModifier: 0, stock: 18, attributes: { tingkat: 3, jumlahLubang: 18, led: "90 watt" } },
    ],
  },
  {
    categorySlug: "set-hidroponik",
    name: "Set Hidroponik Wick System",
    slug: "set-hidroponik-wick",
    description: "Sistem wick (sumbu) 6 lubang tanpa pompa dan tanpa listrik, jadi bisa diletakkan di mana saja. Termasuk netpot 6 pcs, sumbu kain flanel, AB Mix 250ml, rockwool, bibit sayuran 6 bibit, dan manual book. Pilihan favorit untuk edukasi anak dan sekolah.",
    shortDesc: "Sistem wick tanpa listrik, paling ramah untuk pemula absolut.",
    basePrice: 450000,
    sku: "JF-HDR-WICK-001",
    weightGram: 3000,
    stock: 60,
    isActive: true,
    isFeatured: true,
    tags: ["starter", "bestseller"],
    metaTitle: "Set Hidroponik Wick System - JagoFarm",
    metaDesc: "Sistem wick tanpa listrik, paling ramah untuk pemula absolut.",
    images: [
      { url: "/placeholder-product.png", altText: "Set Hidroponik Wick System - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Set Hidroponik Wick System - foto 2", sortOrder: 1, isPrimary: false },
    ],
    variants: [
      { name: "Paket 6 Lubang", sku: "JF-HDR-WICK-001-P6", priceModifier: 0, stock: 60, attributes: { jumlahLubang: 6, sumbu: "kain flanel", listrik: "tidak perlu" } },
      { name: "Paket 12 Lubang", sku: "JF-HDR-WICK-001-P12", priceModifier: 250000, stock: 25, attributes: { jumlahLubang: 12, sumbu: "kain flanel", listrik: "tidak perlu" } },
    ],
  },
  {
    categorySlug: "set-hidroponik",
    name: "Set Hidroponik Drip 8 Lubang",
    slug: "set-hidroponik-drip",
    description: "Sistem drip irigasi tetes 8 lubang dengan emiter yang bisa diatur debitnya. Cocok untuk tanaman berbuah seperti cabai, tomat, dan melon yang butuh media lebih padat. Termasuk pompa air mini, timer penyiraman, netpot, rockwool, AB Mix 250ml, dan manual book.",
    shortDesc: "Sistem drip tetes hemat nutrisi untuk buah dan cabai.",
    basePrice: 700000,
    sku: "JF-HDR-DRIP-001",
    weightGram: 6000,
    stock: 25,
    isActive: true,
    isFeatured: false,
    tags: ["new"],
    metaTitle: "Set Hidroponik Drip 8 Lubang - JagoFarm",
    metaDesc: "Sistem drip tetes hemat nutrisi untuk buah dan cabai.",
    images: [
      { url: "/placeholder-product.png", altText: "Set Hidroponik Drip 8 Lubang - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Set Hidroponik Drip 8 Lubang - foto 2", sortOrder: 1, isPrimary: false },
    ],
    variants: [
      { name: "Paket 8 Lubang", sku: "JF-HDR-DRIP-001-P8", priceModifier: 0, stock: 25, attributes: { jumlahLubang: 8, debit: "2 liter/jam" } },
      { name: "Paket 16 Lubang", sku: "JF-HDR-DRIP-001-P16", priceModifier: 400000, stock: 12, attributes: { jumlahLubang: 16, debit: "2 liter/jam", timer: "ada" } },
    ],
  },
  {
    categorySlug: "set-aquaponik",
    name: "Set Aquaponik Mini (Rumahan)",
    slug: "set-aquaponik-mini",
    description: "Sistem aquaponik mini untuk rumahan: bak ikan 60 liter food grade, grow bed 2 tingkat dengan media clay ball dan zeolite, pompa air dan aerasi, bibit lele 50 ekor, bibit sayuran 12 bibit (kangkung, selada, basil), bakteri starter nitrifikasi, pH test kit, serta manual book plus video tutorial. Kotoran ikan jadi nutrisi tanaman, tanaman menyaring air untuk ikan.",
    shortDesc: "Aquaponik rumahan: ikan dan sayur tumbuh dari satu sistem.",
    basePrice: 2800000,
    sku: "JF-AQP-MINI-001",
    weightGram: 8000,
    stock: 15,
    isActive: true,
    isFeatured: true,
    tags: ["bestseller", "starter"],
    metaTitle: "Set Aquaponik Mini (Rumahan) - JagoFarm",
    metaDesc: "Aquaponik rumahan: ikan dan sayur tumbuh dari satu sistem.",
    images: [
      { url: "/placeholder-product.png", altText: "Set Aquaponik Mini (Rumahan) - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Set Aquaponik Mini (Rumahan) - foto 2", sortOrder: 1, isPrimary: false },
      { url: "/placeholder-product.png", altText: "Set Aquaponik Mini (Rumahan) - foto 3", sortOrder: 2, isPrimary: false },
    ],
    variants: [
      { name: "Paket Mini", sku: "JF-AQP-MINI-001-MIN", priceModifier: 0, stock: 15, attributes: { kapasitasBak: "60L", jumlahTanaman: 12, tingkatGrowBed: 2 } },
      { name: "Paket Mini Plus", sku: "JF-AQP-MINI-001-MNP", priceModifier: 900000, stock: 8, attributes: { kapasitasBak: "100L", jumlahTanaman: 24, tingkatGrowBed: 3 } },
    ],
  },
  {
    categorySlug: "set-aquaponik",
    name: "Set Aquaponik Medium",
    slug: "set-aquaponik-medium",
    description: "Aquaponik medium dengan bak ikan 200 liter dan grow bed 3 tingkat untuk 36 tanaman, dilengkapi siphon bell auto-drain, pompa dan aerasi 2 lubang, benih lele 200 ekor plus nila 100 ekor, bibit sayuran 36 bibit campur, bakteri starter dan mineral, pH serta ammonia test kit, dan konsultasi 2 kali.",
    shortDesc: "Aquaponik skala rumah besar, sekolah, dan komunitas.",
    basePrice: 5500000,
    sku: "JF-AQP-MED-001",
    weightGram: 18000,
    stock: 8,
    isActive: true,
    isFeatured: false,
    tags: ["bestseller", "komersial"],
    metaTitle: "Set Aquaponik Medium - JagoFarm",
    metaDesc: "Aquaponik skala rumah besar, sekolah, dan komunitas.",
    images: [
      { url: "/placeholder-product.png", altText: "Set Aquaponik Medium - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Set Aquaponik Medium - foto 2", sortOrder: 1, isPrimary: false },
      { url: "/placeholder-product.png", altText: "Set Aquaponik Medium - foto 3", sortOrder: 2, isPrimary: false },
    ],
    variants: [
      { name: "Paket Medium", sku: "JF-AQP-MED-001-MED", priceModifier: 0, stock: 8, attributes: { kapasitasBak: "200L", jumlahTanaman: 36, konsultasi: "2x" } },
      { name: "Paket Medium Plus", sku: "JF-AQP-MED-001-MDP", priceModifier: 2000000, stock: 4, attributes: { kapasitasBak: "400L", jumlahTanaman: 72, konsultasi: "4x" } },
    ],
  },
  {
    categorySlug: "set-aquaponik",
    name: "Set Aquaponik Komersial",
    slug: "set-aquaponik-komersial",
    description: "Sistem aquaponik komersial untuk restoran dan urban farm: bak ikan 1000 liter fiberglass, grow bed 6 tingkat untuk 120+ tanaman, sistem siphon dengan filter mekanis dan biologis, blower serta pompa industrial, monitoring IoT (pH, DO, suhu), benih ikan dan bibit sayuran, instalasi plus training onsite area Jabodetabek, dan garansi 1 tahun.",
    shortDesc: "Aquaponik skala bisnis dengan instalasi, IoT, dan training onsite.",
    basePrice: 15000000,
    sku: "JF-AQP-KOM-001",
    weightGram: 55000,
    stock: 3,
    isActive: true,
    isFeatured: false,
    tags: ["komersial", "pre-order"],
    metaTitle: "Set Aquaponik Komersial - JagoFarm",
    metaDesc: "Aquaponik skala bisnis dengan instalasi, IoT, dan training onsite.",
    images: [
      { url: "/placeholder-product.png", altText: "Set Aquaponik Komersial - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Set Aquaponik Komersial - foto 2", sortOrder: 1, isPrimary: false },
      { url: "/placeholder-product.png", altText: "Set Aquaponik Komersial - foto 3", sortOrder: 2, isPrimary: false },
      { url: "/placeholder-product.png", altText: "Set Aquaponik Komersial - foto 4", sortOrder: 3, isPrimary: false },
    ],
    variants: [
      { name: "Paket Komersial", sku: "JF-AQP-KOM-001-KOM", priceModifier: 0, stock: 3, attributes: { kapasitasBak: "1000L", jumlahTanaman: 120, garansi: "1 tahun" } },
      { name: "Komersial + Instalasi", sku: "JF-AQP-KOM-001-KIN", priceModifier: 2500000, stock: 2, attributes: { kapasitasBak: "1000L", jumlahTanaman: 120, instalasi: "onsite Jabodetabek" } },
      { name: "Komersial 2 Unit", sku: "JF-AQP-KOM-001-K2U", priceModifier: 12000000, stock: 1, attributes: { kapasitasBak: "2x1000L", jumlahTanaman: 240, instalasi: "onsite Jabodetabek" } },
    ],
  },
  {
    categorySlug: "iot-smart-farming",
    name: "Sensor pH Meter Digital",
    slug: "sensor-ph-meter-digital",
    description: "Sensor pH digital dengan probe BNC waterproof IP67, range 0.00-14.00 pH dan akurasi ±0.1 pH. Dilengkapi layar LCD dan buzzer alarm saat pH keluar dari ambang aman. Power bisa dari USB atau baterai AA. Wajib punya untuk menjaga kualitas air kolam maupun nutrisi hidroponik.",
    shortDesc: "Sensor pH digital waterproof, akurasi ±0.1 pH untuk kolam dan hidroponik.",
    basePrice: 285000,
    sku: "JF-IOT-PHMTR-001",
    weightGram: 200,
    stock: 100,
    isActive: true,
    isFeatured: true,
    tags: ["bestseller", "ready-stock"],
    metaTitle: "Sensor pH Meter Digital - JagoFarm",
    metaDesc: "Sensor pH digital waterproof, akurasi ±0.1 pH untuk kolam dan hidroponik.",
    images: [
      { url: "/placeholder-product.png", altText: "Sensor pH Meter Digital - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Sensor pH Meter Digital - foto 2", sortOrder: 1, isPrimary: false },
    ],
    variants: [
    ],
  },
  {
    categorySlug: "iot-smart-farming",
    name: "Sensor DO (Dissolved Oxygen) Digital",
    slug: "sensor-do-digital",
    description: "Sensor Dissolved Oxygen digital dengan probe galvanic, range 0-20 mg/L dan akurasi ±0.3 mg/L. Output LCD plus alarm untuk peringatan dini saat oksigen terlarut turun. Sangat penting untuk tambak padat tebar dan sistem aquaponik agar ikan tidak stres.",
    shortDesc: "Ukur oksigen terlarut 0-20 mg/L, kunci budidaya tambak dan aquaponik.",
    basePrice: 450000,
    sku: "JF-IOT-DO-001",
    weightGram: 250,
    stock: 60,
    isActive: true,
    isFeatured: false,
    tags: ["ready-stock"],
    metaTitle: "Sensor DO (Dissolved Oxygen) Digital - JagoFarm",
    metaDesc: "Ukur oksigen terlarut 0-20 mg/L, kunci budidaya tambak dan aquaponik.",
    images: [
      { url: "/placeholder-product.png", altText: "Sensor DO (Dissolved Oxygen) Digital - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Sensor DO (Dissolved Oxygen) Digital - foto 2", sortOrder: 1, isPrimary: false },
    ],
    variants: [
    ],
  },
  {
    categorySlug: "iot-smart-farming",
    name: "Sensor Suhu Air Digital",
    slug: "sensor-suhu-air-digital",
    description: "Sensor suhu air digital berbasis DS18B20 waterproof dengan range pengukuran -55 sampai 125°C dan akurasi ±0.5°C. Layar LCD menampilkan suhu secara real-time. Cocok untuk memantau suhu kolam, bak aquaponik, maupun reservoir hidroponik.",
    shortDesc: "Sensor DS18B20 waterproof, range -55 sampai 125°C.",
    basePrice: 95000,
    sku: "JF-IOT-TEMP-001",
    weightGram: 120,
    stock: 150,
    isActive: true,
    isFeatured: false,
    tags: ["new", "ready-stock"],
    metaTitle: "Sensor Suhu Air Digital - JagoFarm",
    metaDesc: "Sensor DS18B20 waterproof, range -55 sampai 125°C.",
    images: [
      { url: "/placeholder-product.png", altText: "Sensor Suhu Air Digital - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Sensor Suhu Air Digital - foto 2", sortOrder: 1, isPrimary: false },
    ],
    variants: [
    ],
  },
  {
    categorySlug: "iot-smart-farming",
    name: "Auto Feeder Pakan Otomatis",
    slug: "auto-feeder-pakan-otomatis",
    description: "Auto feeder dengan kapasitas 1kg pakan dan jadwal programmable 1-4 kali per hari untuk pellet ukuran 2-5mm. Body ABS food-grade, ditenagai adapter dengan backup baterai sehingga jadwal tetap jalan saat listrik mati. Pakan lebih terukur, air kolam lebih bersih, dan ikan tumbuh lebih seragam.",
    shortDesc: "Beri pakan otomatis 1-4x sehari, hemat waktu dan pakan.",
    basePrice: 350000,
    sku: "JF-IOT-FEED-001",
    weightGram: 1500,
    stock: 45,
    isActive: true,
    isFeatured: true,
    tags: ["bestseller", "ready-stock"],
    metaTitle: "Auto Feeder Pakan Otomatis - JagoFarm",
    metaDesc: "Beri pakan otomatis 1-4x sehari, hemat waktu dan pakan.",
    images: [
      { url: "/placeholder-product.png", altText: "Auto Feeder Pakan Otomatis - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Auto Feeder Pakan Otomatis - foto 2", sortOrder: 1, isPrimary: false },
      { url: "/placeholder-product.png", altText: "Auto Feeder Pakan Otomatis - foto 3", sortOrder: 2, isPrimary: false },
    ],
    variants: [
    ],
  },
  {
    categorySlug: "iot-smart-farming",
    name: "Smart Controller ESP32",
    slug: "smart-controller-esp32",
    description: "Smart controller berbasis ESP32 dengan relay 4 channel untuk mengontrol pompa, aerator, heater, dan feeder. Menerima input sensor pH, DO, suhu, dan TDS dengan koneksi WiFi dan MQTT, dashboard web app real-time, serta notifikasi alert via WhatsApp atau email. Untuk advanced user dan penggemar IoT.",
    shortDesc: "Kontroler ESP32 dengan relay 4 channel dan dashboard real-time.",
    basePrice: 650000,
    sku: "JF-IOT-CTRL-001",
    weightGram: 800,
    stock: 30,
    isActive: true,
    isFeatured: false,
    tags: ["new", "komersial"],
    metaTitle: "Smart Controller ESP32 - JagoFarm",
    metaDesc: "Kontroler ESP32 dengan relay 4 channel dan dashboard real-time.",
    images: [
      { url: "/placeholder-product.png", altText: "Smart Controller ESP32 - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Smart Controller ESP32 - foto 2", sortOrder: 1, isPrimary: false },
      { url: "/placeholder-product.png", altText: "Smart Controller ESP32 - foto 3", sortOrder: 2, isPrimary: false },
    ],
    variants: [
    ],
  },
  {
    categorySlug: "iot-smart-farming",
    name: "Paket IoT Kolam Lengkap",
    slug: "paket-iot-kolam-lengkap",
    description: "Paket monitoring kolam lengkap: smart controller ESP32, sensor pH, DO, dan suhu, auto feeder, kabel dan konektor siap pasang, setup dashboard, training penggunaan, dan garansi 1 tahun. Notifikasi real-time via WhatsApp sehingga masalah kualitas air bisa ditangani sebelum ikan mati.",
    shortDesc: "Smart controller, sensor pH/DO/suhu, auto feeder, plus training.",
    basePrice: 2200000,
    sku: "JF-IOT-KOLAM-001",
    weightGram: 3000,
    stock: 20,
    isActive: true,
    isFeatured: true,
    tags: ["komersial", "ready-stock"],
    metaTitle: "Paket IoT Kolam Lengkap - JagoFarm",
    metaDesc: "Smart controller, sensor pH/DO/suhu, auto feeder, plus training.",
    images: [
      { url: "/placeholder-product.png", altText: "Paket IoT Kolam Lengkap - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Paket IoT Kolam Lengkap - foto 2", sortOrder: 1, isPrimary: false },
      { url: "/placeholder-product.png", altText: "Paket IoT Kolam Lengkap - foto 3", sortOrder: 2, isPrimary: false },
    ],
    variants: [
      { name: "Paket Standar", sku: "JF-IOT-KOLAM-001-PST", priceModifier: -300000, stock: 10, attributes: { jumlahSensor: 3, autoFeeder: "tidak termasuk", garansi: "1 tahun" } },
      { name: "Paket Lengkap", sku: "JF-IOT-KOLAM-001-PLG", priceModifier: 0, stock: 20, attributes: { jumlahSensor: 3, autoFeeder: "termasuk", garansi: "1 tahun" } },
    ],
  },
  {
    categorySlug: "iot-smart-farming",
    name: "Paket IoT Hidroponik & Aquaponik",
    slug: "paket-iot-hidroponik-aquaponik",
    description: "Paket IoT untuk sistem hidroponik dan aquaponik: smart controller ESP32, sensor pH, TDS, dan suhu, relay untuk kontrol pompa dan lampu LED, dashboard monitoring, training online, dan garansi 1 tahun. Nutrisi dan siklus air terjaga otomatis meski ditinggal kerja.",
    shortDesc: "Otomasi pompa, LED, dan dosing nutrisi untuk hidroponik/aquaponik.",
    basePrice: 1800000,
    sku: "JF-IOT-FULL-002",
    weightGram: 2500,
    stock: 18,
    isActive: true,
    isFeatured: false,
    tags: ["komersial"],
    metaTitle: "Paket IoT Hidroponik & Aquaponik - JagoFarm",
    metaDesc: "Otomasi pompa, LED, dan dosing nutrisi untuk hidroponik/aquaponik.",
    images: [
      { url: "/placeholder-product.png", altText: "Paket IoT Hidroponik & Aquaponik - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Paket IoT Hidroponik & Aquaponik - foto 2", sortOrder: 1, isPrimary: false },
      { url: "/placeholder-product.png", altText: "Paket IoT Hidroponik & Aquaponik - foto 3", sortOrder: 2, isPrimary: false },
    ],
    variants: [
      { name: "Paket Hidroponik", sku: "JF-IOT-FULL-002-HID", priceModifier: 0, stock: 18, attributes: { sensor: "pH, TDS, suhu", kontrol: "pompa & LED" } },
      { name: "Paket Aquaponik", sku: "JF-IOT-FULL-002-AQP", priceModifier: 400000, stock: 9, attributes: { sensor: "pH, DO, suhu", kontrol: "pompa, aerator & LED" } },
    ],
  },
  {
    categorySlug: "benih",
    name: "Benih Pakcoy Premium (100 biji)",
    slug: "benih-pakcoy-premium",
    description: "Benih pakcoy F1 premium dengan daya tumbuh di atas 95 persen. Daun tebal, batang renyah, dan tahan panas sehingga cocok untuk hidroponik maupun tanam langsung di polibag. Sudah dipanen mulai 25 hari setelah semai.",
    shortDesc: "Benih pakcoy F1 daya tumbuh di atas 95%, panen 25 hari.",
    basePrice: 25000,
    sku: "JF-BNH-PAKCOY-001",
    weightGram: 50,
    stock: 500,
    isActive: true,
    isFeatured: true,
    tags: ["bestseller", "ready-stock", "free-shipping"],
    metaTitle: "Benih Pakcoy Premium (100 biji) - JagoFarm",
    metaDesc: "Benih pakcoy F1 daya tumbuh di atas 95%, panen 25 hari.",
    images: [
      { url: "/placeholder-product.png", altText: "Benih Pakcoy Premium (100 biji) - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Benih Pakcoy Premium (100 biji) - foto 2", sortOrder: 1, isPrimary: false },
    ],
    variants: [
    ],
  },
  {
    categorySlug: "benih",
    name: "Benih Selada Hijau (200 biji)",
    slug: "benih-selada-hijau",
    description: "Benih selada hijau untuk hidroponik dengan pertumbuhan cepat dan daya adaptasi tinggi terhadap suhu hangat. Daun lebar dan lembut, cocok untuk salad rumahan. Satu kemasan berisi 200 biji.",
    shortDesc: "Selada hijau cepat panen dan tahan panas, favorit hidroponik.",
    basePrice: 15000,
    sku: "JF-BNH-SELADA-001",
    weightGram: 30,
    stock: 800,
    isActive: true,
    isFeatured: false,
    tags: ["ready-stock", "free-shipping"],
    metaTitle: "Benih Selada Hijau (200 biji) - JagoFarm",
    metaDesc: "Selada hijau cepat panen dan tahan panas, favorit hidroponik.",
    images: [
      { url: "/placeholder-product.png", altText: "Benih Selada Hijau (200 biji) - foto 1", sortOrder: 0, isPrimary: true },
    ],
    variants: [
    ],
  },
  {
    categorySlug: "benih",
    name: "Benih Kangkung (500 biji)",
    slug: "benih-kangkung",
    description: "Benih kangkung darat yang sangat mudah ditanam bahkan untuk pemula. Bisa disemai di rockwool untuk hidroponik atau langsung di tanah. Panen pertama sekitar 21 hari setelah semai. Berisi 500 biji.",
    shortDesc: "Kangkung darat paling mudah ditanam, panen 21 hari.",
    basePrice: 5000,
    sku: "JF-BNH-KGKUNG-001",
    weightGram: 25,
    stock: 1000,
    isActive: true,
    isFeatured: false,
    tags: ["ready-stock", "free-shipping"],
    metaTitle: "Benih Kangkung (500 biji) - JagoFarm",
    metaDesc: "Kangkung darat paling mudah ditanam, panen 21 hari.",
    images: [
      { url: "/placeholder-product.png", altText: "Benih Kangkung (500 biji) - foto 1", sortOrder: 0, isPrimary: true },
    ],
    variants: [
    ],
  },
  {
    categorySlug: "benih",
    name: "Benih Cabe Rawit (100 biji)",
    slug: "benih-cabe-rawit",
    description: "Benih cabe rawit dengan produktivitas tinggi dan buah lebat. Cocok ditanam di pot, polibag, maupun sistem hidroponik drip. Berisi 100 biji dengan viabilitas baik untuk penyemaian manual.",
    shortDesc: "Cabe rawit produktif, cocok pot dan hidroponik drip.",
    basePrice: 7000,
    sku: "JF-BNH-CABE-001",
    weightGram: 25,
    stock: 600,
    isActive: true,
    isFeatured: false,
    tags: ["ready-stock", "free-shipping"],
    metaTitle: "Benih Cabe Rawit (100 biji) - JagoFarm",
    metaDesc: "Cabe rawit produktif, cocok pot dan hidroponik drip.",
    images: [
      { url: "/placeholder-product.png", altText: "Benih Cabe Rawit (100 biji) - foto 1", sortOrder: 0, isPrimary: true },
    ],
    variants: [
    ],
  },
  {
    categorySlug: "benih",
    name: "Benih Tomat Cherry (50 biji)",
    slug: "benih-tomat-cherry",
    description: "Benih tomat cherry dengan buah kecil manis yang berbuah lebat sepanjang musim tanam. Cocok untuk kebun rumah, pot, maupun sistem hidroponik drip. Kemasan berisi 50 biji.",
    shortDesc: "Tomat cherry manis, berbuah lebat sepanjang musim.",
    basePrice: 10000,
    sku: "JF-BNH-TOMAT-001",
    weightGram: 30,
    stock: 450,
    isActive: true,
    isFeatured: false,
    tags: ["new", "ready-stock", "free-shipping"],
    metaTitle: "Benih Tomat Cherry (50 biji) - JagoFarm",
    metaDesc: "Tomat cherry manis, berbuah lebat sepanjang musim.",
    images: [
      { url: "/placeholder-product.png", altText: "Benih Tomat Cherry (50 biji) - foto 1", sortOrder: 0, isPrimary: true },
    ],
    variants: [
    ],
  },
  {
    categorySlug: "benih",
    name: "Benih Eceng Gondok (10 Stek)",
    slug: "benih-eceng-gondok",
    description: "Stek eceng gondok yang cepat berkembang biak. Berfungsi ganda sebagai pakan ternak dan penyerap limbah nutrisi di kolam ikan sehingga air lebih jernih. Satu paket berisi 10 stek segar.",
    shortDesc: "Eceng gondok untuk pakan ternak dan penjernih kolam.",
    basePrice: 5000,
    sku: "JF-BNH-ECENG-001",
    weightGram: 500,
    stock: 300,
    isActive: true,
    isFeatured: false,
    tags: ["ready-stock"],
    metaTitle: "Benih Eceng Gondok (10 Stek) - JagoFarm",
    metaDesc: "Eceng gondok untuk pakan ternak dan penjernih kolam.",
    images: [
      { url: "/placeholder-product.png", altText: "Benih Eceng Gondok (10 Stek) - foto 1", sortOrder: 0, isPrimary: true },
    ],
    variants: [
    ],
  },
  {
    categorySlug: "benih",
    name: "Rockwool Slab 75 Hole",
    slug: "rockwool-slab-75-hole",
    description: "Rockwool slab dengan 75 lubang siap semai, daya ikat air tinggi dan steril sehingga akar tidak mudah busuk. Media semai standar untuk NFT, DWC, maupun wick system. Satu slab bisa dipakai untuk satu siklus tanam penuh.",
    shortDesc: "Rockwool slab 75 lubang, media semai favorit hidroponik.",
    basePrice: 25000,
    sku: "JF-BNH-RW-001",
    weightGram: 600,
    stock: 400,
    isActive: true,
    isFeatured: false,
    tags: ["ready-stock", "free-shipping"],
    metaTitle: "Rockwool Slab 75 Hole - JagoFarm",
    metaDesc: "Rockwool slab 75 lubang, media semai favorit hidroponik.",
    images: [
      { url: "/placeholder-product.png", altText: "Rockwool Slab 75 Hole - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Rockwool Slab 75 Hole - foto 2", sortOrder: 1, isPrimary: false },
    ],
    variants: [
    ],
  },
  {
    categorySlug: "benih",
    name: "AB Mix Nutrisi Hidroponik A+B 1L",
    slug: "ab-mix-nutrisi-ab-1l",
    description: "Nutrisi AB Mix pekat untuk tanaman hidroponik, dikemas dua botol 500ml (A dan B) sehingga total 1 liter. Formula seimbang untuk sayuran daun seperti selada, pakcoy, dan kangkung. Larutan pekat dapat diencerkan sesuai kebutuhan nutrisi tanaman.",
    shortDesc: "Nutrisi AB Mix lengkap untuk sayuran daun, 2 botol 500ml.",
    basePrice: 35000,
    sku: "JF-BNH-ABMIX-001",
    weightGram: 1200,
    stock: 350,
    isActive: true,
    isFeatured: false,
    tags: ["bestseller", "ready-stock"],
    metaTitle: "AB Mix Nutrisi Hidroponik A+B 1L - JagoFarm",
    metaDesc: "Nutrisi AB Mix lengkap untuk sayuran daun, 2 botol 500ml.",
    images: [
      { url: "/placeholder-product.png", altText: "AB Mix Nutrisi Hidroponik A+B 1L - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "AB Mix Nutrisi Hidroponik A+B 1L - foto 2", sortOrder: 1, isPrimary: false },
    ],
    variants: [
    ],
  },
  {
    categorySlug: "anakan-ikan",
    name: "Benih Lele Sangkuriang (100 ekor)",
    slug: "benih-lele-sangkuriang",
    description: "Benih lele sangkuriang ukuran 5-7cm dengan pertumbuhan cepat dan daya tahan tinggi terhadap penyakit. Dikemas plastik oksigen plus kotak styrofoam sehingga aman sampai 12 jam perjalanan. Paling cocok dipadukan dengan Set Tambak Lele JagoFarm agar pakan dan kualitas air tetap terjaga. Isi 100 ekor.",
    shortDesc: "Benih lele 5-7cm, tahan penyakit, dikirim pakai oksigen.",
    basePrice: 50000,
    sku: "JF-ANK-LELE-001",
    weightGram: 900,
    stock: 200,
    isActive: true,
    isFeatured: false,
    tags: ["bestseller", "ready-stock"],
    metaTitle: "Benih Lele Sangkuriang (100 ekor) - JagoFarm",
    metaDesc: "Benih lele 5-7cm, tahan penyakit, dikirim pakai oksigen.",
    images: [
      { url: "/placeholder-product.png", altText: "Benih Lele Sangkuriang (100 ekor) - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Benih Lele Sangkuriang (100 ekor) - foto 2", sortOrder: 1, isPrimary: false },
    ],
    variants: [
    ],
  },
  {
    categorySlug: "anakan-ikan",
    name: "Benih Nila Gift (100 ekor)",
    slug: "benih-nila-gift",
    description: "Benih nila gift (nila hitam) ukuran 5-7cm dengan konversi pakan yang baik dan pertumbuhan seragam. Toleran terhadap kepadatan tinggi dan fluktuasi suhu. Dikirim dengan kemasan oksigen dan styrofoam, isi 100 ekor.",
    shortDesc: "Benih nila gift 5-7cm, konversi pakan baik.",
    basePrice: 60000,
    sku: "JF-ANK-NILA-001",
    weightGram: 900,
    stock: 150,
    isActive: true,
    isFeatured: false,
    tags: ["ready-stock"],
    metaTitle: "Benih Nila Gift (100 ekor) - JagoFarm",
    metaDesc: "Benih nila gift 5-7cm, konversi pakan baik.",
    images: [
      { url: "/placeholder-product.png", altText: "Benih Nila Gift (100 ekor) - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Benih Nila Gift (100 ekor) - foto 2", sortOrder: 1, isPrimary: false },
    ],
    variants: [
    ],
  },
  {
    categorySlug: "anakan-ikan",
    name: "Benih Nila Merah (100 ekor)",
    slug: "benih-nila-merah",
    description: "Benih nila merah ukuran 5-7cm dengan warna menarik dan harga bersaing untuk pembesaran maupun restock kolam. Sudah melewati seleksi ukuran sehingga seragam saat ditebar. Dikemas oksigen dan styrofoam, isi 100 ekor.",
    shortDesc: "Nila merah ukuran 5-7cm, harga bersaing untuk restock.",
    basePrice: 35000,
    sku: "JF-ANK-NILA-002",
    weightGram: 900,
    stock: 180,
    isActive: true,
    isFeatured: false,
    tags: ["bestseller", "ready-stock"],
    metaTitle: "Benih Nila Merah (100 ekor) - JagoFarm",
    metaDesc: "Nila merah ukuran 5-7cm, harga bersaing untuk restock.",
    images: [
      { url: "/placeholder-product.png", altText: "Benih Nila Merah (100 ekor) - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Benih Nila Merah (100 ekor) - foto 2", sortOrder: 1, isPrimary: false },
    ],
    variants: [
    ],
  },
  {
    categorySlug: "anakan-ikan",
    name: "Benih Gurami (20 ekor)",
    slug: "benih-gurami",
    description: "Benih gurami ukuran 5-7cm hasil seleksi kolam pembenihan. Karena ketersediaan mengikuti jadwal panen benih, produk ini bersifat pre-order 3-7 hari. Gurami butuh perawatan lebih sabar, hasil panennya bernilai jual tinggi. Isi 20 ekor.",
    shortDesc: "Benih gurami 5-7cm, dipesan sesuai jadwal panen benih.",
    basePrice: 75000,
    sku: "JF-ANK-GURAMI-001",
    weightGram: 850,
    stock: 90,
    isActive: true,
    isFeatured: false,
    tags: ["pre-order"],
    metaTitle: "Benih Gurami (20 ekor) - JagoFarm",
    metaDesc: "Benih gurami 5-7cm, dipesan sesuai jadwal panen benih.",
    images: [
      { url: "/placeholder-product.png", altText: "Benih Gurami (20 ekor) - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Benih Gurami (20 ekor) - foto 2", sortOrder: 1, isPrimary: false },
    ],
    variants: [
    ],
  },
  {
    categorySlug: "anakan-ikan",
    name: "Benih Patin (100 ekor)",
    slug: "benih-patin",
    description: "Benih patin ukuran 5-7cm yang tumbuh cepat dan tahan kepadatan tinggi. Cocok untuk kolam terpal maupun kolam tanah, dengan pakan terapung berprotein tinggi. Dikirim dalam kemasan oksigen dan styrofoam, isi 100 ekor.",
    shortDesc: "Benih patin 5-7cm, tumbuh cepat di kolam terpal.",
    basePrice: 40000,
    sku: "JF-ANK-PATIN-001",
    weightGram: 900,
    stock: 120,
    isActive: true,
    isFeatured: false,
    tags: ["ready-stock"],
    metaTitle: "Benih Patin (100 ekor) - JagoFarm",
    metaDesc: "Benih patin 5-7cm, tumbuh cepat di kolam terpal.",
    images: [
      { url: "/placeholder-product.png", altText: "Benih Patin (100 ekor) - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Benih Patin (100 ekor) - foto 2", sortOrder: 1, isPrimary: false },
    ],
    variants: [
    ],
  },
  {
    categorySlug: "anakan-ikan",
    name: "Benih Ikan Koi (20 ekor)",
    slug: "benih-koi",
    description: "Benih ikan koi ukuran 5-8cm dengan pola campur, cocok untuk penghuni kolam hias rumahan. Bersifat pre-order 3-7 hari karena dikumpulkan dari petani koi mitra. Dikemas oksigen plus styrofoam box, isi 20 ekor.",
    shortDesc: "Benih koi 5-8cm, pola campur untuk kolam hias.",
    basePrice: 100000,
    sku: "JF-ANK-KOI-001",
    weightGram: 1200,
    stock: 60,
    isActive: true,
    isFeatured: false,
    tags: ["pre-order"],
    metaTitle: "Benih Ikan Koi (20 ekor) - JagoFarm",
    metaDesc: "Benih koi 5-8cm, pola campur untuk kolam hias.",
    images: [
      { url: "/placeholder-product.png", altText: "Benih Ikan Koi (20 ekor) - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Benih Ikan Koi (20 ekor) - foto 2", sortOrder: 1, isPrimary: false },
    ],
    variants: [
    ],
  },
  {
    categorySlug: "anakan-ikan",
    name: "Benih Ikan Mas Koki (5 ekor)",
    slug: "benih-mas-koki",
    description: "Benih ikan mas koki ukuran 3-5cm untuk akuarium maupun kolam hias. Bentuk tubuh menggemaskan dengan sirip yang lebar. Bersifat pre-order 3-7 hari dan dikirim dengan kemasan oksigen dan styrofoam, isi 5 ekor.",
    shortDesc: "Mas koki 3-5cm untuk akuarium dan kolam hias.",
    basePrice: 75000,
    sku: "JF-ANK-MASKOKI-001",
    weightGram: 1000,
    stock: 50,
    isActive: true,
    isFeatured: false,
    tags: ["pre-order"],
    metaTitle: "Benih Ikan Mas Koki (5 ekor) - JagoFarm",
    metaDesc: "Mas koki 3-5cm untuk akuarium dan kolam hias.",
    images: [
      { url: "/placeholder-product.png", altText: "Benih Ikan Mas Koki (5 ekor) - foto 1", sortOrder: 0, isPrimary: true },
      { url: "/placeholder-product.png", altText: "Benih Ikan Mas Koki (5 ekor) - foto 2", sortOrder: 1, isPrimary: false },
    ],
    variants: [
    ],
  },
]
/*@ENDDATA*/;

/** Hasil eksekusi seed, berguna untuk logging & pengujian manual. */
export interface SeedSummary {
  categories: number;
  products: number;
  variants: number;
  images: number;
}

interface SeedProductWithImages extends SeedProduct {
  categorySlug: string;
}

async function seedCategories(): Promise<Map<string, string>> {
  const slugToId = new Map<string, string>();

  // Pass 1: kategori root (tanpa parentId).
  for (const cat of CATALOG_CATEGORIES.filter((c) => !c.parentSlug)) {
    const saved = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        imageUrl: cat.imageUrl,
        parentId: null,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        parentId: null,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
      },
    });
    slugToId.set(saved.slug, saved.id);
  }

  // Pass 2: sub-kategori, parentId diambil dari hasil pass 1.
  for (const cat of CATALOG_CATEGORIES.filter((c) => c.parentSlug)) {
    const parentId = cat.parentSlug ? slugToId.get(cat.parentSlug) : null;
    if (!parentId) {
      throw new Error(
        `Kategori induk "${cat.parentSlug}" untuk "${cat.slug}" tidak ditemukan`
      );
    }

    const saved = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        imageUrl: cat.imageUrl,
        parentId,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        parentId,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
      },
    });
    slugToId.set(saved.slug, saved.id);
  }

  console.log(`Categories seeded: ${slugToId.size}`);
  return slugToId;
}

async function seedProduct(product: SeedProductWithImages, categoryId: string) {
  const { categorySlug: _categorySlug, images, variants, ...scalars } = product;

  const data = {
    ...scalars,
    discountPrice: scalars.discountPrice ?? null,
    categoryId,
  };

  // Upsert by slug: aman dijalankan berulang tanpa membuat duplikat.
  const saved = await prisma.product.upsert({
    where: { slug: product.slug },
    update: data,
    create: data,
  });

  // Gambar: diganti seluruhnya supaya tidak ada baris ganda maupun yatim.
  await prisma.productImage.deleteMany({ where: { productId: saved.id } });
  if (images.length > 0) {
    await prisma.productImage.createMany({
      data: images.map((img) => ({
        productId: saved.id,
        url: img.url,
        altText: img.altText,
        sortOrder: img.sortOrder,
        isPrimary: img.isPrimary,
      })),
    });
  }

  // Varian: varian lama yang tidak lagi ada di daftar dihapus, sisanya di-upsert.
  const variantSkus = variants.map((v) => v.sku);
  await prisma.productVariant.deleteMany({
    where: { productId: saved.id, sku: { notIn: variantSkus } },
  });
  for (const variant of variants) {
    const variantData = {
      productId: saved.id,
      name: variant.name,
      priceModifier: variant.priceModifier,
      stock: variant.stock,
      attributes: variant.attributes,
    };
    await prisma.productVariant.upsert({
      where: { sku: variant.sku },
      update: variantData,
      create: { ...variantData, sku: variant.sku },
    });
  }

  return {
    variants: variants.length,
    images: images.length,
  };
}

async function seedCatalog(): Promise<SeedSummary> {
  const slugToId = await seedCategories();

  let variantCount = 0;
  let imageCount = 0;

  for (const product of CATALOG_PRODUCTS) {
    const categoryId = slugToId.get(product.categorySlug);
    if (!categoryId) {
      throw new Error(
        `Kategori "${product.categorySlug}" untuk produk "${product.slug}" tidak ditemukan`
      );
    }
    const result = await seedProduct(product, categoryId);
    variantCount += result.variants;
    imageCount += result.images;
  }

  const summary: SeedSummary = {
    categories: slugToId.size,
    products: CATALOG_PRODUCTS.length,
    variants: variantCount,
    images: imageCount,
  };

  console.log(
    `Products seeded: ${summary.products} (variants: ${summary.variants}, images: ${summary.images})`
  );

  return summary;
}

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@jagofarm.id" },
    update: {},
    create: {
      name: "Admin JagoFarm",
      email: "admin@jagofarm.id",
      passwordHash: adminPassword,
      role: "admin",
      phone: "081234567890",
    },
  });
  console.log("Admin user created:", admin.email);

  // Create test customer
  const customerPassword = await hash("customer123", 12);
  const customer = await prisma.user.upsert({
    where: { email: "customer@test.com" },
    update: {},
    create: {
      name: "Budi Petani",
      email: "customer@test.com",
      passwordHash: customerPassword,
      role: "customer",
      phone: "081298765432",
      addresses: {
        create: {
          label: "Rumah",
          recipientName: "Budi Petani",
          phone: "081298765432",
          province: "Jawa Barat",
          city: "Bandung",
          district: "Coblong",
          postalCode: "40132",
          detail: "Jl. Dago No. 123",
          isDefault: true,
        },
      },
    },
  });
  console.log("Customer created:", customer.email);

  // Create cart for customer
  await prisma.cart.upsert({
    where: { userId: customer.id },
    update: {},
    create: { userId: customer.id },
  });

  // Kategori + produk + varian + gambar
  const summary = await seedCatalog();

  // Create sample coupon
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      description: "Diskon 10% untuk pelanggan baru",
      discountType: "percentage",
      discountValue: 10,
      minOrderValue: 100000,
      maxDiscount: 50000,
      usageLimit: 100,
      isActive: true,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  await prisma.coupon.upsert({
    where: { code: "HEMAT50K" },
    update: {},
    create: {
      code: "HEMAT50K",
      description: "Potongan Rp 50.000 minimal belanja Rp 500.000",
      discountType: "fixed",
      discountValue: 50000,
      minOrderValue: 500000,
      usageLimit: 50,
      isActive: true,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    },
  });
  console.log("Coupons created");
  console.log(
    `Seeding complete! ${summary.categories} kategori, ${summary.products} produk, ${summary.variants} varian, ${summary.images} gambar.`
  );
}

// Jalankan hanya ketika file ini dieksekusi langsung (npx tsx prisma/seed.ts),
// bukan saat diimpor oleh script lain.
const invokedFile = (process.argv[1] ?? "").replace(/\\/g, "/");
const isDirectRun =
  invokedFile.endsWith("prisma/seed.ts") || invokedFile.endsWith("prisma/seed.js");

if (isDirectRun) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
