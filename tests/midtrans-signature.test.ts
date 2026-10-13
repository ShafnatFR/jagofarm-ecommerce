import assert from "node:assert/strict";
import crypto from "node:crypto";
import { before, test } from "node:test";

// MIDTRANS_SERVER_KEY dibaca sekali saat modul di-import, jadi env harus
// diisi SEBELUM import — makanya dipakai import dinamis di hook before().
const SERVER_KEY = "unit-test-midtrans-key";

type VerifySignature = (
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
) => boolean;

let verifySignature: VerifySignature;

before(async () => {
  process.env.MIDTRANS_SERVER_KEY = SERVER_KEY;
  ({ verifySignature } = (await import("../src/lib/midtrans")) as {
    verifySignature: VerifySignature;
  });
});

/** SHA512(order_id + status_code + gross_amount + server_key). */
function sign(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey = SERVER_KEY
): string {
  return crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");
}

test("verifySignature menerima signature SHA512 yang benar", () => {
  assert.equal(
    verifySignature("JF-261013-A1B2", "200", "150000", sign("JF-261013-A1B2", "200", "150000")),
    true
  );
});

test("verifySignature menolak payload yang diubah (order id, status, atau nominal)", () => {
  const orderId = "JF-261013-C3D4";
  const statusCode = "200";
  const grossAmount = "150000";
  const signature = sign(orderId, statusCode, grossAmount);

  assert.equal(verifySignature(orderId, statusCode, grossAmount, signature), true);
  // Nominal diubah setelah webhook ditandatangani.
  assert.equal(verifySignature(orderId, statusCode, "150001", signature), false);
  // Status code diubah.
  assert.equal(verifySignature(orderId, "201", grossAmount, signature), false);
  // Order id diubah (order lain dipakai ulang).
  assert.equal(verifySignature("JF-261013-ZZZZ", statusCode, grossAmount, signature), false);
});

test("verifySignature menolak signature dari server key lain", () => {
  const orderId = "JF-261013-E5F6";
  assert.equal(
    verifySignature(orderId, "200", "150000", sign(orderId, "200", "150000", "server-key-penyerang")),
    false
  );
});

test("verifySignature menolak signature kosong dan bukan hex", () => {
  assert.equal(verifySignature("JF-261013-G7H8", "200", "150000", ""), false);
  assert.equal(
    verifySignature("JF-261013-G7H8", "200", "150000", sign("JF-261013-G7H8", "200", "150000").toUpperCase()),
    false
  );
});

test("verifySignature menerima nominal desimal bergaya Midtrans", () => {
  const orderId = "JF-261013-J9K1";
  assert.equal(verifySignature(orderId, "407", "123456.00", sign(orderId, "407", "123456.00")), true);
});
