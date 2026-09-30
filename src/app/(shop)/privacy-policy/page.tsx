import Link from "next/link";

export const metadata = { title: "Kebijakan Privasi - JagoFarm" };

export default function PrivacypolicyPage() {
  return (
    <div className="w-full">
      <section className="bg-primary text-on-primary py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-margin text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-secondary-fixed-dim text-label-md font-label-md mb-6 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[16px]">shield</span>
            <span>Privasi</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg md:text-[48px] md:leading-[56px] text-on-primary font-extrabold tracking-tight mb-4">Kebijakan Privasi</h1>
          <p className="text-body-lg font-body-lg text-primary-fixed max-w-2xl mx-auto">Kami menjaga privasi data Anda dengan serius.</p>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-margin py-12">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm space-y-8">
          {([
            { title: "Data yang Kami Kumpulkan", items: ["Nama, email, nomor telepon", "Alamat pengiriman", "Riwayat transaksi", "Data pembayaran (tidak disimpan secara langsung)"] },
            { title: "Penggunaan Data", items: ["Memproses pesanan dan pengiriman", "Mengirim notifikasi status pesanan", "Meningkatkan layanan dan pengalaman pengguna", "Mengirim promosi (dengan persetujuan Anda)"] },
            { title: "Keamanan Data", items: ["Enkripsi SSL 256-bit", "Akses terbatas pada data sensitif", "Tidak menjual data ke pihak ketiga", "Penghaputan data atas permintaan"] },
            { title: "Hak Anda", items: ["Mengakses data pribadi Anda", "Memperbarui atau menghapus data", "Menolak komunikasi pemasaran", "Meminta salinan data Anda"] },
          ]).map((section) => (
            <div key={section.title}>
              <h2 className="text-headline-sm font-headline-sm text-on-surface mb-3">{section.title}</h2>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-body-md font-body-md text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">check</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
