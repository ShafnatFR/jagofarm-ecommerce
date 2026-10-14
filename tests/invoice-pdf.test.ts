import assert from "node:assert/strict";
import { test } from "node:test";
import { buildInvoicePdf, type InvoiceData } from "../src/lib/invoice";

const sampleOrder = (overrides: Partial<InvoiceData> = {}): InvoiceData => ({
  orderNumber: "JF-261014-AB12",
  createdAt: new Date("2026-10-14T03:00:00.000Z"),
  status: "paid",
  paymentStatus: "paid",
  paymentMethod: "mayar",
  customerName: "Budi Santoso",
  customerEmail: "budi@example.com",
  customerPhone: "08123456789",
  shippingAddress: "Jl. Merdeka No. 10\nKec. Coblong, Kota Bandung\nJawa Barat 40132",
  shippingCourier: "JNE",
  shippingService: "REG",
  shippingEtd: "2-3 hari",
  items: [
    { productName: "Bibit Jagung Hibrida", variantName: "1 kg", quantity: 2, price: 45_000, subtotal: 90_000 },
    { productName: "Pupuk NPK", variantName: null, quantity: 1, price: 60_000, subtotal: 60_000 },
  ],
  subtotal: 150_000,
  discount: 10_000,
  shippingCost: 22_000,
  insuranceFee: 2_000,
  total: 164_000,
  couponCode: "HEMAT10",
  ...overrides,
});

test("buildInvoicePdf: menghasilkan PDF valid (header, xref, EOF)", () => {
  const buf = buildInvoicePdf(sampleOrder());
  assert.ok(buf.length > 0, "buffer tidak boleh kosong");
  const text = buf.toString("latin1");
  assert.ok(text.startsWith("%PDF-1.4"), "harus diawali %PDF-1.4");
  assert.ok(text.includes("startxref"), "harus punya startxref");
  assert.ok(text.includes("%%EOF"), "harus diakhiri %%EOF");
  assert.ok(text.includes("xref"), "harus punya tabel xref");
});

test("buildInvoicePdf: memuat nomor pesanan & nama pelanggan", () => {
  const text = buildInvoicePdf(sampleOrder()).toString("latin1");
  assert.ok(text.includes("JF-261014-AB12"), "nomor pesanan harus ada");
  assert.ok(text.includes("Budi Santoso"), "nama pelanggan harus ada");
});

test("buildInvoicePdf: tahan data minimal (tanpa diskon/kupon/varian)", () => {
  const buf = buildInvoicePdf(
    sampleOrder({
      discount: 0,
      couponCode: null,
      insuranceFee: 0,
      shippingCourier: null,
      shippingService: null,
      shippingEtd: null,
      customerPhone: null,
      items: [{ productName: "Produk", variantName: null, quantity: 1, price: 10_000, subtotal: 10_000 }],
    })
  );
  const text = buf.toString("latin1");
  assert.ok(text.startsWith("%PDF-1.4"));
  assert.ok(text.includes("%%EOF"));
});

test("buildInvoicePdf: tahan karakter khusus (escape PDF)", () => {
  const buf = buildInvoicePdf(
    sampleOrder({ customerName: "O'Brien (Test) \\ Backslash" })
  );
  const text = buf.toString("latin1");
  assert.ok(text.startsWith("%PDF-1.4"));
  assert.ok(text.includes("%%EOF"), "escape salah bisa merusak EOF");
});
