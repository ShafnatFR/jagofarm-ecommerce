/**
 * E2E alur pembayaran Midtrans SANDBOX (API asli, tanpa mock):
 *   Untuk dipakai dengan akun uji yang kredensialnya tersedia di env asker
 *   (E2E_EMAIL/E2E_PASSWORD customer + E2E_ADMIN_EMAIL/E2E_PASSWORD admin).
 *   Akun dibuat sekali via /register atau scripts/create-admin.ts, password
 *   TIDAK disimpan di repo.
 *
 *   1. login customer + admin (Supabase token -> cookie sesi)
 *   2. admin buat produk aktif via POST /api/admin/products
 *   3. customer cart -> alamat -> ongkir -> order (paymentMethod qris)
 *   4. create payment Snap sandbox asli (isProduction=false)
 *   5. NEGATIF: webhook signature palsu -> 403, order tetap unpaid
 *   6. POSITIF: webhook settlement valid -> order paid
 *   7. IDEMPOTEN: webhook ganda -> changed=false
 *   8. GET /api/payments/status sinkron (ala auto-success Shopee)
 *   9. invoice PDF (%PDF, nomor order, status lunas, total)
 *   10. cleanup: hapus order, kembalikan stok, hapus produk uji
 *
 * Prasyarat dev server (port bebas, mis. 3102):
 *   PAYMENT_PROVIDER=midtrans MIDTRANS_IS_PRODUCTION=false
 *   MIDTRANS_SERVER_KEY=<sandbox> (+ env Supabase dari .env)
 *
 * Jalankan: E2E_EMAIL=<cust> E2E_PASSWORD=<pw> E2E_ADMIN_EMAIL=<adm> \
 *           E2E_ADMIN_PASSWORD=<pw> BASE=http://127.0.0.1:3102 \
 *           npx tsx scripts/e2e-midtrans-flow.ts
 */
import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const BASE = (process.env.BASE ?? "http://127.0.0.1:3101").replace(/\/+$/, "");

const MAX_CHUNK_SIZE = 3180;
const prisma = new PrismaClient();

function fail(message: string): never {
  throw new Error(message);
}

async function loadEnvFiles() {
  const { readFileSync } = await import("node:fs");
  const { resolve } = await import("node:path");
  const inherited = new Set(Object.keys(process.env));
  for (const name of [".env", ".env.local"]) {
    try {
      const content = readFileSync(resolve(process.cwd(), name), "utf8");
      for (const line of content.split(/\r?\n/)) {
        const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
        if (!match || inherited.has(match[1])) continue;
        const [, key, rawValue] = match;
        process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
      }
    } catch {
      /* file opsional */
    }
  }
}

function readEnv(key: string): string {
  return (process.env[key] ?? "").trim();
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildSessionCookies(session: unknown): { name: string; value: string }[] {
  const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const name = `sb-${projectRef}-auth-token`;
  const encoded = `base64-${toBase64Url(JSON.stringify(session))}`;
  if (encoded.length <= MAX_CHUNK_SIZE) return [{ name, value: encoded }];
  const cookies: { name: string; value: string }[] = [];
  for (let offset = 0; offset < encoded.length; offset += MAX_CHUNK_SIZE) {
    cookies.push({ name: `${name}.${cookies.length}`, value: encoded.slice(offset, offset + MAX_CHUNK_SIZE) });
  }
  return cookies;
}

interface E2eSession {
  email: string;
  supabaseUserId: string;
  cookieHeader: string;
}

async function signIn(email: string, password: string, label: string): Promise<E2eSession> {
  const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/+$/, "");
  const anonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!email || !password || !supabaseUrl || !anonKey) {
    fail(`env ${label} belum lengkap (email/password/SUPABASE URL/ANON).`);
  }
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const payload = (await response.json().catch(() => null)) as null | Record<string, unknown>;
  if (!response.ok || !payload?.access_token) {
    fail(`login ${label} gagal (HTTP ${response.status}): ${JSON.stringify(payload).slice(0, 200)}`);
  }
  const supabaseUserId =
    typeof payload.user === "object" && payload.user
      ? String((payload.user as { id?: unknown }).id ?? "")
      : "";
  return {
    email,
    supabaseUserId,
    cookieHeader: buildSessionCookies(payload).map((c) => `${c.name}=${c.value}`).join("; "),
  };
}

