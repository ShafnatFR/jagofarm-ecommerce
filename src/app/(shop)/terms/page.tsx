export const metadata = { title: "Syarat dan Ketentuan - JagoFarm" };

const terms = [
  { title: "Kelayakan Penggunaan Akun", icon: "person", text: "Anda harus berusia minimal 18 tahun atau memiliki izin wali untuk menggunakan layanan JagoFarm. Anda bertanggung jawab atas keamanan akun dan semua aktivitas yang terjadi di bawah akun Anda." },
  { title: "Akurasi Informasi Produk dan Harga", icon: "price_check", text: "Kami berusaha menyediakan informasi produk dan harga yang akurat. Namun, harga dapat berubah sewaktu-waktu tanpa pemberitahuan. Jika terjadi kesalahan harga, kami berhak membatalkan pesanan dan mengembalikan pembayaran." },
  { title: "Proses Pemesanan dan Pembayaran", icon: "shopping_cart", text: "Pesanan diproses setelah pembayaran dikonfirmasi. Batas waktu pembayaran 24 jam setelah checkout. Pesanan yang tidak dibayar akan otomatis dibatalkan. Harga yang tercantum sudah termasuk PPN." },
  { title: "Pengiriman dan Risiko", icon: "local_shipping", text: "Estimasi pengiriman bersifat perkiraan dan dapat berubah tergantung kondisi logistik. JagoFarm tidak bertanggung jawab atas keterlambatan pihak kurir. Risiko kerusakan pengiriman ditanggung oleh kurir, namun kami akan membantu proses klaim." },
  { title: "Garansi dan Pengembalian", icon: "verified", text: "Semua produk bergaransi sesuai ketentuan masing-masing. Pengembalian barang harus dalam kondisi asli dan dilaporkan dalam 24 jam. Garansi live arrival berlaku untuk anakan ikan dan bibit hidup." },
  { title: "Kekayaan Intelektual", icon: "copyright", text: "Semua konten di website JagoFarm (teks, gambar, logo, desain) adalah milik JagoFarm dan dilindungi hak cipta. Dilarang menyalin, mendistribusikan, atau menggunakan konten tanpa izin tertulis." },
  { title: "Perubahan Ketentuan", icon: "update", text: "JagoFarm berhak mengubah syarat dan ketentuan sewaktu-waktu. Perubahan akan diinformasikan melalui website dan email. Penggunaan layanan setelah perubahan dianggap sebagai persetujuan terhadap ketentuan baru." },
];

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
          <p className="text-body-lg font-body-lg text-primary-fixed max-w-2xl mx-auto">Dengan menggunakan layanan JagoFarm, Anda menyetujui syarat dan ketentuan berikut.</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-margin py-12">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="space-y-8">
            {terms.map((term) => (
              <div key={term.title} className="pb-8 border-b border-outline-variant last:border-0 last:pb-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-fixed/20 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">{term.icon}</span>
                  </div>
                  <h2 className="text-headline-md font-headline-md text-on-surface">{term.title}</h2>
                </div>
                <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed ml-[52px]">{term.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center text-body-sm font-body-sm text-outline">
          <p>Terakhir diperbarui: September 2026</p>
          <p className="mt-1">Jika ada pertanyaan, hubungi kami di <a href="mailto:hello@jagofarm.id" className="text-primary hover:underline">hello@jagofarm.id</a></p>
        </div>
      </section>
    </div>
  );
}