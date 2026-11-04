/**
 * Rollback seed demo lama → seed baru:
 * - Hapus 10 order [SEED-DEMO] + produk "Paket Uji E2E 367286".
 * - Buat 4 kategori: Hidroponik (pakai yg ada), Akuaponik, IoT Sensor, Nutrisi.
 * - 5 produk, masing-masing 2-3 varian:
 *   1. Kit Hidroponik NFT 20 Lubang (Hidroponik, 2 varian)
 *   2. Benih Selada Romaine (Hidroponik, 3 varian)
 *   3. Kolam Terpal Bioflok D2 (Akuaponik, 2 varian)
 *   4. Sensor pH + TDS Meter (IoT Sensor, 3 varian)
 *   5. Probiotik Akuakultur 1L (Nutrisi, 2 varian)
 * - 10 transaksi tersebar 10 hari: 4 lunas, 3 menunggu, 3 batal.
 * Aman diulang: prefix SEED2- dibersihkan dulu.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TAG = "[SEED2]";

const PLAN = [
  { status: "paid", paymentStatus: "paid", method: "qris", provider: "midtrans", day: 0 },
  { status: "paid", paymentStatus: "paid", method: "bank_transfer", provider: "midtrans", day: 1 },
  { status: "pending", paymentStatus: "unpaid", method: "qris", provider: "midtrans", day: 2 },
  { status: "paid", paymentStatus: "paid", method: "ewallet", provider: "mayar", day: 3 },
  { status: "cancelled", paymentStatus: "unpaid", method: null, provider: "midtrans", day: 4 },
  { status: "pending", paymentStatus: "unpaid", method: "bank_transfer", provider: "midtrans", day: 5 },
  { status: "expired", paymentStatus: "failed", method: "qris", provider: "midtrans", day: 6 },
  { status: "paid", paymentStatus: "paid", method: "qris", provider: "midtrans", day: 7 },
  { status: "cancelled", paymentStatus: "failed", method: "cstore", provider: "midtrans", day: 8 },
  { status: "pending", paymentStatus: "unpaid", method: "qris", provider: "midtrans", day: 9 },
] as const;

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

async function ensureCategory(name: string, slug: string) {
  const found = await prisma.category.findFirst({ where: { slug } });
  if (found) return found;
  return prisma.category.create({ data: { name, slug } });
}

async function main() {
  // ── Rollback seed lama ──
  const oldOrders = await prisma.order.findMany({
    where: { OR: [{ notes: { contains: "[SEED-DEMO]" } }, { notes: { contains: TAG } }] },
    select: { id: true },
  });
  for (const o of oldOrders) {
    await prisma.orderItem.deleteMany({ where: { orderId: o.id } });
  }
  if (oldOrders.length > 0) {
    await prisma.order.deleteMany({ where: { id: { in: oldOrders.map((o) => o.id) } } });
    console.log(`rollback: hapus ${oldOrders.length} order seed`);
  }
  // Produk E2E asli TIDAK dihapus (dipakai order non-seed JF-261103-ED36 dkk).
  // Hanya produk SEED2 lama yang dibersihkan (order seed sudah dihapus di atas).
  const seed2Prod = await prisma.product.findMany({
    where: { sku: { startsWith: "SEED2-" } },
    select: { id: true, name: true },
  });
  for (const prod of seed2Prod) {
    await prisma.productVariant.deleteMany({ where: { productId: prod.id } });
    await prisma.productImage.deleteMany({ where: { productId: prod.id } });
    await prisma.product.delete({ where: { id: prod.id } });
    console.log(`rollback: hapus produk ${prod.name}`);
  }

  // ── 4 kategori ──
  const hidro = await ensureCategory("Hidroponik", "hidroponik");
  const aqua = await ensureCategory("Akuaponik", "akuaponik");
  const iot = await ensureCategory("IoT Sensor", "iot-sensor");
  const nutrisi = await ensureCategory("Nutrisi", "nutrisi");
  console.log("kategori: Hidroponik, Akuaponik, IoT Sensor, Nutrisi");

  // ── 5 produk + varian ──
  const defs: {
    name: string; cat: string; base: number; weight: number;
    variants: { name: string; price: number; stock: number }[];
  }[] = [
    { name: "Kit Hidroponik NFT 20 Lubang", cat: hidro.id, base: 450000, weight: 8000,
      variants: [
        { name: "Paket Basic (tanpa nutrisi)", price: 450000, stock: 10 },
        { name: "Paket Lengkap (+nutrisi+pH meter)", price: 650000, stock: 8 },
      ] },
    { name: "Benih Selada Romaine", cat: hidro.id, base: 15000, weight: 50,
      variants: [
        { name: "50 butir", price: 15000, stock: 100 },
        { name: "200 butir", price: 45000, stock: 60 },
        { name: "500 butir", price: 95000, stock: 40 },
      ] },
    { name: "Kolam Terpal Bioflok D2", cat: aqua.id, base: 850000, weight: 15000,
      variants: [
        { name: "Terpal saja", price: 850000, stock: 6 },
        { name: "Set + aerator + probiotik", price: 1250000, stock: 4 },
      ] },
    { name: "Sensor pH + TDS Meter", cat: iot.id, base: 175000, weight: 300,
      variants: [
        { name: "pH meter saja", price: 175000, stock: 20 },
        { name: "TDS meter saja", price: 125000, stock: 25 },
        { name: "Bundel pH + TDS", price: 275000, stock: 15 },
      ] },
    { name: "Probiotik Akuakultur 1L", cat: nutrisi.id, base: 95000, weight: 1100,
      variants: [
        { name: "1 liter", price: 95000, stock: 30 },
        { name: "5 liter (jeriken)", price: 425000, stock: 12 },
      ] },
  ];

  const created: { id: string; variantIds: string[]; prices: number[] }[] = [];
  for (let i = 0; i < defs.length; i++) {
    const d = defs[i];
    const sku = `SEED2-P${i + 1}`;
    const prod = await prisma.product.create({
      data: {
        categoryId: d.cat,
        name: `${TAG} ${d.name}`,
        slug: `${slugify(d.name)}-seed2`,
        description: `${d.name} — produk demo untuk visual laporan.`,
        basePrice: d.base,
        sku,
        weightGram: d.weight,
        lengthCm: 10, widthCm: 10, heightCm: 10,
        stock: 0,
        hasVariants: true,
        minPrice: Math.min(...d.variants.map((v) => v.price)),
        maxPrice: Math.max(...d.variants.map((v) => v.price)),
        isActive: true,
      },
    });
    const vIds: string[] = [];
    for (let j = 0; j < d.variants.length; j++) {
      const v = d.variants[j];
      const vr = await prisma.productVariant.create({
        data: {
          productId: prod.id,
          name: v.name,
          sku: `${sku}-V${j + 1}`,
          price: v.price,
          stock: v.stock,
          sortOrder: j,
          isActive: true,
        },
      });
      vIds.push(vr.id);
    }
    created.push({ id: prod.id, variantIds: vIds, prices: d.variants.map((v) => v.price) });
    console.log(`produk ${i + 1}. ${d.name} (${d.variants.length} varian)`);
  }

  // ── 10 transaksi: rotasi produk+varian, 1 order/hari ──
  const customer = await prisma.user.findFirst({
    where: { email: "e2e-midtrans-001@jagofarm.test" },
  });
  if (!customer) throw new Error("user E2E tidak ada");
  const address = await prisma.address.findFirst({ where: { userId: customer.id } });
  if (!address) throw new Error("alamat E2E tidak ada");

  const pad = (n: number) => String(n).padStart(2, "0");
  for (let i = 0; i < PLAN.length; i++) {
    const plan = PLAN[i];
    const prod = created[i % created.length];
    const vi = Math.floor(i / created.length) % prod.variantIds.length;
    const price = prod.prices[vi];
    const qty = 1 + (i % 2);
    const subtotal = price * qty;
    const shipping = 6000;
    const total = subtotal + shipping;
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - plan.day);
    createdAt.setHours(10 + (i % 8), 15, 0, 0);
    const d = createdAt;
    const orderNumber = `JF-${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-S${pad(i + 1)}`;
    const paid = plan.paymentStatus === "paid";
    await prisma.order.create({
      data: {
        orderNumber,
        userId: customer.id,
        shippingAddressId: address.id,
        status: plan.status,
        paymentStatus: plan.paymentStatus,
        paymentMethod: plan.method,
        paymentProvider: plan.provider,
        paymentRef: paid ? `SEED2-REF-${i + 1}` : null,
        shippingCourier: "tiki",
        shippingService: "REG",
        shippingCost: shipping,
        subtotal,
        discount: 0,
        total,
        notes: `${TAG} order uji visual #${i + 1}`,
        paidAt: paid ? createdAt : null,
        createdAt,
        items: {
          create: [{
            productId: prod.id,
            variantId: prod.variantIds[vi],
            quantity: qty,
            price,
            total: subtotal,
          }],
        },
      },
    });
    console.log(`${i + 1}. ${orderNumber} ${plan.status}/${plan.paymentStatus} Rp${total.toLocaleString("id-ID")}`);
  }
  console.log("\nSEED2 SELESAI: 5 produk (12 varian), 4 kategori, 10 transaksi");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
