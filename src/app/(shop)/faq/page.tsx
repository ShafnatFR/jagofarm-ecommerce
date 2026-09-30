"use client";

import { useState } from "react";

const faqItems = [
  {
    question: "Apa itu JagoFarm?",
    answer: "<strong>JagoFarm</strong> adalah ekosistem dan penyedia solusi pertanian modern terintegrasi di Indonesia. Kami menghadirkan perangkat keras berkualitas untuk budidaya hidroponik, akuaponik, kolam tambak ikan terpal bulat/kotak, benih tanaman terverifikasi, anakan ikan unggul, hingga teknologi <em>IoT Smart Farming</em> yang memudahkan pemantauan kualitas air dan nutrisi secara <em>real-time</em> via smartphone.",
    category: "umum",
    expanded: true,
  },
  {
    question: "Apakah JagoFarm melayani pengiriman ke seluruh Indonesia?",
    answer: "Ya, kami mengirim ke seluruh pelosok Nusantara dari hub logistik Surabaya dan Jakarta dengan metode pengiriman terkurasi:\n\n• <strong>Benih Hidup & Bibit:</strong> Dikemas dengan kantong oksigen medis ganda, styrofoam berinsulasi, dan proteksi es khusus hingga toleransi transit 72 jam.\n• <strong>Paket Tambak & Rangka Hidroponik:</strong> Bekerja sama dengan kargo rekanan terpercaya (JNE Trucking, Dakota Cargo, Indah Logistik) berbiaya hemat dan dilengkapi asuransi.\n• <strong>Modul IoT & Sensor:</strong> Menggunakan pengiriman reguler/kilat aman dengan kemasan anti-guncangan bubble wrap tebal.",
    category: "pengiriman",
    expanded: false,
  },
  {
    question: "Bagaimana cara menghubungi customer service?",
    answer: "Tim Agribisnis & Customer Care JagoFarm siap melayani Anda setiap hari:\n\n• <strong>WhatsApp Resmi:</strong> +62 812-3456-7890 (Senin - Minggu: 08.00 - 20.00 WIB)\n• <strong>Email Dukungan:</strong> hello@jagofarm.id (Respon maksimal 1x24 jam kerja)",
    category: "umum",
    expanded: false,
  },
  {
    question: "Apakah ada garansi produk dan benih hidup?",
    answer: "Tentu saja. Kepuasan dan keberhasilan panen Anda adalah prioritas kami:\n\n• <strong>Garansi Live Arrival (Benih Hidup Sampai Tujuan):</strong> Penggantian 100% atau refund jika anakan ikan/bibit mengalami kematian saat paket dibuka (sertakan video unboxing tanpa jeda maksimal 2 jam setelah paket tiba).\n• <strong>Garansi Elektronik & IoT 12 Bulan:</strong> Mencakup modul kontroler utama, pompa air, dan sensor mikrokontroler jika terjadi cacat manufaktur.\n• <strong>Garansi Terpal & Kolam 3 Tahun:</strong> Ketahanan terpal semi-karet terhadap kebocoran material di bawah pemakaian normal.",
    category: "pembayaran",
    expanded: false,
  },
  {
    question: "Bagaimana cara kerja perangkat IoT & Smart Farming JagoFarm?",
    answer: "Modul IoT kami menggunakan sistem <em>Plug-and-Play</em>. Anda cukup menancapkan sensor pH, sensor Dissolved Oxygen (DO), TDS nutrisi, dan suhu ke kolam atau reservoir hidroponik. Alat akan otomatis mengirim data melalui koneksi Wi-Fi/GSM ke aplikasi <strong>JagoFarm Mobile Dashboard</strong>, dengan fitur peringatan bahaya otomatis via notifikasi WhatsApp jika kualitas air menurun.",
    category: "iot",
    expanded: false,
  },
  {
    question: "Metode pembayaran apa saja yang didukung?",
    answer: "Kami mendukung ragam pembayaran instan dan aman melalui Payment Gateway resmi terlisensi Bank Indonesia:\n\n• QRIS (Gopay/OVO/ShopeePay)\n• Virtual Account BCA/Mandiri/BRI\n• Transfer Bank Manual\n• Cicilan Kartu Kredit 0%",
    category: "pembayaran",
    expanded: false,
  },
];

const categories = ["Umum", "Pengiriman", "Pembayaran", "Produk & Benih", "IoT & Smart Farming"];

