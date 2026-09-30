export const metadata = { title: "Cara Pemesanan - JagoFarm" };

const steps = [
  { num: 1, icon: "touch_app", title: "Pilih Produk", desc: "Jelajahi katalog kami dan temukan produk pertanian modern yang sesuai kebutuhan Anda. Filter berdasarkan kategori, harga, atau popularitas." },
  { num: 2, icon: "shopping_cart", title: "Tambah ke Keranjang", desc: "Pilih jumlah yang diinginkan dan klik \"Tambah ke Keranjang\". Anda bisa lanjut berbelanja atau langsung checkout." },
  { num: 3, icon: "credit_card", title: "Checkout", desc: "Masukkan alamat pengiriman, pilih kurir, dan pilih metode pembayaran yang Anda inginkan." },
  { num: 4, icon: "payments", title: "Bayar", desc: "Lakukan pembayaran sesuai metode yang dipilih. Kami menerima transfer bank, e-wallet, dan QRIS. Batas waktu pembayaran 24 jam." },
  { num: 5, icon: "inventory_2", title: "Terima Barang", desc: "Pesanan Anda akan diproses dan dikirim. Lacak status pengiriman melalui halaman Pesanan Saya." },
];

export default function HowToOrderPage() {
  return (
    <div className="w-full">
      <section className="bg-primary text-on-primary py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-margin text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-secondary-fixed-dim text-label-md font-label-md mb-6 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>Panduan</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg md:text-[48px] md:leading-[56px] text-on-primary font-extrabold tracking-tight mb-4">Cara Pemesanan</h1>
          <p className="text-body-lg font-body-lg text-primary-fixed max-w-2xl mx-auto">Belanja di JagoFarm mudah dan cepat. Ikuti langkah-langkah berikut:</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-margin py-12">
        <div className="space-y-6">
          {steps.map((step) => (
            <div key={step.num} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex items-start gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary font-bold text-headline-sm font-headline-sm">
                {step.num}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-primary">{step.icon}</span>
                  <h2 className="text-headline-sm font-headline-sm text-on-surface">{step.title}</h2>
                </div>
                <p className="mt-1 text-body-md font-body-md text-on-surface-variant leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-3xl bg-surface-container-low border border-outline-variant p-8 text-center">
          <h2 className="text-headline-sm font-headline-sm text-on-surface">Butuh Bantuan?</h2>
          <p className="mt-2 text-body-md font-body-md text-on-surface-variant">
            Tim customer service kami siap membantu Anda via WhatsApp di <strong>+62 812-3456-7890</strong> setiap hari pukul 08.00 - 20.00 WIB.
          </p>
        </div>
      </section>
    </div>
  );
}