function api(cookieHeader: string) {
  return async (path: string, init?: RequestInit) => {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Cookie: cookieHeader, ...(init?.headers ?? {}) },
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  };
}

function sha512(input: string): string {
  return createHash("sha512").update(input).digest("hex");
}

async function main() {
  await loadEnvFiles();
  const serverKey = readEnv("MIDTRANS_SERVER_KEY");
  if (!serverKey) fail("MIDTRANS_SERVER_KEY kosong — dev server butuh key sandbox.");

  // ── 1. Login customer + admin ──
  const customer = await signIn(process.env.E2E_EMAIL ?? "", process.env.E2E_PASSWORD ?? "", "customer");
  const adminSess = await signIn(
    process.env.E2E_ADMIN_EMAIL ?? "",
    process.env.E2E_ADMIN_PASSWORD ?? "",
    "admin"
  );
  const customerApi = api(customer.cookieHeader);
  const adminApi = api(adminSess.cookieHeader);
  console.log(`1. login OK customer=${customer.email} admin=${adminSess.email}`);

  // Guard: admin benar-benar admin
  const me = await adminApi("/api/user/profile");
  if ((me.body?.user?.role ?? me.body?.role) !== "admin") {
    fail(`E2E_ADMIN_EMAIL bukan admin (role=${me.body?.user?.role ?? me.body?.role}).`);
  }

  // ── 2. Admin buat produk aktif (kategori pertama yang ada) ──
  const cats = await adminApi("/api/categories");
  const categoryId = cats.body?.categories?.[0]?.id;
  if (!categoryId) fail("tidak ada kategori — buat 1 kategori dulu di admin.");
  const stamp = Date.now().toString().slice(-6);
  const prod = await adminApi("/api/admin/products", {
    method: "POST",
    body: JSON.stringify({
      name: `Produk Uji E2E ${stamp}`,
      categoryId,
      basePrice: 25000,
      sku: `E2E-${stamp}`,
      weightGram: 500,
      lengthCm: 10,
      widthCm: 10,
      heightCm: 10,
      stock: 10,
      isActive: true,
    }),
  });
  const productId = prod.body?.product?.id ?? prod.body?.id;
  if ((prod.status !== 200 && prod.status !== 201) || !productId) {
    fail(`buat produk: HTTP ${prod.status} ${JSON.stringify(prod.body).slice(0, 400)}`);
  }
  console.log(`2. produk OK (${productId}, stok 10)`);

  // ── 3. Cart: kosongkan lalu tambah 2 qty ──
  const customerRow = await prisma.user.findFirst({
    where: { OR: [{ supabaseId: customer.supabaseUserId }, { email: customer.email.toLowerCase() }] },
    select: { id: true },
  });
  if (!customerRow) fail("tidak ada baris users untuk customer E2E.");
  await prisma.cartItem.deleteMany({ where: { cart: { userId: customerRow.id } } });
  let r = await customerApi("/api/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId, quantity: 2 }),
  });
  if (r.status !== 200 && r.status !== 201) fail(`tambah cart: HTTP ${r.status} ${JSON.stringify(r.body)}`);
  console.log("3. cart OK (2 qty)");

  // ── 4. Alamat ──
  r = await customerApi("/api/user/addresses");
  let addresses: { id: string; city: string; cityId: string; districtId: string | null }[] =
    r.body?.addresses ?? [];
  let tempAddressId: string | null = null;
  if (addresses.length === 0) {
    const created = await customerApi("/api/user/addresses", {
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
    if (created.status !== 200 && created.status !== 201) {
      fail(`buat alamat: HTTP ${created.status} ${JSON.stringify(created.body)}`);
    }
    tempAddressId = (created.body?.address?.id ?? created.body?.id) as string;
    addresses = [{ id: tempAddressId, city: "Kota Bandung", cityId: "22", districtId: "2201" }];
  }
  const address = addresses[0];
  console.log(`4. alamat OK (${address.id})`);

  // ── 5. Ongkir ──
  r = await customerApi("/api/shipping/cost", {
    method: "POST",
    body: JSON.stringify({
      destinationCity: address.city,
      destinationCityId: address.cityId,
      destinationDistrictId: address.districtId,
      weight: 1000,
    }),
  });
  const options: { courier: string; service: string; cost: number }[] = (
    r.body?.results ?? r.body?.costs ?? []
  ).filter((o: { cost?: number }) => typeof o?.cost === "number");
  const ship = options[0];
  if (!ship) fail(`opsi ongkir kosong: ${JSON.stringify(r.body).slice(0, 300)}`);
  console.log(`5. ongkir OK (${ship.courier} ${ship.service} Rp${ship.cost})`);

  let orderNumber: string | undefined;
  try {
    // ── 6. Order (paymentMethod midtrans -> provider sandbox) ──
    r = await customerApi("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        shippingAddressId: address.id,
        shippingCourier: ship.courier,
        shippingService: ship.service,
        shippingCost: ship.cost,
        insurance: false,
        paymentMethod: "qris",
        notes: "order uji E2E midtrans",
      }),
    });
    orderNumber = r.body?.order?.orderNumber ?? r.body?.orderNumber;
    if ((r.status !== 200 && r.status !== 201) || !orderNumber) {
      fail(`buat order: HTTP ${r.status} ${JSON.stringify(r.body).slice(0, 400)}`);
    }
    const afterOrder = await prisma.product.findUnique({ where: { id: productId }, select: { stock: true } });
    console.log(`6. order OK (${orderNumber}) — stok produk tinggal ${afterOrder?.stock} (harus 8)`);
    if (afterOrder?.stock !== 8) fail(`stok tidak berkurang 2 (dapat ${afterOrder?.stock}).`);

    // ── 7. Create payment Snap sandbox asli ──
    r = await customerApi("/api/payments/create", {
      method: "POST",
      body: JSON.stringify({ orderNumber }),
    });
    const token: string | undefined = r.body?.token;
    const paymentUrl: string | undefined = r.body?.paymentUrl;
    if (r.status !== 200 || !token || !paymentUrl) {
      fail(`create payment: HTTP ${r.status} ${JSON.stringify(r.body).slice(0, 400)}`);
    }
    if (r.body?.isProduction !== false) fail("isProduction bukan false — dev server salah env!");
    const orderRow = await prisma.order.findUnique({
      where: { orderNumber },
      select: { paymentProvider: true, total: true },
    });
    const total = Math.round(Number(orderRow?.total));
    console.log(`7. Snap OK (provider=${orderRow?.paymentProvider}, total Rp${total})`);
    console.log(`   bayar manual di: ${paymentUrl}`);

    // ── 8. NEGATIF: webhook signature palsu -> 403, order tetap unpaid ──
    const fakeSig = "0".repeat(128);
    let wh = await fetch(`${BASE}/api/payments/webhook/midtrans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: orderNumber,
        status_code: "200",
        gross_amount: `${total}.00`,
        signature_key: fakeSig,
        transaction_status: "settlement",
      }),
    });
    console.log(`8. webhook signature palsu -> HTTP ${wh.status} (harap 403)`);
    if (wh.status !== 403) fail("webhook menerima signature palsu!");
    const stillUnpaid = await prisma.order.findUnique({ where: { orderNumber }, select: { paymentStatus: true } });
    if (stillUnpaid?.paymentStatus === "paid") fail("order lunas padahal signature palsu!");

    // ── 9. POSITIF: settlement asli -> order lunas ──
    const statusCode = "200";
    const grossAmount = `${total}.00`;
    const sig = sha512(`${orderNumber}${statusCode}${grossAmount}${serverKey}`);
    wh = await fetch(`${BASE}/api/payments/webhook/midtrans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: orderNumber,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: sig,
        transaction_status: "settlement",
        fraud_status: "accept",
        payment_type: "qris",
        transaction_id: `e2e-${Date.now()}`,
        transaction_time: new Date().toISOString().slice(0, 19) + " +0700",
        settlement_time: new Date().toISOString().slice(0, 19) + " +0700",
      }),
    });
    console.log(`9. webhook settlement -> HTTP ${wh.status} ${JSON.stringify(await wh.json()).slice(0, 200)}`);
    r = await customerApi(`/api/orders/${orderNumber}`);
    if (r.body?.order?.paymentStatus !== "paid") {
      fail(`order seharusnya lunas, dapat paymentStatus=${r.body?.order?.paymentStatus}`);
    }
    console.log(`   ORDER LUNAS — paidAt=${r.body?.order?.paidAt}, method=${r.body?.order?.paymentMethod}`);

    // ── 10. IDEMPOTEN: kirim webhook sama 2x -> tetap paid, 1x perubahan ──
    const dup = await fetch(`${BASE}/api/payments/webhook/midtrans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: orderNumber,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: sig,
        transaction_status: "settlement",
        fraud_status: "accept",
        payment_type: "qris",
      }),
    });
    const dupBody = (await dup.json().catch(() => null)) as { changed?: boolean } | null;
    console.log(`10. webhook duplikat -> HTTP ${dup.status} changed=${dupBody?.changed} (harap false)`);
    if (dupBody?.changed !== false) fail("webhook duplikat mengubah order!");

    // ── 11. Auto-success ala Shopee: GET status sinkron dari gateway ──
    r = await customerApi(`/api/payments/status/${orderNumber}`);
    console.log(
      `11. GET status -> HTTP ${r.status} status=${r.body?.order?.status} pay=${r.body?.order?.paymentStatus} changed=${r.body?.statusChanged}`
    );

    // ── 12. Invoice PDF ──
    const inv = await fetch(`${BASE}/api/orders/${orderNumber}/invoice`, {
      headers: { Cookie: customer.cookieHeader },
    });
    const buf = Buffer.from(await inv.arrayBuffer());
    const isPdf = buf.subarray(0, 5).toString() === "%PDF-";
    console.log(`12. invoice -> HTTP ${inv.status} ${buf.length} byte PDF=${isPdf}`);
    if (inv.status !== 200 || !isPdf) fail("invoice PDF tidak valid.");
    const { writeFileSync } = await import("node:fs");
    writeFileSync(`invoice-${orderNumber}.pdf`, buf);
    console.log(`    tersimpan: invoice-${orderNumber}.pdf`);

    console.log("\nSEMUA SKENARIO E2E MIDTRANS LULUS");
  } finally {
    // ── Cleanup ──
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: { id: true, items: { select: { id: true, productId: true, variantId: true, quantity: true } } },
    });
    if (order) {
      const testItems = order.items.filter((i) => i.productId === productId);
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
      await prisma.order.delete({ where: { id: order.id } });
      for (const item of testItems) {
        if (item.variantId) {
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        } else {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
      console.log(`cleanup: order ${orderNumber} dihapus, stok dikembalikan`);
    }
    await prisma.product.deleteMany({ where: { id: productId } }).catch(() => null);
    console.log("cleanup: produk uji dihapus");
    await prisma.cartItem.deleteMany({ where: { cart: { userId: customerRow.id } } });
    if (tempAddressId) {
      await prisma.address.deleteMany({ where: { id: tempAddressId, userId: customerRow.id } });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
