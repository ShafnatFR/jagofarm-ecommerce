import Link from "next/link";

export const metadata = { title: "Syarat dan Ketentuan - JagoFarm" };

export default function TermsPage() {
  return (
    <div className="w-full">
      <section className="bg-primary text-on-primary py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-margin text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-secondary-fixed-dim text-label-md font-label-md mb-6 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[16px]">gavel</span>
            <span>Syarat</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg md:text-[48px] md:leading-[56px] text-on-primary font-extrabold tracking-tight mb-4">Syarat dan Ketentuan</h1>
          <p className="text-body-lg font-body-lg text-primary-fixed max-w-2xl mx-auto">Dengan menggunakan layanan JagoFarm, Anda menyetujui syarat berikut.</p>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-margin py-12">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm space-y-8">
          {([
            { title: "Pemesanan & Pembayaran", text: "Pesanan diproses setelah pembayaran dikonfirmasi. Batas waktu pembayaran 24 jam. Harga yang tercantum sudah termasuk PPN." },
            { title: "Pengiriman", text: "Estimasi pengiriman bersifat perkiraan. JagoFarm tidak bertanggung jawab atas keterlambatan pihak kurir. Risiko kerusakan pengiriman ditanggung oleh kurir." },
            { title: "Garansi & Pengembalian", text: "Semua produk bergaransi sesuai ketentuan masing-masing. Pengembalian barang harus dalam kondisi asli dan dilaporkan dalam 24 jam." },
            { title: "Kekayaan Intelektual", text: "Semua konten di website JagoFarm (teks, gambar, logo) adalah milik JagoFarm dan dilindungi hak cipta." },
            { title: "Perubahan Ketentuan", text: "JagoFarm berhak mengubah syarat dan ketentuan sewaktu-waktu. Perubahan akan diinformasikan melalui website." },
          ]).map((section) => (
            <div key={section.title}>
              <h2 className="text-headline-sm font-headline-sm text-on-surface mb-2">{section.title}</h2>
              <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">{section.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
