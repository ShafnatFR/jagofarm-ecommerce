/**
 * Sinkron order lunas ke Google Spreadsheet (realtime, best-effort).
 *
 * Kredensial: OAuth akun pemilik sheet, disimpan di Vercel env:
 *   GOOGLE_SHEETS_CLIENT_ID / GOOGLE_SHEETS_CLIENT_SECRET /
 *   GOOGLE_SHEETS_REFRESH_TOKEN / GOOGLE_SHEETS_SPREADSHEET_ID
 *
 * Tanpa depedensi baru: REST langsung (token -> append). Gagal = log saja,
 * tidak menggagalkan webhook pembayaran.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

const TAB_ORDERS = "Orders";
const TAB_ITEMS = "OrderItems";
const TAB_SUMMARY = "Ringkasan";

const ORDER_HEADERS = [
  "Order Number",
  "Tanggal (WIB)",
  "Status",
  "Payment Status",
  "Pelanggan",
  "Email",
  "Telepon",
  "Alamat",
  "Kurir",
  "Layanan",
  "Subtotal",
  "Ongkir",
  "Asuransi",
  "Diskon",
  "Total",
  "Metode Bayar",
  "Provider",
  "Dibayar Pada (WIB)",
];

const ITEM_HEADERS = [
  "Order Number",
  "Produk",
  "Varian",
  "Qty",
  "Harga",
  "Total",
];

const SUMMARY_LABELS = [
  ["Metrik", "Nilai"],
  ["Total Order Lunas", 0],
  ["Total Revenue", 0],
  ["Terakhir Disinkron", ""],
];

interface SyncOrderItem {
  name: string;
  variant?: string | null;
  quantity: number;
  price: number;
  total: number;
}

export interface SyncOrder {
  orderNumber: string;
  createdAt: Date | string;
  status: string;
  paymentStatus: string;
  customerName?: string | null;
  customerEmail?: string | null;
  phone?: string | null;
  address?: string | null;
  courier?: string | null;
  service?: string | null;
  subtotal: number;
  shippingCost: number;
  insuranceFee?: number | null;
  discount?: number | null;
  total: number;
  paymentMethod?: string | null;
  paymentProvider?: string | null;
  paidAt?: Date | string | null;
  items: SyncOrderItem[];
}

function wibString(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}

function isConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SHEETS_CLIENT_ID &&
      process.env.GOOGLE_SHEETS_CLIENT_SECRET &&
      process.env.GOOGLE_SHEETS_REFRESH_TOKEN &&
      process.env.GOOGLE_SHEETS_SPREADSHEET_ID
  );
}

async function getAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_SHEETS_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_SHEETS_CLIENT_SECRET ?? "",
        refresh_token: process.env.GOOGLE_SHEETS_REFRESH_TOKEN ?? "",
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) {
      console.error("[sheets-sync] tukar refresh token gagal:", res.status);
      return null;
    }
    const data = (await res.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch (error) {
    console.error(
      "[sheets-sync] tukar refresh token error:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

async function sheetsFetch(
  token: string,
  path: string,
  init?: RequestInit
): Promise<Response> {
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? "";
  return fetch(`${SHEETS_API}/${id}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

async function ensureTab(
  token: string,
  title: string,
  headers: (string | number)[]
): Promise<boolean> {
  try {
    // Cek tab sudah ada?
    const meta = await sheetsFetch(token, "?fields=sheets.properties.title");
    if (meta.ok) {
      const data = (await meta.json()) as {
        sheets?: { properties?: { title?: string } }[];
      };
      const exists = (data.sheets ?? []).some(
        (s) => s.properties?.title === title
      );
      if (exists) return true;
    }
    // Buat tab + header.
    const add = await sheetsFetch(token, ":batchUpdate", {
      method: "POST",
      body: JSON.stringify({
        requests: [{ addSheet: { properties: { title } } }],
      }),
    });
    if (!add.ok && add.status !== 400) {
      console.error("[sheets-sync] addSheet gagal:", add.status);
      return false;
    }
    const write = await sheetsFetch(
      token,
      `/values/${encodeURIComponent(title)}!A1:ZZ1?valueInputOption=RAW`,
      {
        method: "PUT",
        body: JSON.stringify({ values: [headers] }),
      }
    );
    if (!write.ok) {
      console.error("[sheets-sync] tulis header gagal:", write.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error(
      "[sheets-sync] ensureTab error:",
      error instanceof Error ? error.message : error
    );
    return false;
  }
}

/**
 * Tulis 1 order lunas ke Spreadsheet: append ke Orders + OrderItems,
 * lalu refresh tab Ringkasan. Idempoten di sisi baca (append selalu tambah
 * baris; webhook memanggil hanya saat transisi ke paid).
 */
