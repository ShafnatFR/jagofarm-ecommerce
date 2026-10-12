/**
 * E2E alur pembayaran Mayar (lokal, tanpa API key asli):
 *   cart -> order -> create payment -> simulasi bayar -> webhook -> order lunas
 *
 * Prasyarat (di terminal terpisah / background):
 *   1. node scripts/mock-mayar-server.mjs 4599  (MAYAR_API_KEY=e2e-stub-key)
 *   2. dev server port 3100 dengan env:
 *      CUSTOMER_E2E_BYPASS=true MAYAR_BASE_URL=http://127.0.0.1:4599/hl/v2
 *      MAYAR_API_KEY=e2e-stub-key MAYAR_WEBHOOK_SECRET=e2e-secret
 *      RAJAONGKIR_API_KEY=(kosong -> ongkir mock) EMAIL_DISABLED=true
 *
 * Jalankan: npx tsx scripts/e2e-mayar-flow.ts
 *
 * Skenario sengaja mencakup kasus NEGATIF: nominal dibuat tidak cocok
 * -> webhook tidak boleh melunaskan order. Setelah itu baru lunas.
 * Semua jejak (order, stok, cart) dibersihkan/dikembalikan di akhir.
 */
import { PrismaClient } from "@prisma/client";

const BASE = "http://127.0.0.1:3100";
const MOCK = "http://127.0.0.1:4599";
const WEBHOOK_SECRET = "e2e-secret";

const prisma = new PrismaClient();

function fail(message: string): never {
  // Sengaja throw (bukan process.exit) supaya blok cleanup di finally tetap jalan.
  throw new Error(message);
}

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

