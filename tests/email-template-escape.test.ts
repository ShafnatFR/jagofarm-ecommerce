import assert from "node:assert/strict";
import { test } from "node:test";
import {
  orderCreatedEmail,
  type EmailOrderData,
} from "../src/lib/email-templates";

/**
 * Template email membangun HTML lewat template literal, jadi setiap nilai
 * dari pengguna (nama produk, nama pelanggan, alamat, catatan) WAJIB
 * di-escape. Tanpa escaping, nama produk seperti `<img src=x onerror=...>`
 * menembus kotak masuk penerima (injection di HTML email).
 */

function dirtyOrder(overrides: Partial<EmailOrderData> = {}): EmailOrderData {
  return {
    orderNumber: "JF-TEST-0001",
    status: "pending",
    customerName: "Budi<img src=x onerror=alert(1)>",
    total: 150000,
    items: [
      {
        productName: "Pupuk<img src=x onerror=alert(2)>NPK",
        quantity: 1,
        price: 150000,
        total: 150000,
      },
    ],
    shippingAddress: {
      recipientName: "Budi<img src=x onerror=alert(3)>",
      phone: "081234567890",
      city: "Bandung",
      province: "Jawa Barat",
      postalCode: "40111",
    },
    notes: "Tolong <script>alert(5)</script> dikirim cepat",
    ...overrides,
  };
}

test("email template meng-escape semua nilai dari pengguna", () => {
  const { html } = orderCreatedEmail(dirtyOrder());

  // Tag mentah tidak boleh muncul — hanya teks ter-escape (&lt; ... &gt;).
  assert.doesNotMatch(html, /<img\s+src=x/i, "tag <img> mentah lolos");
  assert.doesNotMatch(html, /<script>alert\(/i, "tag <script> mentah lolos");

  // Nilai harus tampil sebagai teks ter-escape, bukan markup hidup.
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/, "nama pelanggan tidak ter-escape");
  assert.match(html, /&lt;img src=x onerror=alert\(2\)&gt;/, "nama produk tidak ter-escape");
  assert.match(html, /&lt;script&gt;alert\(5\)&lt;\/script&gt;/, "catatan tidak ter-escape");

  // Teks bersih tetap terlihat utuh (di-escape, bukan dibuang).
  assert.match(html, /Pupuk/);
  assert.match(html, /Budi/);
});

test("email template: nilai bersih tetap dirender utuh", () => {
  const { html } = orderCreatedEmail({
    orderNumber: "JF-TEST-0002",
    status: "pending",
    customerName: "Siti Rahayu",
    total: 99000,
    items: [
      {
        productName: "Benih Jagung Hibrida",
        quantity: 2,
        price: 49500,
        total: 99000,
      },
    ],
  });

  assert.match(html, /Siti Rahayu/);
  assert.match(html, /Benih Jagung Hibrida/);
  assert.match(html, /JF-TEST-0002/);
});
