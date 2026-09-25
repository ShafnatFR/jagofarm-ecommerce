/**
 * Stub Mayar API v2 untuk pengujian lokal (bukan bagian aplikasi produksi).
 *
 * Meniru endpoint yang dipakai integrasi kita sehingga alur
 * order -> create invoice -> webhook -> order lunas bisa diuji end-to-end
 * TANPA API key Mayar asli:
 *
 *   POST /hl/v2/invoices/create      -> { statusCode, messages, data: { id, transactionId, link, expiredAt, extraData } }
 *   GET  /hl/v2/transactions/:id     -> { statusCode, messages, data: { ..., amount, status, extraData } }
 *
 * Endpoint bantu untuk skenario uji (tidak ada di Mayar asli):
 *   POST /__simulate/paid/:id             -> tandai transaksi lunas
 *   POST /__simulate/status/:id {status}  -> paksa status (paid|unpaid|expired)
 *   POST /__simulate/amount/:id {amount}  -> ubah nominal (uji deteksi ketidakcocokan)
 *   GET  /__state                         -> isi semua transaksi (untuk assertion)
 *
 * Jalankan: node scripts/mock-mayar-server.mjs [port]
 * Lalu set di .env: MAYAR_BASE_URL=http://127.0.0.1:<port>/hl/v2
 */

import http from "node:http";

const PORT = Number(process.argv[2] || 4599);
const EXPECTED_KEY = process.env.MAYAR_API_KEY || "mayar-stub-key";
const transactions = new Map();

function json(res, code, body) {
  const payload = JSON.stringify(body);
  res.writeHead(code, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function authorized(req) {
  const header = req.headers["authorization"] || "";
  return header === `Bearer ${EXPECTED_KEY}`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const path = url.pathname;
  const method = req.method || "GET";

  if (method === "POST" && path === "/hl/v2/invoices/create") {
    if (!authorized(req)) return json(res, 401, { statusCode: 401, messages: "unauthorized" });
    const body = await readBody(req);
    const amount = (body.items || []).reduce(
      (sum, it) => sum + Number(it.rate || 0) * Number(it.quantity || 0),
      0
    );
    const id = crypto.randomUUID();
    const transactionId = crypto.randomUUID();
    const record = {
      id,
      transactionId,
      amount,
      status: "unpaid",
      extraData: body.extraData ?? null,
      customer: { name: body.name ?? null, email: body.email ?? null, mobile: body.mobile ?? null },
      paymentMethod: body.paymentMethod ?? null,
      invoiceCode: `INV-TEST-${transactions.size + 1}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      requestedPaymentMethod: body.paymentMethod ?? null,
      description: body.description ?? null,
      link: `http://127.0.0.1:${PORT}/invoices/${id}`,
    };
    transactions.set(id, record);
    console.log(`[stub] invoice dibuat ${id} amount=${amount} order=${record.extraData?.orderNumber ?? "-"}`);
    return json(res, 200, {
      statusCode: 200,
      messages: "success",
      data: { id, transactionId, link: record.link, expiredAt: Date.now() + 86400000, extraData: record.extraData },
    });
  }

  if (method === "GET" && path.startsWith("/hl/v2/transactions/")) {
    if (!authorized(req)) return json(res, 401, { statusCode: 401, messages: "unauthorized" });
    const key = decodeURIComponent(path.split("/").pop() || "");
    const record = transactions.get(key) || [...transactions.values()].find((t) => t.transactionId === key);
    if (!record) return json(res, 404, { statusCode: 404, messages: "transaction not found" });
    return json(res, 200, { statusCode: 200, messages: "success", data: record });
  }

  if (method === "POST" && path.startsWith("/__simulate/paid/")) {
    const key = path.split("/").pop();
    const record = transactions.get(key) || [...transactions.values()].find((t) => t.transactionId === key);
    if (!record) return json(res, 404, { error: "not found" });
    record.status = "paid";
    record.updatedAt = Date.now();
    console.log(`[stub] transaksi ${record.id} ditandai PAID`);
    return json(res, 200, { ok: true, status: record.status });
  }

  if (method === "POST" && path.startsWith("/__simulate/status/")) {
    const key = path.split("/").pop();
    const record = transactions.get(key) || [...transactions.values()].find((t) => t.transactionId === key);
    if (!record) return json(res, 404, { error: "not found" });
    const body = await readBody(req);
    record.status = body.status || record.status;
    record.updatedAt = Date.now();
    return json(res, 200, { ok: true, status: record.status });
  }

  if (method === "POST" && path.startsWith("/__simulate/amount/")) {
    const key = path.split("/").pop();
    const record = transactions.get(key) || [...transactions.values()].find((t) => t.transactionId === key);
    if (!record) return json(res, 404, { error: "not found" });
    const body = await readBody(req);
    record.amount = Number(body.amount);
    return json(res, 200, { ok: true, amount: record.amount });
  }

  if (method === "GET" && path === "/__state") {
    return json(res, 200, { count: transactions.size, transactions: [...transactions.values()] });
  }

  return json(res, 404, { statusCode: 404, messages: `not found: ${method} ${path}` });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[stub] Mayar API v2 stub siap di http://127.0.0.1:${PORT} (key: ${EXPECTED_KEY.slice(0, 4)}...)`);
});
