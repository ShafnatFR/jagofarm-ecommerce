import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildInvoicePdf } from "../src/lib/invoice";

describe("buildInvoicePdf", () => {
  it("header PDF + xref + EOF", () => {
    const pdf = buildInvoicePdf({
      orderNumber: "JF-TEST-001",
      createdAt: "2026-11-01T10:00:00+07:00",
      status: "paid",
      paymentStatus: "paid",
      customerName: "Pelanggan Tes",
      customerEmail: "tes@example.id",
      shippingAddress: "Jl. Tes No. 1, Bandung",
      items: [{ productName: "Produk A", quantity: 2, price: 50000, subtotal: 100000 }],
      subtotal: 100000,
      discount: 0,
      shippingCost: 12000,
      total: 112000,
    });
    assert.ok(Buffer.isBuffer(pdf));
    const head = pdf.subarray(0, 8).toString();
    assert.ok(head.startsWith("%PDF-1.4"));
    const text = pdf.toString("latin1");
    assert.ok(text.includes("xref"));
    assert.ok(text.includes("%%EOF"));
    assert.ok(pdf.length > 0);
  });
});
