"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
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

function AccordionItem({ item, isOpen, toggle }: { item: FaqItem; isOpen: boolean; toggle: () => void }) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button onClick={toggle} className="flex w-full items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors">
        <span className="text-sm font-medium pr-4">{item.q}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-0">
          <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState(categoryNames[0]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
          <HelpCircle className="h-4 w-4" /> FAQ
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Pertanyaan yang Sering Diajukan</h1>
        <p className="mt-2 text-muted-foreground">Temukan jawaban untuk pertanyaan umum tentang JagoFarm</p>
      </div>

      <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
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
          <AccordionItem
            key={i}
            item={item}
            isOpen={openIndex === i}
            toggle={() => setOpenIndex(openIndex === i ? null : i)}
          />
        ))}
      </div>
    </div>
  );
}
