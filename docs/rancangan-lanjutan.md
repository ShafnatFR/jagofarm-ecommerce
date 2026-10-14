# Rancangan Kerja JagoFarm — Lanjutan

> Status: **menunggu persetujuan** sebelum eksekusi.
> Tanggal: 2026-10-14
> Dasar: audit kode langsung (bukan asumsi).

---

## Ringkasan temuan audit

| Item | Kondisi nyata di kode | Kesimpulan |
|---|---|---|
| A3 low-stock badge | Halaman admin produk **sudah** punya badge "Habis" + angka merah saat stok ≤10 (`admin/products/page.tsx:178-182`). Tipe notif `"stock"` **sudah** ada di `AdminNotification`. | Tinggal: alert proaktif (bell + email) saat stok melewati ambang, bukan sekadar warna |
| A10 stok opname | Belum ada | Perlu halaman + model baru |
| Refund/retur | Hanya halaman kebijakan statis; enum `OrderStatus` **tidak** punya `refunded` | Perlu alur + status baru |
| 2FA admin | Belum ada | Perlu integrasi |
| A6 analytics | Belum ada GA4/GTM | Perlu pasang + event |
| A11 blog | Belum ada | Perlu CMS artikel |

**Catatan penting:** `AGENTS.md` memperingatkan Next.js 16.3.5 ini versi modifikasi — setiap penulisan kode baru harus merujuk `node_modules/next/dist/docs/` dulu.

---

## FASE 1 — A3 Low-stock alert (prioritas tertinggi, paling cepat)

**Kenapa:** data sudah tersedia (Laporan Stok + notifikasi `"stock"`); hanya perlu pemicu proaktif.

### Perubahan
1. **`src/lib/loyalty.ts`-pola baru → `src/lib/stock-alert.ts`**
   - `checkLowStockSafe(productIds)` — panggil setelah stok berkurang.
   - Ambang dari env `LOW_STOCK_THRESHOLD` (default 5, sudah dipakai Laporan Stok).
   - Anti-spam: simpan `lastStockAlertAt` per produk (kolom baru) agar alert tidak berulang tiap order.

2. **`src/app/api/orders/route.ts`** (setelah blok pengurangan stok, ~baris 392)
   - Kumpulkan `productId` yang stoknya jatuh ≤ ambang → panggil `checkLowStockSafe`.
   - Best-effort (tidak menggagalkan order).

3. **Notifikasi**
   - **Bell admin**: `notifyAdminSafe({ type: "stock", title: "Stok menipis: <produk>", href: "/admin/products" })`.
   - **Email admin** (opsional): ke `EMAIL_ALERT_TO` — *tapi ini menunggu B16 (domain Resend) selesai dulu.*

4. **UI `src/app/admin/products/page.tsx`**
   - Badge "Stok menipis" (kuning) untuk `0 < stock ≤ ambang` (sekarang baru "Habis" merah).

### Migrasi DB
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_stock_alert_at TIMESTAMPTZ;
```

### Verifikasi
`tsc` 0 error · lint 0 · test lulus · uji: buat order yang menurunkan stok ≤5 → cek bell admin.

**Estimasi: 1 sesi, risiko rendah.**

---

## FASE 2 — Refund/Retur workflow (nilai bisnis tinggi)

**Kenapa:** toko tanpa alur retur = sengketa manual. Ini celah fungsional nyata.

### Perubahan
1. **Schema**: enum `OrderStatus` + `refunded`; model baru `ReturnRequest`
   (id, orderId, userId, reason, status, adminNote, refundAmount, timestamps).
2. **Alur**: pelanggan ajukan retur dari halaman order → admin setujui/tolak → tandai `refunded`.
3. **API**: `POST /api/returns`, `GET/PATCH /api/admin/returns`.
4. **UI**: form retur di halaman order + halaman admin `/admin/returns`.
5. **Notifikasi**: bell admin saat retur masuk; email/WA ke pelanggan saat status berubah.

### Verifikasi
Uji end-to-end: ajukan → setujui → order jadi `refunded`.

**Estimasi: 2 sesi, risiko sedang (ubah enum status).**

---

## FASE 3 — A10 Stok opname

Halaman admin: input stok fisik → bandingkan dengan sistem → catat selisih ke tabel `StockOpname`.

**Estimasi: 1-2 sesi.**

---

## FASE 4 — A6 Analytics GA4 + A11 Blog (pilih salah satu)

- **A6**: pasang GTM + event (pageview, add_to_cart, begin_checkout, purchase). Butuh **Measurement ID dari Anda**.
- **A11**: CMS artikel (slug, konten, SEO). Mandiri, tanpa kredensial eksternal.

---

## Yang TIDAK bisa saya kerjakan (butuh Anda)

| Item | Blocker |
|---|---|
| B16 email pelanggan | Verifikasi domain `jagofarm.dev` di Resend (akses DNS Cloudflare) |
| B17 Midtrans | Akun di-ACC |
| A6 GA4 | Measurement ID |
| D28 hapus situs Kroombox | Konfirmasi + akses panel |

---

## Rekomendasi urutan

1. **FASE 1 (A3)** — cepat, risiko rendah, langsung berguna → **mulai di sini**
2. **FASE 2 (Refund/Retur)** — dampak bisnis terbesar
3. **FASE 3 (Stok opname)**
4. **FASE 4** — sesuai kebutuhan

**Semua fase tetap mempertahankan: lint 0, test hijau, deploy Vercel.**
