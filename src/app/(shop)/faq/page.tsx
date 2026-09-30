export const metadata = { title: "FAQ - JagoFarm" };

export default function Page() {
  return (
    <div dangerouslySetInnerHTML={{__html: `<div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none" data-purpose="faq-categories">
<button className="px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap bg-brand-700 text-white shadow-sm transition-all focus:outline-none ring-2 ring-brand-700/20">
        Umum
      </button>
<button className="px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all">
        Pengiriman
      </button>
<button className="px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all">
        Pembayaran
      </button>
<button className="px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all">
        Produk &amp; Benih
      </button>
<button className="px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all">
        IoT &amp; Smart Farming
      </button>
</div>

<div className="space-y-4" data-purpose="faq-accordion-group">

<div className="faq-item bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-300 shadow-sm" data-category="umum">
<button aria-expanded="true" className="faq-trigger w-full px-6 py-5 flex items-center justify-between text-left gap-4 cursor-pointer focus:outline-none select-none" type="button">
<div className="flex items-center gap-3">
<span className="w-2 h-2 rounded-full bg-brand-700 flex-shrink-0" />
<span className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">Apa itu JagoFarm?</span>
</div>
<div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600 transition-transform duration-200 transform rotate-180 faq-chevron">
<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
<path d="m19.5 8.25-7.5 7.5-7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
</svg>
</div>
</button>
<div className="faq-body px-6 pb-6 pt-1 text-slate-600 leading-relaxed text-sm sm:text-base border-t border-slate-50">
<p>
<strong>JagoFarm</strong> adalah ekosistem dan penyedia solusi pertanian modern terintegrasi di Indonesia. Kami menghadirkan perangkat keras berkualitas untuk budidaya hidroponik, akuaponik, kolam tambak ikan terpal bulat/kotak, benih tanaman terverifikasi, anakan ikan unggul, hingga teknologi <em>IoT Smart Farming</em> yang memudahkan pemantauan kualitas air dan nutrisi secara <i>real-time</i> via smartphone.
          </p>
</div>
</div>

<div className="faq-item bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-300 shadow-sm" data-category="pengiriman">
<button aria-expanded="false" className="faq-trigger w-full px-6 py-5 flex items-center justify-between text-left gap-4 cursor-pointer focus:outline-none select-none" type="button">
<div className="flex items-center gap-3">
<span className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0" />
<span className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">Apakah JagoFarm melayani pengiriman ke seluruh Indonesia?</span>
</div>
<div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600 transition-transform duration-200 faq-chevron">
<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
<path d="m19.5 8.25-7.5 7.5-7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
</svg>
</div>
</button>
<div className="faq-body px-6 pb-6 pt-1 text-slate-600 leading-relaxed text-sm sm:text-base border-t border-slate-50 hidden">
<p className="mb-3">
            Ya, kami mengirim ke seluruh pelosok Nusantara dari hub logistik Surabaya dan Jakarta dengan metode pengiriman terkurasi:
          </p>
<ul className="list-disc pl-5 space-y-1.5 text-sm">
<li><strong>Benih Hidup &amp; Bibit:</strong> Dikemas dengan kantong oksigen medis ganda, styrofoam berinsulasi, dan proteksi es khusus hingga toleransi transit 72 jam.</li>
<li><strong>Paket Tambak &amp; Rangka Hidroponik:</strong> Bekerja sama dengan kargo rekanan terpercaya (JNE Trucking, Dakota Cargo, Indah Logistik) berbiaya hemat dan dilengkapi asuransi.</li>
<li><strong>Modul IoT &amp; Sensor:</strong> Menggunakan pengiriman reguler/kilat aman dengan kemasan anti-guncangan <i>bubble bubble-wrap tebal</i>.</li>
</ul>
</div>
</div>

<div className="faq-item bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-300 shadow-sm" data-category="umum">
<button aria-expanded="false" className="faq-trigger w-full px-6 py-5 flex items-center justify-between text-left gap-4 cursor-pointer focus:outline-none select-none" type="button">
<div className="flex items-center gap-3">
<span className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0" />
<span className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">Bagaimana cara menghubungi customer service?</span>
</div>
<div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600 transition-transform duration-200 faq-chevron">
<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
<path d="m19.5 8.25-7.5 7.5-7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
</svg>
</div>
</button>
<div className="faq-body px-6 pb-6 pt-1 text-slate-600 leading-relaxed text-sm sm:text-base border-t border-slate-50 hidden">
<p>
            Tim Agribisnis &amp; Customer Care JagoFarm siap melayani Anda setiap hari:
          </p>
<div className="mt-3 grid sm:grid-cols-2 gap-3">
<div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs sm:text-sm">
<div className="font-bold text-slate-800">WhatsApp Resmi</div>
<div className="text-brand-700 font-medium">+62 812-3456-7890</div>
<div className="text-slate-500 text-[11px] mt-0.5">Senin - Minggu: 08.00 - 20.00 WIB</div>
</div>
<div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs sm:text-sm">
<div className="font-bold text-slate-800">Email Dukungan</div>
<div className="text-brand-700 font-medium">hello@jagofarm.id</div>
<div className="text-slate-500 text-[11px] mt-0.5">Respon maksimal 1x24 jam kerja</div>
</div>
</div>
</div>
</div>

<div className="faq-item bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-300 shadow-sm" data-category="pembayaran">
<button aria-expanded="false" className="faq-trigger w-full px-6 py-5 flex items-center justify-between text-left gap-4 cursor-pointer focus:outline-none select-none" type="button">
<div className="flex items-center gap-3">
<span className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0" />
<span className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">Apakah ada garansi produk dan benih hidup?</span>
</div>
<div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600 transition-transform duration-200 faq-chevron">
<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
<path d="m19.5 8.25-7.5 7.5-7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
</svg>
</div>
</button>
<div className="faq-body px-6 pb-6 pt-1 text-slate-600 leading-relaxed text-sm sm:text-base border-t border-slate-50 hidden">
<p>
            Tentu saja. Kepuasan dan keberhasilan panen Anda adalah prioritas kami:
          </p>
<div className="mt-3 space-y-2 text-sm">
<div className="flex items-start gap-2">
<svg className="w-5 h-5 text-brand-700 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round" /></svg>
<span><strong>Garansi Live Arrival (Benih Hidup Sampai Tujuan):</strong> Penggantian 100% atau refund jika anakan ikan/bibit mengalami kematian saat paket dibuka (sertakan video unboxing tanpa jeda maksimal 2 jam setelah paket tiba).</span>
</div>
<div className="flex items-start gap-2">
<svg className="w-5 h-5 text-brand-700 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round" /></svg>
<span><strong>Garansi Elektronik &amp; IoT 12 Bulan:</strong> Mencakup modul kontroler utama, pompa air, dan sensor mikrokontroler jika terjadi cacat manufaktur.</span>
</div>
<div className="flex items-start gap-2">
<svg className="w-5 h-5 text-brand-700 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round" /></svg>
<span><strong>Garansi Terpal &amp; Kolam 3 Tahun:</strong> Ketahanan terpal semi-karet terhadap kebocoran material di bawah pemakaian normal.</span>
</div>
</div>
</div>
</div>

<div className="faq-item bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-300 shadow-sm" data-category="iot">
<button aria-expanded="false" className="faq-trigger w-full px-6 py-5 flex items-center justify-between text-left gap-4 cursor-pointer focus:outline-none select-none" type="button">
<div className="flex items-center gap-3">
<span className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0" />
<span className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">Bagaimana cara kerja perangkat IoT &amp; Smart Farming JagoFarm?</span>
</div>
<div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600 transition-transform duration-200 faq-chevron">
<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
<path d="m19.5 8.25-7.5 7.5-7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
</svg>
</div>
</button>
<div className="faq-body px-6 pb-6 pt-1 text-slate-600 leading-relaxed text-sm sm:text-base border-t border-slate-50 hidden">
<p>
            Modul IoT kami menggunakan sistem <em>Plug-and-Play</em>. Anda cukup menancapkan sensor pH, sensor Dissolved Oxygen (DO), TDS nutrisi, dan suhu ke kolam atau reservoir hidroponik. Alat akan otomatis mengirim data melalui koneksi Wi-Fi/GSM ke aplikasi <strong>JagoFarm Mobile Dashboard</strong>, dengan fitur peringatan bahaya otomatis via notifikasi WhatsApp jika kualitas air menurun.
          </p>
</div>
</div>

<div className="faq-item bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-300 shadow-sm" data-category="pembayaran">
<button aria-expanded="false" className="faq-trigger w-full px-6 py-5 flex items-center justify-between text-left gap-4 cursor-pointer focus:outline-none select-none" type="button">
<div className="flex items-center gap-3">
<span className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0" />
<span className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">Metode pembayaran apa saja yang didukung?</span>
</div>
<div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600 transition-transform duration-200 faq-chevron">
<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
<path d="m19.5 8.25-7.5 7.5-7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
</svg>
</div>
</button>
<div className="faq-body px-6 pb-6 pt-1 text-slate-600 leading-relaxed text-sm sm:text-base border-t border-slate-50 hidden">
<p>
            Kami mendukung ragam pembayaran instan dan aman melalui Payment Gateway resmi terlisensi Bank Indonesia:
          </p>
<div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-medium text-slate-700">
<div className="bg-slate-100 p-2.5 rounded-lg text-center">QRIS (Gopay/OVO/ShopeePay)</div>
<div className="bg-slate-100 p-2.5 rounded-lg text-center">Virtual Account BCA/Mandiri/BRI</div>
<div className="bg-slate-100 p-2.5 rounded-lg text-center">Transfer Bank Manual</div>
<div className="bg-slate-100 p-2.5 rounded-lg text-center">Cicilan Kartu Kredit 0%</div>
</div>
</div>
</div>
</div>

<div className="mt-14 bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden" data-purpose="contact-cta-card">
<div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/5 rounded-full blur-2xl pointer-events-none" />
<div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
<div className="max-w-md">
<div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-200 bg-white/10 px-3 py-1 rounded-full mb-3">
<span>Dukungan Teknis Agrobisnis</span>
</div>
<h3 className="text-2xl sm:text-3xl font-bold tracking-tight">Tidak menemukan jawaban?</h3>
<p className="mt-2 text-brand-100/90 text-sm sm:text-base">
            Konsultasikan rencana budidaya atau kendala instalasi Anda langsung bersama teknisi spesialis JagoFarm.
          </p>
</div>
<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto flex-shrink-0">

<a className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm bg-emerald-500 hover:bg-emerald-400 text-white shadow-md transition-all" href="https://wa.me/6281234567890" rel="noopener noreferrer" target="_blank">
<svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
<path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.63c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06s-1.05-.39-2-1.23c-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43s.17-.25.25-.42c.08-.17.04-.31-.02-.44s-.56-1.35-.77-1.85c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.18-.47-.3Z" />
</svg>
<span>Chat WhatsApp CS</span>
</a>

<a className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-medium text-sm bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all" href="mailto:hello@jagofarm.id">
<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
<path d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" strokeLinecap="round" strokeLinejoin="round" />
</svg>
<span>Kirim Email</span>
</a>
</div>
</div>
</div>`}} />
  );
}
