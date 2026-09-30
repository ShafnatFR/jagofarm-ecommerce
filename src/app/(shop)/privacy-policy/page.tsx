export const metadata = { title: "Kebijakan Privasi - JagoFarm" };

const sections = [
  { title: "Data yang Kami Kumpulkan", icon: "database", items: ["Nama lengkap, email, nomor telepon", "Alamat pengiriman dan penagihan", "Riwayat transaksi dan preferensi produk", "Data pembayaran (diproses oleh payment gateway, tidak disimpan langsung)", "Informasi perangkat dan lokasi (untuk optimasi pengiriman)"] },
  { title: "Tujuan Penggunaan Data", icon: "target", items: ["Memproses pesanan dan pengiriman produk", "Mengirim notifikasi status pesanan dan pengiriman", "Meningkatkan layanan dan pengalaman pengguna", "Mengirim promosi dan penawaran khusus (dengan persetujuan Anda)", "Analisis statistik untuk pengembangan produk"] },
  { title: "Keamanan Data", icon: "shield", items: ["Enkripsi SSL 256-bit untuk semua transaksi", "Akses terbatas pada data sensitif (hanya tim terotorisasi)", "Tidak menjual atau membagikan data ke pihak ketiga tanpa izin", "Audit keamanan berkala oleh tim IT internal"] },
  { title: "Hak Anda", icon: "balance", items: ["Mengakses dan memperbarui data pribadi Anda", "Meminta penghapusan data akun", "Menolak komunikasi pemasaran kapan saja", "Meminta salinan data yang kami miliki tentang Anda"] },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full">
      <section className="bg-forest-800 text-white py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-margin text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-secondary-fixed-dim text-label-md font-label-md mb-6 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[16px]">shield</span>
            <span>Privasi</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg md:text-[48px] md:leading-[56px] text-white font-extrabold tracking-tight mb-4">Kebijakan Privasi</h1>
          <p className="text-body-lg font-body-lg text-forest-100 max-w-2xl mx-auto">Kami menjaga privasi data Anda dengan serius. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda.</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-margin py-12">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="space-y-8">
            {sections.map((section) => (
              <div key={section.title}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-forest-100 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">{section.icon}</span>
                  </div>
                  <h2 className="text-headline-md font-headline-md text-on-surface">{section.title}</h2>
                </div>
                <ul className="space-y-2.5 ml-[52px]">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-body-md font-body-md text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px] text-primary mt-0.5 shrink-0">check</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 bg-surface-container-low border border-outline-variant rounded-2xl p-6 text-center">
          <span className="material-symbols-outlined text-[32px] text-primary mb-2">mail</span>
          <h3 className="text-headline-sm font-headline-sm text-on-surface">Pertanyaan tentang Privasi?</h3>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1 mb-4">Hubungi kami jika Anda memiliki pertanyaan tentang kebijakan privasi ini.</p>
          <a href="mailto:hello@jagofarm.id" className="inline-flex items-center gap-2 bg-primary hover:bg-forest-700 text-white font-label-lg font-label-lg px-5 py-2.5 rounded-full transition-all active:scale-95">
            <span className="material-symbols-outlined text-[18px]">mail</span>
            hello@jagofarm.id
          </a>
        </div>
      </section>
    </div>
  );
}