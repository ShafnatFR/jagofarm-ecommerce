"use client";

import { useState } from "react";

type FaqItem = { q: string; a: string };

const categories: Record<string, FaqItem[]> = {
  Umum: [
    { q: "Apa itu JagoFarm?", a: "JagoFarm adalah platform e-commerce yang menyediakan peralatan pertanian modern seperti set akuaponik, hidroponik, tambak, IoT smart farming, benih, dan anakan ikan berkualitas tinggi." },
    { q: "Apakah JagoFarm melayani pengiriman ke seluruh Indonesia?", a: "Ya, kami mengirim ke seluruh Indonesia menggunakan kurir JNE, SiCepat, dan AnterAja. Beberapa produk besar mungkin memiliki batasan pengiriman." },
    { q: "Bagaimana cara menghubungi customer service?", a: "Anda bisa menghubungi kami melalui WhatsApp di +62 812-3456-7890, email hello@jagofarm.id, atau formulir kontak di halaman Hubungi Kami." },
    { q: "Apakah ada garansi produk?", a: "Ya, semua produk JagoFarm bergaransi resmi. Durasi garansi tergantung jenis produk — silakan cek detail di halaman produk masing-masing." },
  ],
  Pengiriman: [
    { q: "Berapa lama waktu pengiriman?", a: "Waktu pengiriman tergantung kurir dan lokasi. Untuk Jawa: 2-4 hari kerja, luar Jawa: 4-7 hari kerja. Estimasi lebih detail ditampilkan saat checkout." },
    { q: "Apakah ada gratis ongkir?", a: "Ya, kami menyediakan gratis ongkir untuk pembelian di atas Rp500.000 ke seluruh Jawa dan di atas Rp1.000.000 untuk luar Jawa." },
    { q: "Bagaimana pengiriman anakan ikan?", a: "Anakan ikan dikirim menggunakan kemasan khusus dengan oksigen dan isolasi suhu. Pengiriman hanya dilakukan di hari Senin-Kamis untuk memastikan keselamatan ikan." },
    { q: "Bisakah saya memilih kurir?", a: "Ya, saat checkout Anda bisa memilih kurir (JNE, SiCepat, AnterAja) dan layanan yang tersedia untuk alamat Anda." },
  ],
  Pembayaran: [
    { q: "Metode pembayaran apa saja yang diterima?", a: "Kami menerima transfer bank (BCA, Mandiri, BNI, BRI), e-wallet (GoPay, OVO, Dana, ShopeePay), dan QRIS." },
    { q: "Apakah ada cicilan?", a: "Saat ini kami belum menyediakan cicilan langsung, tetapi Anda bisa menggunakan fitur cicilan dari e-wallet atau kartu kredit bank Anda." },
    { q: "Berapa lama batas waktu pembayaran?", a: "Pesanan harus dibayar dalam 24 jam setelah checkout. Pesanan yang tidak dibayar akan otomatis dibatalkan." },
  ],
  Produk: [
    { q: "Apakah produk JagoFarm sudah termasuk panduan?", a: "Ya, semua set (tambak, hidroponik, akuaponik) dilengkapi panduan pemasangan dan tips perawatan lengkap." },
    { q: "Bisakah saya membeli spare part secara terpisah?", a: "Tentu, semua komponen tersedia secara terpisah di katalog produk kami." },
    { q: "Bagaimana cara memilih set yang tepat?", a: "Silakan hubungi tim kami via WhatsApp untuk konsultasi gratis. Kami akan membantu memilih set yang sesuai dengan kebutuhan dan lahan Anda." },
  ],
};

const categoryNames = Object.keys(categories);

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState(categoryNames[0]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-primary text-on-primary py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-margin text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-secondary-fixed-dim text-label-md font-label-md mb-6 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[16px]">help</span>
            <span>FAQ</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg md:text-[48px] md:leading-[56px] text-on-primary font-extrabold tracking-tight mb-4">
            Pusat Bantuan &amp; FAQ
          </h1>
          <p className="text-body-lg font-body-lg text-primary-fixed max-w-2xl mx-auto">
            Temukan jawaban untuk pertanyaan umum tentang JagoFarm
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="max-w-4xl mx-auto px-margin py-12">
        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {categoryNames.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
              className={`rounded-full px-4 py-1.5 text-label-md font-label-md whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant border border-outline-variant"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion */}
        <div className="mt-6 space-y-3">
          {categories[activeCategory].map((item, i) => (
            <div key={i} className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-surface-container-low transition-colors"
              >
                <span className="text-headline-sm font-headline-sm text-on-surface pr-4">{item.q}</span>
                <span className="material-symbols-outlined text-[20px] text-primary shrink-0">
                  {openIndex === i ? "expand_less" : "expand_more"}
                </span>
              </button>
              {openIndex === i && (
                <div className="px-6 pb-4">
                  <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 rounded-3xl bg-primary p-8 text-center text-on-primary">
          <h2 className="text-headline-lg font-headline-lg">Masih Punya Pertanyaan?</h2>
          <p className="mt-2 text-body-lg font-body-lg text-primary-fixed/80">Tim kami siap membantu Anda</p>
          <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-6 bg-secondary-fixed-dim hover:bg-secondary text-primary font-headline-sm text-headline-sm px-7 py-3.5 rounded-full shadow-md transition-all active:scale-95">
            <span className="material-symbols-outlined text-[20px]">chat</span>
            Chat via WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}