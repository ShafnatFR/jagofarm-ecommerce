"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

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
    <>
      <section className="relative pt-16 pb-12 bg-gradient-to-b from-white to-[#FAFBFB]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-sm font-semibold mb-6 shadow-sm">
            <Icon name="help" size={16} className="text-emerald-600" />
            <span>FAQ</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Pusat Bantuan &amp; FAQ
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Temukan jawaban untuk pertanyaan umum tentang JagoFarm
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categoryNames.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {categories[activeCategory].map((item, i) => (
            <div key={i} className="rounded-2xl border border-emerald-100 bg-white shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-emerald-50/50 transition-colors"
              >
                <span className="font-semibold text-gray-900 pr-4">{item.q}</span>
                <Icon name={openIndex === i ? "expand_less" : "expand_more"} size={20} className="text-emerald-600 shrink-0" />
              </button>
              {openIndex === i && (
                <div className="px-6 pb-4">
                  <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}