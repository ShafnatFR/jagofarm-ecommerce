/**
 * Konten awal halaman informasi (about, faq, terms, dll).
 *
 * Dipisahkan dari prisma/seed.ts supaya konten bisa di-seed ulang tanpa
 * menjalankan seed penuh — `npm run db:seed` menimpa harga/stok produk,
 * jadi tidak aman dijalankan pada database yang sudah berisi katalog nyata.
 */

export interface SeedContentPage {
  slug: string;
  title: string;
  seoTitle: string;
  seoDesc: string;
  contentHtml: string;
}

export const seedContentPages: SeedContentPage[] = [
  {
    slug: "faq",
    title: "Pertanyaan yang Sering Diajukan",
    seoTitle: "FAQ - JagoFarm",
    seoDesc: "Pertanyaan umum seputar produk, pengiriman, pembayaran, dan IoT JagoFarm.",
    contentHtml: `<div class="space-y-4"><div class="faq-item"><h3>Apa itu JagoFarm?</h3><p>JagoFarm adalah ekosistem pertanian modern terintegrasi. Kami menyediakan set tambak, hidroponik, aquaponik, benih, anakan ikan, dan IoT smart farming.</p></div><div class="faq-item"><h3>Apakah JagoFarm melayani pengiriman ke seluruh Indonesia?</h3><p>Ya, kami mengirim ke seluruh Indonesia melalui mitra logistik terpercaya. Benih hidup dikemas khusus dengan oksigen medis.</p></div><div class="faq-item"><h3>Metode pembayaran apa saja yang didukung?</h3><p>Kami mendukung QRIS, Virtual Account BCA/Mandiri/BRI, transfer bank manual, e-wallet (GoPay, OVO, ShopeePay), dan cicilan kartu kredit 0%.</p></div></div>`,
  },
  {
    slug: "about",
    title: "Tentang Kami",
    seoTitle: "Tentang Kami - JagoFarm",
    seoDesc: "JagoFarm hadir sejak 2020 sebagai solusi one-stop untuk kebutuhan pertanian modern.",
    contentHtml: `<section><h2>Membangun Pertanian &amp; Akuakultur Modern Indonesia</h2><p>JagoFarm hadir sejak 2020 sebagai solusi one-stop untuk kebutuhan pertanian modern. Dari set tambak, hidroponik, aquaponik, hingga IoT smart farming — kami menyediakan produk berkualitas dengan harga terjangkau.</p></section>`,
  },
  {
    slug: "how-to-order",
    title: "Cara Pemesanan Mudah &amp; Cepat",
    seoTitle: "Cara Pemesanan - JagoFarm",
    seoDesc: "5 tahap alur transaksi JagoFarm: pilih produk, tambah keranjang, checkout, pembayaran, terima barang.",
    contentHtml: `<section><h2>Cara Pemesanan Mudah &amp; Cepat</h2><p>1. Pilih Produk &amp; Spesifikasi Pertanian<br>2. Tambah ke Keranjang Belanja<br>3. Checkout &amp; Ekspedisi Khusus Beroksigen<br>4. Pembayaran Aman &amp; Otomatis<br>5. Terima Barang &amp; Garansi Perlindungan</p></section>`,
  },
  {
    slug: "return-policy",
    title: "Kebijakan Pengembalian &amp; Refund",
    seoTitle: "Kebijakan Pengembalian - JagoFarm",
    seoDesc: "Kebijakan pengembalian barang, garansi 100% ikan hidup, dan syarat pengembalian.",
    contentHtml: `<section><h2>Syarat Pengembalian</h2><ul><li>Produk dapat dikembalikan dalam waktu 7 hari setelah barang diterima.</li><li>Produk harus dalam kondisi asli, belum digunakan, dan kemasan masih utuh.</li><li>Produk cacat atau rusak saat pengiriman (wajib sertakan foto unboxing).</li></ul></section>`,
  },
  {
    slug: "shipping-policy",
    title: "Kebijakan Pengiriman",
    seoTitle: "Kebijakan Pengiriman - JagoFarm",
    seoDesc: "Informasi pengiriman, estimasi waktu, dan metode pengiriman JagoFarm.",
    contentHtml: `<section><h2>Jangkauan Pengiriman</h2><p>Kami melayani pengiriman ke seluruh wilayah Indonesia melalui ekspedisi logistik khusus kargo terpercaya. Benih hidup dikemas dengan kantong oksigen medis ganda.</p></section>`,
  },
  {
    slug: "privacy-policy",
    title: "Kebijakan Privasi",
    seoTitle: "Kebijakan Privasi - JagoFarm",
    seoDesc: "Kebijakan privasi JagoFarm mengenai pengumpulan dan penggunaan data pelanggan.",
    contentHtml: `<section><h2>Kebijakan Privasi</h2><p>Data Anda dijaga kerahasiaannya sesuai kebijakan privasi kami. Kami tidak menjual data Anda ke pihak ketiga.</p></section>`,
  },
  {
    slug: "terms",
    title: "Persyaratan &amp; Ketentuan",
    seoTitle: "Persyaratan dan Ketentuan - JagoFarm",
    seoDesc: "Persyaratan dan ketentuan penggunaan layanan JagoFarm.",
    contentHtml: `<section><h2>Persyaratan &amp; Ketentuan</h2><p>Dengan menggunakan layanan JagoFarm, Anda menyetujui seluruh syarat dan ketentuan yang berlaku.</p></section>`,
  },
];