async function main() {
  // ── 0. Pilih produk valid & snapshot stok + cart customer ──
  const products = await prisma.product.findMany({
    where: { isActive: true, basePrice: { gt: 0 }, weightGram: { gt: 0 } },
    take: 1,
    select: { id: true, name: true, stock: true, weightGram: true },
  });
  const product = products[0];
  if (!product) fail("tidak ada produk valid di katalog");

  const customer = await prisma.user.findFirst({
    where: { role: "customer" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!customer) fail("tidak ada user customer di DB");

  const cartSnapshot = await prisma.cartItem.findMany({
    where: { cart: { userId: customer.id } },
    select: { id: true, productId: true, variantId: true, quantity: true },
  });
  await prisma.cartItem.deleteMany({ where: { cart: { userId: customer.id } } });
  console.log(`produk: ${product.name} (stok ${product.stock}) | cart customer dikosongkan (${cartSnapshot.length} item disimpan)`);

  // ── 1. Tambah ke cart via API ──
  let r = await api("/api/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId: product.id, quantity: 1 }),
  });
  if (r.status !== 200 && r.status !== 201) fail(`tambah cart: HTTP ${r.status} ${JSON.stringify(r.body)}`);
  console.log("1. cart OK");

  // ── 2. Alamat: pakai existing atau buat sementara ──
  r = await api("/api/user/addresses");
  let addresses: { id: string; city: string; cityId: string; districtId: string | null }[] =
    r.body?.addresses ?? [];
  let tempAddressId: string | null = null;
  let orderNumber: string | undefined;
  try {
  if (addresses.length === 0) {
    const created = await api("/api/user/addresses", {
      method: "POST",
      body: JSON.stringify({
        label: "E2E",
        recipientName: "E2E Tester",
        phone: "081234567890",
        province: "Jawa Barat",
        provinceId: "9",
        city: "Kota Bandung",
        cityId: "22",
        district: "Dayeuhkolot",
        districtId: "2201",
        postalCode: "40257",
        detail: "Alamat sementara uji E2E",
      }),
    });
    if (created.status !== 200 && created.status !== 201) fail(`buat alamat: HTTP ${created.status} ${JSON.stringify(created.body)}`);
    tempAddressId = (created.body?.address?.id ?? created.body?.id) as string;
    addresses = [{ id: tempAddressId, city: "Kota Bandung", cityId: "22", districtId: "2201" }];
  }
  const address = addresses[0];
  console.log(`2. alamat OK (${address.id})`);

  // ── 3. Ongkir (mock) ──
  r = await api("/api/shipping/cost", {
    method: "POST",
    body: JSON.stringify({
      destinationCity: address.city,
      destinationCityId: address.cityId,
      destinationDistrictId: address.districtId,
      weight: product.weightGram ?? 500,
    }),
  });
  const options: { courier: string; service: string; cost: number }[] =
    (r.body?.results ?? r.body?.costs ?? []).filter(
      (o: { cost?: number }) => typeof o?.cost === "number"
    );
  const jne = options.find((o) => o.courier?.toLowerCase() === "jne" && o.service === "REG") ?? options[0];
  if (!jne) fail(`opsi ongkir kosong: ${JSON.stringify(r.body).slice(0, 300)}`);
  console.log(`3. ongkir OK (${jne.courier} ${jne.service} Rp${jne.cost})`);

  // ── 4. Buat order ──
  r = await api("/api/orders", {
    method: "POST",
    body: JSON.stringify({
      shippingAddressId: address.id,
      shippingCourier: jne.courier,
      shippingService: jne.service,
      shippingCost: jne.cost,
      insurance: true,
      paymentMethod: "mayar",
      notes: "order uji E2E",
    }),
  });
  orderNumber = r.body?.order?.orderNumber ?? r.body?.orderNumber;
  if ((r.status !== 200 && r.status !== 201) || !orderNumber) fail(`buat order: HTTP ${r.status} ${JSON.stringify(r.body).slice(0, 400)}`);
  console.log(`4. order OK (${orderNumber})`);

    // ── 5. Create payment (Mayar stub) ──
    r = await api("/api/payments/create", {
      method: "POST",
      body: JSON.stringify({ orderNumber }),
    });
    const paymentUrl: string | undefined = r.body?.paymentUrl ?? r.body?.url;
    if (r.status !== 200 || !paymentUrl) fail(`create payment: HTTP ${r.status} ${JSON.stringify(r.body).slice(0, 400)}`);
    console.log(`5. payment created (${paymentUrl})`);

    // ── 6. NEGATIF: webhook berbayar tapi nominal TIDAK cocok -> jangan lunas ──
    const state1 = await (await fetch(`${MOCK}/__state`)).json() as {
      transactions: { id: string; transactionId: string; amount: number; status: string }[];
    };
    // __state mengembalikan ARRAY transaksi; pakai record terakhir (milik run ini).
    const txRecord = state1.transactions[state1.transactions.length - 1];
    const txId = txRecord?.id;
    if (!txId) fail("tidak ada transaksi di mock Mayar");
    await fetch(`${MOCK}/__simulate/paid/${txId}`, { method: "POST" });
    await fetch(`${MOCK}/__simulate/amount/${txId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 1 }),
    });
    let wh = await fetch(`${BASE}/api/payments/webhook/mayar?secret=${WEBHOOK_SECRET}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Mayar asli selalu menyertakan extraData (berisi orderNumber) — tiru bentuk itu.
      body: JSON.stringify({
        event: "payment.received",
        data: { id: txId, transactionId: txRecord.transactionId, status: true, extraData: { orderNumber } },
      }),
    });
    console.log(`6. webhook nominal salah direspon HTTP ${wh.status} ${await wh.text()}`);
    r = await api(`/api/orders/${orderNumber}`);
    if (r.body?.order?.paymentStatus === "paid") fail("order lunas padahal nominal tidak cocok!");
    console.log("   order TETAP belum lunas (verifikasi ulang bekerja)");

    // ── 7. POSITIF: nominal benar -> lunas ──
    const orderRow = await prisma.order.findUnique({ where: { orderNumber }, select: { total: true } });
    await fetch(`${MOCK}/__simulate/amount/${txId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Math.round(Number(orderRow!.total)) }),
    });
    wh = await fetch(`${BASE}/api/payments/webhook/mayar?secret=${WEBHOOK_SECRET}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "payment.received",
        data: { id: txId, transactionId: txRecord.transactionId, status: true, extraData: { orderNumber } },
      }),
    });
    console.log(`7. webhook lunas direspon HTTP ${wh.status} ${await wh.text()}`);
    r = await api(`/api/orders/${orderNumber}`);
    const paidOrder = r.body?.order;
    if (paidOrder?.paymentStatus !== "paid") {
      fail(`order seharusnya lunas, dapat paymentStatus=${paidOrder?.paymentStatus}`);
    }
    console.log(`8. ORDER LUNAS — total Rp${paidOrder.total}, paymentStatus=${paidOrder.paymentStatus}`);
    console.log("\nSEMUA SKENARIO E2E LULUS");
  } finally {
    // ── Cleanup: order + stok + cart ──
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: { id: true, items: { select: { id: true, productId: true, quantity: true } } },
    });
    if (order) {
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
      await prisma.order.delete({ where: { id: order.id } });
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      console.log(`cleanup: order ${orderNumber} dihapus, stok dikembalikan`);
    }
    await prisma.cartItem.deleteMany({ where: { cart: { userId: customer.id } } });
    const cart = await prisma.cart.findUnique({ where: { userId: customer.id }, select: { id: true } });
    if (cart) {
      for (const item of cartSnapshot) {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          },
        });
      }
      console.log(`cleanup: ${cartSnapshot.length} item cart dikembalikan`);
    }
    if (tempAddressId) {
      await prisma.address.deleteMany({ where: { id: tempAddressId, userId: customer.id } });
      console.log("cleanup: alamat sementara dihapus");
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
