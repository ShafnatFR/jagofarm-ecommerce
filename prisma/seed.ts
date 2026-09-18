import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

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

  // Create categories
  const categories = [
    {
      name: "Set Tambak",
      slug: "set-tambak",
      description: "Paket kolam tambak lengkap untuk budidaya ikan",
      sortOrder: 1,
    },
    {
      name: "Set Hidroponik",
      slug: "set-hidroponik",
      description: "Kit hidroponik NFT/DWC/Wick untuk pertanian modern",
      sortOrder: 2,
    },
    {
      name: "Set Aquaponik",
      slug: "set-aquaponik",
      description: "Sistem integrasi ikan dan tanaman",
      sortOrder: 3,
    },
    {
      name: "IoT & Smart Farming",
      slug: "iot-smart-farming",
      description: "Sensor, monitor, dan kontroler otomatis",
      sortOrder: 4,
    },
    {
      name: "Benih",
      slug: "benih",
      description: "Benih sayuran, tanaman air, dan media tanam",
      sortOrder: 5,
    },
    {
      name: "Anakan Ikan",
      slug: "anakan-ikan",
      description: "Benih ikan lele, nila, gurami, patin",
      sortOrder: 6,
    },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories.push(created);
  }
  console.log("Categories created:", createdCategories.length);

  // Create sample products
  const products = [
    // Set Tambak
    {
      categorySlug: "set-tambak",
      name: "Set Tambak Lele Starter",
      slug: "set-tambak-lele-starter",
      description:
        "Paket lengkap untuk memulai budidaya lele. Termasuk kolam terpal 2x2m, aerator 2 lubang, filter sederhana, pakan lele 1kg, benih lele 50 ekor, dan panduan cetak.",
      shortDesc: "Paket lengkap budidaya lele untuk pemula",
      basePrice: 1850000,
      discountPrice: 1650000,
      sku: "JF-TMB-LELE-001",
      weightGram: 15000,
      stock: 25,
      isFeatured: true,
      tags: ["bestseller", "starter"],
    },
    {
      categorySlug: "set-tambak",
      name: "Set Tambak Nila Premium",
      slug: "set-tambak-nila-premium",
      description:
        "Paket premium budidaya nila dengan kolam terpal 3x3m, aerator 4 lubang, filter bio, pakan 5kg, benih nila 100 ekor.",
      shortDesc: "Paket premium budidaya nila skala menengah",
      basePrice: 3200000,
      sku: "JF-TMB-NILA-001",
      weightGram: 25000,
      stock: 15,
      isFeatured: true,
      tags: ["premium"],
    },
    {
      categorySlug: "set-tambak",
      name: "Set Tambak Udang Vaname",
      slug: "set-tambak-udang-vaname",
      description:
        "Paket budidaya udang vaname dengan kolam terpal 4x4m, aerator 6 lubang, biofilter, probiotik, dan benih udang.",
      shortDesc: "Paket budidaya udang vaname komersial",
      basePrice: 5500000,
      sku: "JF-TMB-UDANG-001",
      weightGram: 35000,
      stock: 8,
      tags: ["komersial"],
    },
    // Set Hidroponik
    {
      categorySlug: "set-hidroponik",
      name: "Set Hidroponik NFT 6 Lubang",
      slug: "set-hidroponik-nft-6-lubang",
      description:
        "Sistem NFT (Nutrient Film Technique) 6 lubang. Termasuk pipa PVC, netpot, pompa air, timer, nutrimix A+B, dan benih sayuran.",
      shortDesc: "Sistem hidroponik NFT untuk pemula",
      basePrice: 850000,
      discountPrice: 750000,
      sku: "JF-HDR-NFT-001",
      weightGram: 8000,
      stock: 42,
      isFeatured: true,
      tags: ["bestseller", "starter"],
    },
    {
      categorySlug: "set-hidroponik",
      name: "Set Hidroponik DWC 12 Lubang",
      slug: "set-hidroponik-dwc-12-lubang",
      description:
        "Sistem DWC (Deep Water Culture) 12 lubang dengan reservoir besar. Cocok untuk sayuran daun.",
      shortDesc: "Sistem DWC untuk sayuran daun",
      basePrice: 1200000,
      sku: "JF-HDR-DWC-001",
      weightGram: 12000,
      stock: 30,
      tags: ["starter"],
    },
    {
      categorySlug: "set-hidroponik",
      name: "Set Hidroponik Indoor Mini",
      slug: "set-hidroponik-indoor-mini",
      description:
        "Hidroponik mini untuk indoor dengan lampu grow LED. Cocok untuk apartemen.",
      shortDesc: "Hidroponik mini dengan grow LED",
      basePrice: 650000,
      sku: "JF-HDR-INDOOR-001",
      weightGram: 5000,
      stock: 50,
      tags: ["new"],
    },
    // IoT
    {
      categorySlug: "iot-smart-farming",
      name: "Sensor pH Meter Digital",
      slug: "sensor-ph-meter-digital",
      description:
        "Sensor pH digital dengan akurasi tinggi untuk monitoring kolam dan sistem hidroponik. Waterproof IP67.",
      shortDesc: "Sensor pH digital waterproof",
      basePrice: 285000,
      sku: "JF-IOT-PHMTR-001",
      weightGram: 200,
      stock: 100,
      isFeatured: true,
      tags: ["bestseller"],
    },
    {
      categorySlug: "iot-smart-farming",
      name: "Paket IoT Kolam Lengkap",
      slug: "paket-iot-kolam-lengkap",
      description:
        "Paket monitoring kolam: sensor pH, DO, suhu, WiFi gateway, dashboard online. Real-time alerts via WhatsApp.",
      shortDesc: "Paket monitoring kolam lengkap",
      basePrice: 2500000,
      discountPrice: 2200000,
      sku: "JF-IOT-KOLAM-001",
      weightGram: 3000,
      stock: 20,
      tags: ["premium"],
    },
    // Benih
    {
      categorySlug: "benih",
      name: "Benih Pakcoy Premium (100 biji)",
      slug: "benih-pakcoy-premium",
      description:
        "Benih pakcoy F1 premium, daya tumbuh >95%. Cocok untuk hidroponik dan tanam langsung.",
      shortDesc: "Benih pakcoy F1 daya tumbuh tinggi",
      basePrice: 25000,
      sku: "JF-BNH-PAKCOY-001",
      weightGram: 50,
      stock: 500,
      tags: ["ready-stock"],
    },
    {
      categorySlug: "benih",
      name: "Benih Selada Hijau (200 biji)",
      slug: "benih-selada-hijau",
      description: "Benih selada hijau untuk hidroponik. Cepat panen, tahan panas.",
      shortDesc: "Benih selada hijau cepat panen",
      basePrice: 15000,
      sku: "JF-BNH-SELADA-001",
      weightGram: 30,
      stock: 800,
      tags: ["ready-stock"],
    },
    // Anakan Ikan
    {
      categorySlug: "anakan-ikan",
      name: "Benih Lele Sangkuriang (100 ekor)",
      slug: "benih-lele-sangkuriang",
      description:
        "Benih lele sangkuriang ukuran 5-7cm. Tahan penyakit, pertumbuhan cepat. Dikirim dengan plastik oksigen.",
      shortDesc: "Benih lele sangkuriang unggul",
      basePrice: 50000,
      sku: "JF-ANK-LELE-001",
      weightGram: 500,
      stock: 200,
      tags: ["bestseller"],
    },
    {
      categorySlug: "anakan-ikan",
      name: "Benih Nila Gift (100 ekor)",
      slug: "benih-nila-gift",
      description:
        "Benih nila gift ukuran 5-7cm. Pertumbuhan cepat, konversi pakan baik.",
      shortDesc: "Benih nila gift unggul",
      basePrice: 60000,
      sku: "JF-ANK-NILA-001",
      weightGram: 500,
      stock: 150,
      tags: ["ready-stock"],
    },
  ];

  for (const prod of products) {
    const category = createdCategories.find(
      (c) => c.slug === prod.categorySlug
    );
    if (!category) continue;

    const { categorySlug, ...productData } = prod;

    const created = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: {
        ...productData,
        categoryId: category.id,
        metaTitle: productData.name + " - JagoFarm",
        metaDesc: productData.shortDesc,
      },
    });

    // Create placeholder image
    await prisma.productImage.create({
      data: {
        productId: created.id,
        url: `/images/products/${created.slug}.jpg`,
        altText: created.name,
        sortOrder: 0,
        isPrimary: true,
      },
    });
  }
  console.log("Products created:", products.length);

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

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
