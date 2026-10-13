/**
 * E2E alur pembayaran Mayar (lokal, tanpa API key asli):
 *   cart -> order -> create payment -> simulasi bayar -> webhook -> order lunas
 *
 * AUTENTIKASI (bypass sudah dihapus — script ini login sungguhan):
 *   Script memakai endpoint token Supabase (grant_type=password) dengan
 *   kredensial uji dari env E2E_EMAIL / E2E_PASSWORD, lalu membentuk cookie
 *   sesi `sb-<project-ref>-auth-token` (format @supabase/ssr cookie-based auth)
 *   dan mengirimnya di header Cookie setiap request ke dev server. Tidak ada
 *   jalur bypass di aplikasi: kalau env kredensial salah, permintaan ditolak 401.
 *   Header Authorization: Bearer TIDAK dipakai karena route API membaca sesi
 *   dari cookie Supabase (src/lib/supabase/server.ts), bukan dari header.
 *
 * Prasyarat (di terminal terpisah / background):
 *   1. node scripts/mock-mayar-server.mjs 4599  (MAYAR_API_KEY=e2e-stub-key)
 *   2. dev server port 3100 dengan env:
 *      MAYAR_BASE_URL=http://127.0.0.1:4599/hl/v2
 *      MAYAR_API_KEY=e2e-stub-key MAYAR_WEBHOOK_SECRET=e2e-secret
 *      RAJAONGKIR_API_KEY=(kosong -> ongkir mock) EMAIL_DISABLED=true
 *      NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY (dari .env)
 *   3. kredensial login uji — bisa lewat shell atau .env/.env.local:
 *      E2E_EMAIL=pelanggan@contoh.id E2E_PASSWORD=rahasia
 *      akun harus sudah terdaftar di Supabase Auth (dan punya baris users;
 *      baris itu dibuat otomatis saat request pertama yang terautentikasi).
 *
 * Jalankan: npx tsx scripts/e2e-mayar-flow.ts
 *
 * Skenario sengaja mencakup kasus NEGATIF: nominal dibuat tidak cocok
 * -> webhook tidak boleh melunasi order. Setelah itu baru lunas.
 * Semua jejak (order, stok, cart) dibersihkan/dikembalikan di akhir.
 */
import { PrismaClient } from "@prisma/client";

const BASE = "http://127.0.0.1:3100";
const MOCK = "http://127.0.0.1:4599";
const WEBHOOK_SECRET = "e2e-secret";

/** Batas potongan cookie @supabase/ssr (utils/chunker.ts). */
const MAX_CHUNK_SIZE = 3180;

const prisma = new PrismaClient();

function fail(message: string): never {
  // Sengaja throw (bukan process.exit) supaya blok cleanup di finally tetap jalan.
  throw new Error(message);
}

/** Baca .env lalu .env.local (nilai dari shell tetap menang). */
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
      // File opsional — andalkan process.env.
    }
  }
}

function readEnv(key: string): string {
  return (process.env[key] ?? "").trim();
}

/** base64url tanpa padding (alfabet yang sama dengan @supabase/ssr). */
function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

interface SessionCookie {
  name: string;
  value: string;
}

/**
 * Bentuk cookie yang ditulis @supabase/ssr untuk Supabase Auth:
 *   `sb-<project-ref>-auth-token` = "base64-" + base64url(JSON session),
 * dipecah jadi `<name>.0`, `<name>.1`, … kalau lebih panjang dari satu cookie.
 */
function buildSessionCookies(session: unknown): SessionCookie[] {
  const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const name = `sb-${projectRef}-auth-token`;
  const encoded = `base64-${toBase64Url(JSON.stringify(session))}`;
  if (encoded.length <= MAX_CHUNK_SIZE) return [{ name, value: encoded }];
  const cookies: SessionCookie[] = [];
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

/**
 * Login Supabase asli lewat endpoint token (grant_type=password).
 *
 * Header `apikey` wajib; responsnya adalah objek session yang persis disimpan
 * browser di cookie — jadi session yang sama bisa disusun ulang untuk script.
 */
async function signIn(): Promise<E2eSession> {
  await loadEnvFiles();

  const email = readEnv("E2E_EMAIL");
  const password = process.env.E2E_PASSWORD ?? "";
  const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/+$/, "");
  const anonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const missing = [
    !email && "E2E_EMAIL",
    !password && "E2E_PASSWORD",
    !supabaseUrl && "NEXT_PUBLIC_SUPABASE_URL",
    !anonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ].filter(Boolean) as string[];
  if (missing.length > 0) {
    fail(`env belum lengkap: ${missing.join(", ")} (lihat docblock script).`);
  }

  let response: Response;
  try {
    response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch (error) {
    fail(`tidak bisa menghubungi Supabase (${supabaseUrl}): ${error instanceof Error ? error.message : String(error)}`);
  }

  const payload = (await response.json().catch(() => null)) as null | Record<string, unknown>;
  if (!response.ok || !payload?.access_token) {
    const hint = payload && typeof payload.error_description === "string" ? payload.error_description : JSON.stringify(payload);
    fail(`login Supabase gagal (HTTP ${response.status}) untuk ${email}: ${hint}`);
  }

  const supabaseUserId = typeof payload.user === "object" && payload.user
    ? String((payload.user as { id?: unknown }).id ?? "")
    : "";

  return {
    email,
    supabaseUserId,
    cookieHeader: buildSessionCookies(payload).map((c) => `${c.name}=${c.value}`).join("; "),
  };
}

let cookieHeader = "";

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

async function main() {
  // ── 0. Login sungguhan → cookie sesi Supabase untuk semua request berikutnya ──
  const session = await signIn();
  cookieHeader = session.cookieHeader;

  const profile = await api("/api/user/profile");
  const profileEmail = (profile.body?.user?.email ?? profile.body?.email) as string | undefined;
  if (profile.status !== 200 || !profileEmail) {
    fail(
      `autentikasi ditolak dev server: HTTP ${profile.status} ${JSON.stringify(profile.body).slice(0, 300)}` +
        " (E2E_EMAIL/E2E_PASSWORD benar? dev server memakai NEXT_PUBLIC_SUPABASE_URL yang sama?)"
    );
  }
  if (profileEmail.toLowerCase() !== session.email.toLowerCase()) {
    fail(`sesi tidak sesuai: server melihat ${profileEmail}, login sebagai ${session.email}`);
  }
  console.log(`0. login OK (${profileEmail})`);

  // ── Persiapan: pilih produk valid & snapshot stok + cart customer ──
  const products = await prisma.product.findMany({
    where: { isActive: true, basePrice: { gt: 0 }, weightGram: { gt: 0 } },
    take: 1,
    select: { id: true, name: true, stock: true, weightGram: true },
  });
  const product = products[0];
  if (!product) fail("tidak ada produk valid di katalog");

  const customer = await prisma.user.findFirst({
    where: {
      OR: [
        session.supabaseUserId ? { supabaseId: session.supabaseUserId } : undefined,
        { email: session.email.toLowerCase() },
      ].filter(Boolean) as { supabaseId?: string; email: string }[],
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!customer) fail(`tidak ada baris users untuk ${session.email}`);

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
