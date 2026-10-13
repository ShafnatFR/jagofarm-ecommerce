# Wacana — Rencana Update v2 JagoFarm

> Daftar fitur/pekerjaan yang **ditunda** ke v2. Diurutkan per kategori.
> Status: belum dikerjakan. Tambahkan catatan/instruksi di bawah tiap item.

---

## A. Fitur e-commerce (ditunda)

### A3. Peringatan stok menipis (low-stock alert)
- **Ide:** tandai produk dengan `minStock`; tampilkan badge "stok menipis" di admin & kirim email ke admin saat stok ≤ ambang.
- **Instruksi tambahan:** _(isi di sini)_

### A5. Tab "Tanya Jawab" produk (Q&A)
- **Catatan:** item B19 juga mencakup ini — lihat bagian B.
- **Instruksi tambahan:** _(isi di sini)_

### A6. Analytics (Google Analytics 4 / GTM)
- **Ide:** pasang GA4 + GTM, lacak pageview, add-to-cart, begin_checkout, purchase.
- **Instruksi tambahan:** _(isi di sini)_

### A10. Stok opname / audit stok
- **Ide:** halaman admin untuk input stok fisik & bandingkan dengan sistem, catat selisih.
- **Instruksi tambahan:** _(isi di sini)_

### A11. Blog / artikel
- **Ide:** CMS artikel (slug, konten, SEO) untuk konten marketing/SEO.
- **Instruksi tambahan:** _(isi di sini)_

### A13. Multi-currency
- **Ide:** dukungan IDR + USD, kurs dari penyedia, tampilkan sesuai pilihan user.
- **Instruksi tambahan:** _(isi di sini)_

---

## B. Penyempurnaan fitur yang ada (ditunda)

### B16. Email ke pelanggan (Resend) — blokir verifikasi domain
- **Status:** key Resend sudah terpasang di Vercel; **terblokir** karena domain pengirim belum diverifikasi.
- **Keputusan:** pakai `jagofarm.dev` (dikelola Cloudflare).
- **Yang dibutuhkan:** Resend full-access key + Cloudflare API token (atau verifikasi manual di resend.com/domains).
- **Instruksi tambahan:** _(isi di sini)_

### B17. Midtrans
- **Status:** di-hide sementara (kode utuh). Menunggu akun Midtrans di-ACC.
- **Aktivasi:** isi `MIDTRANS_SERVER_KEY` + `MIDTRANS_CLIENT_KEY`, set `PAYMENT_PROVIDER=midtrans`, deploy.
- **Instruksi tambahan:** _(isi di sini)_

---

## C. Teknis (ditunda)

_(semua item C dikerjakan — lihat riwayat commit)_

---

## D. Infrastruktur / ops (ditunda)

### D28. Hapus situs tes Kroombox
- **Status:** `jagofarm-shop` + `jagofarm-shop-api` di panel Kroombox (gagal/500), belum dihapus.
- **Instruksi tambahan:** _(isi di sini)_

---

## Catatan umum
- Hosting produksi: **Vercel** (bukan Kroombox).
- Database: **Supabase** (`olwexymkevbllhyutnfj`), region ap-southeast-1.
- Repo: `github.com/ShafnatFR/jagofarm-ecommerce` (branch `main`).