export async function syncOrderToSheets(order: SyncOrder): Promise<boolean> {
  if (!isConfigured()) return false;
  const token = await getAccessToken();
  if (!token) return false;

  try {
    const okOrders = await ensureTab(token, TAB_ORDERS, ORDER_HEADERS);
    const okItems = await ensureTab(token, TAB_ITEMS, ITEM_HEADERS);
    const okSummary = await ensureTab(token, TAB_SUMMARY, SUMMARY_LABELS[0]);
    if (!okOrders || !okItems || !okSummary) return false;

    const orderRow = [
      order.orderNumber,
      wibString(order.createdAt),
      order.status,
      order.paymentStatus,
      order.customerName ?? "",
      order.customerEmail ?? "",
      order.phone ?? "",
      order.address ?? "",
      order.courier ?? "",
      order.service ?? "",
      order.subtotal,
      order.shippingCost,
      order.insuranceFee ?? 0,
      order.discount ?? 0,
      order.total,
      order.paymentMethod ?? "",
      order.paymentProvider ?? "",
      wibString(order.paidAt),
    ];

    const appendOrders = await sheetsFetch(
      token,
      `/values/${encodeURIComponent(TAB_ORDERS)}!A:R:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        body: JSON.stringify({ values: [orderRow] }),
      }
    );
    if (!appendOrders.ok) {
      console.error("[sheets-sync] append order gagal:", appendOrders.status);
      return false;
    }

    if (order.items.length > 0) {
      const itemRows = order.items.map((item) => [
        order.orderNumber,
        item.name,
        item.variant ?? "",
        item.quantity,
        item.price,
        item.total,
      ]);
      const appendItems = await sheetsFetch(
        token,
        `/values/${encodeURIComponent(TAB_ITEMS)}!A:F:append?valueInputOption=USER_ENTERED`,
        {
          method: "POST",
          body: JSON.stringify({ values: itemRows }),
        }
      );
      if (!appendItems.ok) {
        console.error("[sheets-sync] append items gagal:", appendItems.status);
      }
    }

    // Ringkasan: hitung dari kolom Total di tab Orders via formula.
    await sheetsFetch(
      token,
      `/values/${encodeURIComponent(TAB_SUMMARY)}!A1:B4?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        body: JSON.stringify({
          values: [
            ["Metrik", "Nilai"],
            ["Total Order Lunas", `=COUNTA(Orders!A2:A)`],
            ["Total Revenue", `=SUM(Orders!O2:O)`],
            ["Terakhir Disinkron", wibString(new Date())],
          ],
        }),
      }
    );

    return true;
  } catch (error) {
    console.error(
      "[sheets-sync] sync error:",
      error instanceof Error ? error.message : error
    );
    return false;
  }
}

/** Bungkus aman: tidak pernah melempar, dipakai di webhook pembayaran. */
export async function syncOrderToSheetsSafe(
  order: SyncOrder
): Promise<boolean> {
  try {
    return await syncOrderToSheets(order);
  } catch (error) {
    console.error(
      "[sheets-sync] safe wrapper:",
      error instanceof Error ? error.message : error
    );
    return false;
  }
}