const categoryMap: Record<string, string> = {
  "Umum": "umum",
  "Pengiriman": "pengiriman",
  "Pembayaran": "pembayaran",
  "Produk & Benih": "pembayaran",
  "IoT & Smart Farming": "iot",
};

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState("Umum");
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set([0]));
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = faqItems.filter((item) => {
    const matchesCategory = item.category === categoryMap[activeCategory];
    const matchesSearch = searchQuery === "" || item.question.toLowerCase().includes(searchQuery.toLowerCase()) || item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleItem = (index: number) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="w-full">
      {/* HeroSection */}
      <section className="relative pt-16 pb-12 overflow-hidden border-b border-outline-variant/30 bg-gradient-to-b from-primary-fixed/10 via-surface-container-lowest to-surface-container-lowest">
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-forest-100/30 blur-3xl rounded-full" />
        </div>
        <div className="relative max-w-4xl mx-auto px-margin text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-50 border border-primary-fixed/40 text-primary text-label-md font-label-md uppercase tracking-wider mb-6 shadow-sm">
            <span className="material-symbols-outlined text-[16px]">help</span>
            <span>Pusat Bantuan &amp; FAQ</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg md:text-[48px] md:leading-[56px] text-on-surface font-extrabold tracking-tight leading-tight mb-4">
            Pertanyaan yang Sering Diajukan
          </h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed mb-8">
            Temukan jawaban cepat seputar pemesanan produk budidaya, garansi benih hidup, pengiriman seluruh Indonesia, dan IoT Smart Farming JagoFarm.
          </p>
          {/* Search */}
          <div className="relative max-w-2xl mx-auto">
            <div className="relative flex items-center shadow-lg rounded-2xl bg-surface-container-lowest border border-outline-variant focus-within:border-forest-700 focus-within:ring-4 focus-within:ring-primary-container/10 transition-all p-1.5">
              <div className="pl-3.5 pr-2 text-outline">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </div>
              <input
                className="w-full py-2.5 text-body-md font-body-md text-on-surface placeholder-outline border-none focus:outline-none focus:ring-0 bg-transparent"
                placeholder="Cari topik bantuan (misal: garansi benih, ekspedisi, instalasi IoT)..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="px-5 py-2.5 bg-forest-700 hover:opacity-90 text-white font-medium text-body-md font-body-md rounded-xl transition-colors shadow-sm flex items-center gap-1.5" type="button">
                <span>Cari</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MainContent */}
      <main className="max-w-4xl mx-auto px-margin py-12">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-body-md font-body-md whitespace-nowrap transition-all focus:outline-none ${
                activeCategory === cat
                  ? "bg-forest-700 text-white shadow-sm ring-2 ring-primary-container/20 font-semibold"
                  : "bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:border-outline hover:bg-surface-container-low font-medium"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {filteredItems.map((item, i) => {
            const isOpen = openIndices.has(i);
            return (
              <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden transition-all duration-200 hover:border-outline shadow-sm">
                <button
                  onClick={() => toggleItem(i)}
                  aria-expanded={isOpen}
                  className="w-full px-6 py-5 flex items-center justify-between text-left gap-4 cursor-pointer focus:outline-none select-none"
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isOpen ? "bg-forest-700" : "bg-outline-variant"}`} />
                    <span className="text-headline-sm font-headline-sm text-on-surface leading-snug">{item.question}</span>
                  </div>
                  <div className={`w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center shrink-0 text-on-surface-variant transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-on-surface-variant leading-relaxed text-body-md font-body-md border-t border-outline-variant/30">
                    {item.answer.split("\n").map((line, j) => (
                      <p key={j} className={j > 0 ? "mt-2" : ""} dangerouslySetInnerHTML={{ __html: line }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* HelpCTA */}
        <div className="mt-14 bg-primary rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="max-w-md">
              <div className="inline-flex items-center gap-2 text-label-md font-label-md text-forest-100 uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full mb-3">
                <span>Dukungan Teknis Agrobisnis</span>
              </div>
              <h3 className="text-headline-md font-headline-md tracking-tight">Tidak menemukan jawaban?</h3>
              <p className="mt-2 text-forest-100/80 text-body-md font-body-md">
                Konsultasikan rencana budidaya atau kendala instalasi Anda langsung bersama teknisi spesialis JagoFarm.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto flex-shrink-0">
              <a className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-body-md font-body-md bg-forest-700 hover:opacity-90 text-white shadow-md transition-all" href="https://wa.me/6281234567890" rel="noopener noreferrer" target="_blank">
                <span className="material-symbols-outlined text-[20px]">chat</span>
                <span>Chat WhatsApp CS</span>
              </a>
              <a className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-medium text-body-md font-body-md bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all" href="mailto:hello@jagofarm.id">
                <span className="material-symbols-outlined text-[18px]">mail</span>
                <span>Kirim Email</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
