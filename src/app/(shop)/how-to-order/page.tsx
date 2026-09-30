export const metadata = { title: "Cara Pemesanan - JagoFarm" };

export default function HowToOrderPage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative pt-12 pb-14 bg-gradient-to-b from-primary-fixed/10 to-transparent">
        <div className="max-w-4xl mx-auto px-margin text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-50 border border-primary-fixed/40 text-primary text-label-md font-label-md uppercase tracking-wide mb-4 shadow-sm">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            Panduan Resmi Transaksi JagoFarm
          </div>
          <h1 className="text-headline-lg font-headline-lg md:text-[48px] md:leading-[56px] text-on-surface font-extrabold tracking-tight leading-tight mb-4">
            Cara Pemesanan Mudah &amp; Cepat
          </h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Belanja bibit ikan berkualitas tinggi, instalasi hidroponik presisi, hingga sensor otomatisasi IoT cerdas kini semakin terstruktur dan terlindungi garansi hidup sampai tujuan.
          </p>
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto mt-8 pt-6 border-t border-outline-variant/50">
            <div className="text-center">
              <div className="text-headline-md font-headline-md text-primary">5 Tahap</div>
              <div className="text-body-sm font-body-sm text-outline">Alur Praktis</div>
            </div>
            <div className="text-center border-x border-outline-variant">
              <div className="text-headline-md font-headline-md text-primary">100% Aman</div>
              <div className="text-body-sm font-body-sm text-outline">Verifikasi Otomatis</div>
            </div>
            <div className="text-center">
              <div className="text-headline-md font-headline-md text-primary">Garansi 7 Hari</div>
              <div className="text-body-sm font-body-sm text-outline">Penggantian Bibit</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stepper Section */}
      <section className="max-w-4xl mx-auto px-margin pb-16">
        <div className="relative space-y-6">
          {/* Step 1 */}
          <div className="relative flex flex-col sm:flex-row items-start gap-4 sm:gap-6 bg-surface-container-lowest p-6 sm:p-7 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-shrink-0 z-10 w-12 h-12 rounded-xl bg-forest-800 text-white flex items-center justify-center text-lg font-bold shadow-md ring-4 ring-surface-container-lowest">
              1
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex p-1.5 rounded-lg bg-forest-50 text-forest-700">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </span>
                <h2 className="text-headline-sm font-headline-sm text-on-surface">Pilih Produk &amp; Spesifikasi Pertanian</h2>
              </div>
              <p className="text-on-surface-variant text-body-md font-body-md leading-relaxed mb-4">
                Jelajahi katalog kami yang lengkap dan temukan produk pertanian modern yang sesuai dengan skala budidaya Anda. Manfaatkan filter komprehensif berdasarkan kategori, grade bibit, kapasitas panen, atau sertifikasi benih resmi.
              </p>
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-3.5 flex items-start gap-3 text-body-sm font-body-sm text-on-surface-variant">
                <span className="text-base">💡</span>
                <div>
                  <strong className="font-semibold text-on-surface">Tips Budidaya:</strong> Periksa tab spesifikasi teknis dan estimasi stok hidup harian agar waktu tanam Anda presisi.
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative flex flex-col sm:flex-row items-start gap-4 sm:gap-6 bg-surface-container-lowest p-6 sm:p-7 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-shrink-0 z-10 w-12 h-12 rounded-xl bg-forest-800 text-white flex items-center justify-center text-lg font-bold shadow-md ring-4 ring-surface-container-lowest">
              2
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex p-1.5 rounded-lg bg-forest-50 text-forest-700">
                  <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                </span>
                <h2 className="text-headline-sm font-headline-sm text-on-surface">Tambah ke Keranjang Belanja</h2>
              </div>
              <p className="text-on-surface-variant text-body-md font-body-md leading-relaxed mb-4">
                Pilih jumlah yang diinginkan dan klik <strong>&quot;Tambah ke Keranjang&quot;</strong>. Anda dapat terus memilih nutrisi AB Mix, pompa celup, atau pakan pelengkap lainnya, atau langsung klik <strong>&quot;Checkout Sekarang&quot;</strong> untuk proses kilat.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary-fixed/30 text-on-secondary-container text-body-sm font-body-sm rounded-md border border-secondary-fixed">
                  ⚡ Diskon Paket Bundle Otomatis
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-forest-50 text-primary text-body-sm font-body-sm rounded-md border border-primary-fixed/20">
                  📋 Pre-order Terfasilitasi
                </span>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative flex flex-col sm:flex-row items-start gap-4 sm:gap-6 bg-surface-container-lowest p-6 sm:p-7 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-shrink-0 z-10 w-12 h-12 rounded-xl bg-forest-800 text-white flex items-center justify-center text-lg font-bold shadow-md ring-4 ring-surface-container-lowest">
              3
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex p-1.5 rounded-lg bg-forest-50 text-forest-700">
                  <span className="material-symbols-outlined text-[20px]">location_on</span>
                </span>
                <h2 className="text-headline-sm font-headline-sm text-on-surface">Checkout &amp; Ekspedisi Khusus Beroksigen</h2>
              </div>
              <p className="text-on-surface-variant text-body-md font-body-md leading-relaxed mb-4">
                Masukkan alamat pengiriman dengan lengkap. Untuk pengiriman benih hidup dan tanaman, sistem kami secara otomatis merekomendasikan opsi pengiriman tercepat beroksigen dan berpendingin temperatur stabil.
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-label-md font-label-md text-outline uppercase tracking-wider">Mitra Resmi:</span>
                <span className="px-2.5 py-1 bg-surface-container-low rounded text-label-md font-label-md text-on-surface">JNE Yes/Trucking</span>
                <span className="px-2.5 py-1 bg-surface-container-low rounded text-label-md font-label-md text-on-surface">SiCepat Cargo</span>
                <span className="px-2.5 py-1 bg-surface-container-low rounded text-label-md font-label-md text-on-surface">AnterAja</span>
                <span className="px-2.5 py-1 bg-forest-50 text-primary rounded text-label-md font-label-md">Kargo Bandara Khusus Bibit</span>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative flex flex-col sm:flex-row items-start gap-4 sm:gap-6 bg-surface-container-lowest p-6 sm:p-7 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-shrink-0 z-10 w-12 h-12 rounded-xl bg-forest-800 text-white flex items-center justify-center text-lg font-bold shadow-md ring-4 ring-surface-container-lowest">
              4
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex p-1.5 rounded-lg bg-forest-50 text-forest-700">
                  <span className="material-symbols-outlined text-[20px]">credit_card</span>
                </span>
                <h2 className="text-headline-sm font-headline-sm text-on-surface">Pembayaran Aman &amp; Otomatis</h2>
              </div>
              <p className="text-on-surface-variant text-body-md font-body-md leading-relaxed mb-4">
                Lakukan pembayaran sesuai metode yang dipilih. Kami menerima transfer Virtual Account, QRIS instan, e-wallet (GoPay, OVO, ShopeePay), dan transfer manual. Batas waktu pelunasan adalah 24 jam dengan verifikasi otomatis detik itu juga.
              </p>
              <div className="flex items-center gap-3 text-body-sm font-body-sm text-on-surface-variant">
                <span className="inline-flex items-center gap-1 font-semibold text-forest-700">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Auto-Confirmed
                </span>
                <span>•</span>
                <span>Enkripsi SSL 256-Bit</span>
                <span>•</span>
                <span>Faktur Pajak Elektronik Tersedia</span>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="relative flex flex-col sm:flex-row items-start gap-4 sm:gap-6 bg-surface-container-lowest p-6 sm:p-7 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-shrink-0 z-10 w-12 h-12 rounded-xl bg-forest-800 text-white flex items-center justify-center text-lg font-bold shadow-md ring-4 ring-surface-container-lowest">
              5
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex p-1.5 rounded-lg bg-forest-50 text-forest-700">
                  <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                </span>
                <h2 className="text-headline-sm font-headline-sm text-on-surface">Terima Barang &amp; Garansi Perlindungan</h2>
              </div>
              <p className="text-on-surface-variant text-body-md font-body-md leading-relaxed mb-4">
                Pesanan Anda dikemas secara higienis menggunakan wadah standar agroindustri. Lacak posisi kiriman melalui menu <strong>&quot;Pesanan Saya&quot;</strong>. Saat barang sampai di depan pintu Anda, nikmati garansi perlindungan produk.
              </p>
              <div className="p-3.5 bg-forest-50 border border-primary-fixed/20 rounded-xl flex items-center gap-3">
                <span className="material-symbols-outlined text-[24px] text-forest-700 shrink-0">verified_user</span>
                <div className="text-body-sm font-body-sm text-on-surface">
                  <strong className="font-bold">Garansi Sampai Selamat:</strong> Jika benih atau peralatan tiba dalam keadaan rusak, klaim penggantian 100% dengan video unboxing dalam 1x24 jam.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="mt-12 bg-primary rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-xl text-center md:text-left">
              <span className="inline-block px-3 py-1 bg-white/10 text-forest-100 text-label-md font-label-md rounded-full mb-3 uppercase tracking-wider">
                Layanan Bantuan Pelanggan
              </span>
              <h3 className="text-headline-md font-headline-md tracking-tight mb-2">
                Butuh Bantuan Saat Memesan?
              </h3>
              <p className="text-forest-100/80 text-body-md font-body-md leading-relaxed">
                Tim spesialis akuaponik dan agrikultur kami siap mendampingi pemilihan modul, panduan pengiriman kargo, serta konsultasi gratis via WhatsApp setiap hari pukul <strong>08.00 - 20.00 WIB</strong>.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-shrink-0">
              <a className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-forest-700 hover:opacity-90 text-white font-bold rounded-xl shadow-lg transition" href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
                <span className="material-symbols-outlined text-[20px]">chat</span>
                Chat WhatsApp
              </a>
              <a className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold rounded-xl transition" href="/faq">
                Kunjungi Pusat FAQ
              </a>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h3 className="text-headline-md font-headline-md text-on-surface tracking-tight">Pertanyaan Populer Seputar Pemesanan</h3>
            <p className="text-outline text-body-md font-body-md mt-1">Jawaban cepat untuk hal-hal yang sering ditanyakan pembeli baru</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { q: "Berapa lama batas waktu pembayaran?", a: "Batas waktu adalah 24 jam setelah checkout. Jika melewati batas waktu tanpa konfirmasi, sistem akan otomatis membatalkan pesanan untuk mengembalikan stok." },
              { q: "Bagaimana jika bibit mati saat perjalanan?", a: "Kami menyertakan garansi 100% penggantian bibit baru atau pengembalian dana penuh dengan melampirkan video unboxing resmi saat paket pertama kali dibuka." },
              { q: "Apakah instalasi hidroponik dikirim terakit?", a: "Modul dikirim dalam sistem semi-rakit knock-down terproteksi bubble wrap tebal, lengkap dengan buku panduan visual & video perakitan 15 menit." },
              { q: "Apakah melayani pesanan partai besar (B2B)?", a: "Tentu saja! Untuk kebutuhan tambak skala industri atau instalasi greenhouse instansi, hubungi tim korporat kami untuk mendapatkan harga distributor." },
            ].map((item, i) => (
              <div key={i} className="p-5 bg-surface-container-lowest border border-outline-variant rounded-2xl">
                <h4 className="font-bold text-on-surface text-headline-sm font-headline-sm mb-2">{item.q}</h4>
                <p className="text-on-surface-variant text-body-md font-body-md leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
