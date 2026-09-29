import Link from "next/link";

export default function HomePage() {
  return (
    <div className="w-full">
      {/* HERO SECTION */}
      <section className="relative bg-primary overflow-hidden text-on-primary py-12 md:py-16 lg:py-20">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-container opacity-40 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 right-1/4 w-[500px] h-[500px] rounded-full bg-tertiary-container opacity-30 blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 right-10 w-80 h-80 rounded-full bg-secondary-fixed-dim opacity-10 blur-3xl pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-margin relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Hero Text Cluster */}
            <div className="lg:col-span-7 flex flex-col items-start space-y-6">
              {/* Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-lowest/10 backdrop-blur-md border border-white/20 text-secondary-fixed-dim text-label-md font-label-md">
                <span className="material-symbols-outlined text-[16px] text-secondary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span>Set Tambak Siap Pakai &amp; IoT Terintegrasi</span>
              </div>
              {/* Main Headline */}
              <div className="space-y-1">
                <h1 className="text-display-hero-mobile md:text-display-hero font-display-hero tracking-tight text-on-primary">
                  Budi Daya Tambak <br className="hidden sm:inline"/>
                  <span className="text-secondary-fixed-dim underline decoration-secondary-fixed-dim/40 decoration-4 underline-offset-8">Lebih Terukur</span>
                </h1>
              </div>
              {/* Subtitle */}
              <p className="text-body-lg font-body-lg text-primary-fixed max-w-xl leading-relaxed">
                Set tambak lengkap — dari pompa, aerator, hingga sensor pintar kualitas air — untuk hasil panen yang lebih stabil dan menguntungkan sepanjang musim.
              </p>
              {/* CTA Actions */}
              <div className="flex flex-wrap items-center gap-4 pt-2 w-full sm:w-auto">
                <Link className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-secondary-fixed-dim hover:bg-secondary text-primary font-headline-sm text-headline-sm px-6 py-3.5 rounded-full shadow-lg transition-all duration-200 hover:shadow-secondary-container/20 active:scale-95 font-bold" href="#produk">
                  <span>Lihat Set Tambak</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </Link>
                <Link className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-on-primary border border-white/30 backdrop-blur-md font-headline-sm text-headline-sm px-6 py-3.5 rounded-full transition-all duration-200 active:scale-95 font-semibold" href="/contact">
                  <span className="material-symbols-outlined text-[20px]">headset_mic</span>
                  <span>Konsultasi Gratis</span>
                </Link>
              </div>
              {/* Trust Metrics Bar */}
              <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-6 w-full max-w-lg">
                <div>
                  <p className="text-headline-md font-headline-md font-extrabold text-secondary-fixed-dim">12.500+</p>
                  <p className="text-body-sm font-body-sm text-primary-fixed-dim">Petani Mitra Aktif</p>
                </div>
                <div>
                  <p className="text-headline-md font-headline-md font-extrabold text-tertiary-fixed">99.4%</p>
                  <p className="text-body-sm font-body-sm text-primary-fixed-dim">Tingkat Sukses Panen</p>
                </div>
                <div>
                  <p className="text-headline-md font-headline-md font-extrabold text-on-primary">24/7</p>
                  <p className="text-body-sm font-body-sm text-primary-fixed-dim">Telemetry IoT Real-Time</p>
                </div>
              </div>
            </div>
            {/* Right Hero Visual Bento Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative bg-gradient-to-br from-primary-container to-primary/95 border border-white/20 rounded-2xl p-6 shadow-2xl backdrop-blur-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-tertiary-fixed/20 border border-tertiary-fixed/40 flex items-center justify-center text-tertiary-fixed">
                      <span className="material-symbols-outlined text-[22px]">sensors</span>
                    </div>
                    <div>
                      <h3 className="text-headline-sm font-headline-sm text-on-primary">Tambak Udang Vaname #04</h3>
                      <p className="text-label-md font-label-md text-primary-fixed-dim">Sistem Bioflok Terkoneksi IoT</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse"></span>
                    <span className="text-label-sm font-label-sm text-tertiary-fixed uppercase font-bold tracking-wider">Live</span>
                  </div>
                </div>
                <div className="relative rounded-xl overflow-hidden mb-5 aspect-[4/3] bg-surface-container-highest/20 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Aquaculture" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPxGG-dH91AF0yCS1bFwXM6PNLiVBgffT8CCHwo1DTldWOJ5IwyXFJhnTnThQmJiF3NrzGU-is6FDzNzspHkIL6g-D6lgN9ztEmR5IVZivF2G5zJ-QB8lMAKmd44XduI0N_TmIt5Bvft3emh4kRox8HEt7jIIYDM8gHnwIZN0bUHxpDGep_7l09pj-MMG3z5rj_smhR3n8Wkk3kVch6YmHld0JUql99gE2SRZkehQ0Vod8H6V1zKK21w"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-surface-container-lowest/90 backdrop-blur-md px-3.5 py-2 rounded-xl text-primary border border-white/50 shadow-md">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-tertiary-container text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span>
                      <div>
                        <p className="text-label-sm font-label-sm text-outline">Kondisi Air Tambak</p>
                        <p className="text-label-lg font-label-lg font-bold text-primary">Sangat Optimal (Grade A)</p>
                      </div>
                    </div>
                    <span className="text-headline-sm font-headline-sm text-primary font-extrabold">98.2%</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                    <p className="text-label-sm font-label-sm text-primary-fixed-dim">Dissolved O₂</p>
                    <p className="text-headline-sm font-headline-sm font-extrabold text-tertiary-fixed mt-0.5">6.8 mg/L</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-white/70 bg-white/10 px-2 py-0.5 rounded">Normal</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                    <p className="text-label-sm font-label-sm text-primary-fixed-dim">Derajat Keasaman</p>
                    <p className="text-headline-sm font-headline-sm font-extrabold text-secondary-fixed-dim mt-0.5">pH 7.4</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-white/70 bg-white/10 px-2 py-0.5 rounded">Stabil</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                    <p className="text-label-sm font-label-sm text-primary-fixed-dim">Suhu Kolam</p>
                    <p className="text-headline-sm font-headline-sm font-extrabold text-on-primary mt-0.5">28.5 °C</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-white/70 bg-white/10 px-2 py-0.5 rounded">Ideal</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="w-6 h-2 rounded-full bg-secondary-fixed-dim"></span>
                <span className="w-2 h-2 rounded-full bg-white/30 hover:bg-white/60 cursor-pointer"></span>
                <span className="w-2 h-2 rounded-full bg-white/30 hover:bg-white/60 cursor-pointer"></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST & VALUE HIGHLIGHTS STRIP */}
      <section className="border-b border-outline-variant bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto px-margin py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="flex items-center gap-3.5 p-2">
              <div className="w-12 h-12 rounded-xl bg-primary-fixed/30 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]">local_shipping</span>
              </div>
              <div>
                <h4 className="text-headline-sm font-headline-sm text-on-surface">Pengiriman Cepat</h4>
                <p className="text-body-sm font-body-sm text-on-surface-variant">Kirim ke seluruh Indonesia</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5 p-2">
              <div className="w-12 h-12 rounded-xl bg-secondary-fixed/50 text-secondary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              </div>
              <div>
                <h4 className="text-headline-sm font-headline-sm text-on-surface">Garansi Produk</h4>
                <p className="text-body-sm font-body-sm text-on-surface-variant">Jaminan kualitas 100% orisinil</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5 p-2">
              <div className="w-12 h-12 rounded-xl bg-tertiary-fixed/40 text-tertiary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]">support_agent</span>
              </div>
              <div>
                <h4 className="text-headline-sm font-headline-sm text-on-surface">Konsultasi Gratis</h4>
                <p className="text-body-sm font-body-sm text-on-surface-variant">Tim ahli agronom siap bantu</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5 p-2">
              <div className="w-12 h-12 rounded-xl bg-primary-fixed/30 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]">credit_card</span>
              </div>
              <div>
                <h4 className="text-headline-sm font-headline-sm text-on-surface">Pembayaran Aman</h4>
                <p className="text-body-sm font-body-sm text-on-surface-variant">Midtrans, VA &amp; cicilan 0%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: KATEGORI PRODUK */}
      <section className="py-14 md:py-16 max-w-7xl mx-auto px-margin" id="kategori">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-label-md font-label-md uppercase tracking-wider text-secondary font-bold">Katalog Unggulan</span>
            <h2 className="text-headline-lg font-headline-lg text-on-surface mt-1">Kategori Produk</h2>
            <p className="text-body-md font-body-md text-on-surface-variant mt-1">Temukan kebutuhan pertanian dan budi daya modern Anda</p>
          </div>
          <Link className="inline-flex items-center gap-1.5 text-primary hover:text-secondary font-headline-sm text-headline-sm group transition-colors" href="/products">
            <span>Lihat Semua Kategori</span>
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link className="group bg-surface-container-lowest border border-outline-variant hover:border-primary rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md" href="/products?category=set-tambak">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-low group-hover:bg-primary-fixed flex items-center justify-center text-primary transition-colors mb-3.5">
              <span className="material-symbols-outlined text-[28px]">water</span>
            </div>
            <h3 className="text-headline-sm font-headline-sm text-on-surface group-hover:text-primary transition-colors">Set Tambak</h3>
            <p className="text-body-sm font-body-sm text-outline mt-1 line-clamp-2">Paket kolam terpal bulat &amp; bioflok air tawar</p>
          </Link>
          <Link className="group bg-surface-container-lowest border border-outline-variant hover:border-primary rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md" href="/products?category=set-hidroponik">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-low group-hover:bg-primary-fixed flex items-center justify-center text-primary transition-colors mb-3.5">
              <span className="material-symbols-outlined text-[28px]">potted_plant</span>
            </div>
            <h3 className="text-headline-sm font-headline-sm text-on-surface group-hover:text-primary transition-colors">Set Hidroponik</h3>
            <p className="text-body-sm font-body-sm text-outline mt-1 line-clamp-2">Kit NFT, DWC &amp; Wick pipa talang lengkap</p>
          </Link>
          <Link className="group bg-surface-container-lowest border border-outline-variant hover:border-primary rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md" href="/products?category=set-aquaponik">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-low group-hover:bg-primary-fixed flex items-center justify-center text-primary transition-colors mb-3.5">
              <span className="material-symbols-outlined text-[28px]">set_meal</span>
            </div>
            <h3 className="text-headline-sm font-headline-sm text-on-surface group-hover:text-primary transition-colors">Set Aquaponik</h3>
            <p className="text-body-sm font-body-sm text-outline mt-1 line-clamp-2">Sistem simbiosis terpadu ikan &amp; tanaman</p>
          </Link>
          <Link className="group bg-surface-container-lowest border border-outline-variant hover:border-primary rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md relative overflow-hidden" href="/products?category=iot-smart-farming">
            <span className="absolute top-2 right-2 text-[9px] bg-secondary-fixed-dim text-primary font-bold px-1.5 py-0.5 rounded-full">POPULER</span>
            <div className="w-14 h-14 rounded-2xl bg-surface-container-low group-hover:bg-primary-fixed flex items-center justify-center text-primary transition-colors mb-3.5">
              <span className="material-symbols-outlined text-[28px]">developer_board</span>
            </div>
            <h3 className="text-headline-sm font-headline-sm text-on-surface group-hover:text-primary transition-colors">IoT &amp; Smart Farming</h3>
            <p className="text-body-sm font-body-sm text-outline mt-1 line-clamp-2">Sensor, monitoring &amp; kontroler otomatis</p>
          </Link>
          <Link className="group bg-surface-container-lowest border border-outline-variant hover:border-primary rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md" href="/products?category=benih">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-low group-hover:bg-primary-fixed flex items-center justify-center text-primary transition-colors mb-3.5">
              <span className="material-symbols-outlined text-[28px]">spa</span>
            </div>
            <h3 className="text-headline-sm font-headline-sm text-on-surface group-hover:text-primary transition-colors">Benih Unggulan</h3>
            <p className="text-body-sm font-body-sm text-outline mt-1 line-clamp-2">Bibit sayuran, buah hibrida, &amp; media tanam</p>
          </Link>
          <Link className="group bg-surface-container-lowest border border-outline-variant hover:border-primary rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md" href="/products?category=anakan-ikan">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-low group-hover:bg-primary-fixed flex items-center justify-center text-primary transition-colors mb-3.5">
              <span className="material-symbols-outlined text-[28px]">waves</span>
            </div>
            <h3 className="text-headline-sm font-headline-sm text-on-surface group-hover:text-primary transition-colors">Bibit Ikan</h3>
            <p className="text-body-sm font-body-sm text-outline mt-1 line-clamp-2">Benih lele sangkuriang, nila merah, &amp; gurame</p>
          </Link>
        </div>
      </section>

      {/* SECTION: PRODUK UNGGULAN (PRODUCT GRID) */}
      <section className="py-12 bg-surface-container-low border-y border-outline-variant/60" id="produk">
        <div className="max-w-7xl mx-auto px-margin">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-label-md font-label-md uppercase tracking-wider text-secondary font-bold">Produk Teruji</span>
              <h2 className="text-headline-lg font-headline-lg text-on-surface mt-1">Produk Unggulan</h2>
              <p className="text-body-md font-body-md text-on-surface-variant mt-1">Pilihan terbaik petani modern Indonesia dengan garansi resmi</p>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
              <button className="px-4 py-1.5 rounded-full bg-primary text-on-primary text-label-md font-label-md whitespace-nowrap shadow-sm">Semua</button>
              <button className="px-4 py-1.5 rounded-full bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant border border-outline-variant text-label-md font-label-md whitespace-nowrap transition-colors">IoT &amp; Smart Sensor</button>
              <button className="px-4 py-1.5 rounded-full bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant border border-outline-variant text-label-md font-label-md whitespace-nowrap transition-colors">Set Kolam Tambak</button>
              <button className="px-4 py-1.5 rounded-full bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant border border-outline-variant text-label-md font-label-md whitespace-nowrap transition-colors">Hidroponik &amp; Nutrisi</button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Product Card 1 */}
            <div className="bg-surface-container-lowest border border-outline-variant hover:border-primary/50 rounded-2xl p-4 flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group">
              <div className="relative rounded-xl overflow-hidden aspect-square bg-[#F1F5F2] mb-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="Benih Pakcoy" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTquTNWikCg0aYjdTL7KnZgc5RZBKmrtv1wDxVPL6V4CQEOFmeqtFtWAzZFEacHe7YDR0Ho-U3UlU0UYllHpdKneOXpbnpqlbDn12I87kcSYKcBhu05zQlX2T3a37WE8hOJQz_6QBehy_yBSKnE0v-nlRUdFdWbdi8WOiuJpCLqYmYDkSSIhK3pgfe1J_DbUVF1SgfBlpi-iQNFK8tgZPbmHZHv3cdTaifDrElI4-F_8QA2U662adb7Q"/>
                <span className="absolute top-2.5 left-2.5 bg-secondary-fixed-dim text-primary text-label-sm font-label-sm px-2.5 py-0.5 rounded-full font-bold shadow-sm">Unggulan</span>
                <button aria-label="Favorit" className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-surface-container-lowest/80 backdrop-blur-sm text-outline hover:text-error flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-[18px]">favorite</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-label-sm font-label-sm text-outline">Benih &amp; Tanaman</span>
                <span className="text-outline">•</span>
                <div className="flex items-center text-amber-500 text-label-sm font-label-sm font-semibold">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="ml-0.5 text-on-surface">4.9</span>
                  <span className="text-outline text-[11px] ml-1">(1.2rb terjual)</span>
                </div>
              </div>
              <h3 className="text-headline-sm font-headline-sm text-on-surface line-clamp-2 group-hover:text-primary transition-colors flex-1">
                Benih Pakcoy Premium F1 (100 Biji)
              </h3>
              <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between">
                <div>
                  <span className="text-label-sm font-label-sm text-outline">Harga Spesial</span>
                  <p className="text-price-lg font-price-lg text-primary">Rp 25.000</p>
                </div>
                <button aria-label="Tambah ke Keranjang" className="w-10 h-10 rounded-xl bg-primary hover:bg-secondary-fixed-dim text-on-primary hover:text-primary flex items-center justify-center transition-colors shadow-sm active:scale-95">
                  <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                </button>
              </div>
            </div>

            {/* Product Card 2 */}
            <div className="bg-surface-container-lowest border border-outline-variant hover:border-primary/50 rounded-2xl p-4 flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group">
              <div className="relative rounded-xl overflow-hidden aspect-square bg-[#F1F5F2] mb-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="Paket IoT" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLm82fByr-Gr3NUho_P7iSm8LPaO1KE41iFtdxs9I2mK8unkzgiGLVTbWzfwF-zADc0iAYRIx5biFje8RFccS-ngEUFouHm4TXfwHS610egDSSqWvqaKsxnySmiNeGDiMG7i9B8qN26NiYMGt9_aBQFv-r6pD4UOUgMwnUNfoqGPq5UpqVkxRwGrXkzBmyTkvmO5vu_PfTP-215h-4KzhtI8LA_R7xz7wMxY8G4OjGlGChjDPKbHL2hA"/>
                <span className="absolute top-2.5 left-2.5 bg-tertiary text-tertiary-fixed text-label-sm font-label-sm px-2.5 py-0.5 rounded-full font-bold shadow-sm">IoT Powered</span>
                <button aria-label="Favorit" className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-surface-container-lowest/80 backdrop-blur-sm text-outline hover:text-error flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-[18px]">favorite</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-label-sm font-label-sm text-outline">IoT &amp; Smart Farming</span>
                <span className="text-outline">•</span>
                <div className="flex items-center text-amber-500 text-label-sm font-label-sm font-semibold">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="ml-0.5 text-on-surface">5.0</span>
                  <span className="text-outline text-[11px] ml-1">(420 terjual)</span>
                </div>
              </div>
              <h3 className="text-headline-sm font-headline-sm text-on-surface line-clamp-2 group-hover:text-primary transition-colors flex-1">
                Paket IoT Kolam Tambak Pro Lengkap
              </h3>
              <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between">
                <div>
                  <span className="text-label-sm font-label-sm text-outline">Garansi 2 Tahun</span>
                  <p className="text-price-lg font-price-lg text-primary">Rp 2.200.000</p>
                </div>
                <button aria-label="Tambah ke Keranjang" className="w-10 h-10 rounded-xl bg-primary hover:bg-secondary-fixed-dim text-on-primary hover:text-primary flex items-center justify-center transition-colors shadow-sm active:scale-95">
                  <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                </button>
              </div>
            </div>

            {/* Product Card 3 */}
            <div className="bg-surface-container-lowest border border-outline-variant hover:border-primary/50 rounded-2xl p-4 flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group">
              <div className="relative rounded-xl overflow-hidden aspect-square bg-[#F1F5F2] mb-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="Auto Feeder" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFeg1x0P1AEs8tTjN5PJrmonzhTqpwI-jNpQ_uZGBHbCnLlmDZdSeRkJUiLgwGAXqCbqn8BeRMesDug7Y9ajR1eBqxhKwvmCd4u6ei0PnBMXJQCwNRpVgocpnYlvwQ1tJQK2A4EKigaawlO813jk8u56_Z_xZ-AQetUeg_OUUF_YMqjmRuSWfUC5YzwBC361zeIfuh6sOMbzDeyBFbLkK09kFrLcl7rnkp2q4oxYnvIQRmMuT0EhEGLQ"/>
                <span className="absolute top-2.5 left-2.5 bg-secondary-fixed-dim text-primary text-label-sm font-label-sm px-2.5 py-0.5 rounded-full font-bold shadow-sm">Unggulan</span>
                <button aria-label="Favorit" className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-surface-container-lowest/80 backdrop-blur-sm text-outline hover:text-error flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-[18px]">favorite</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-label-sm font-label-sm text-outline">IoT &amp; Smart Farming</span>
                <span className="text-outline">•</span>
                <div className="flex items-center text-amber-500 text-label-sm font-label-sm font-semibold">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="ml-0.5 text-on-surface">4.8</span>
                  <span className="text-outline text-[11px] ml-1">(680 terjual)</span>
                </div>
              </div>
              <h3 className="text-headline-sm font-headline-sm text-on-surface line-clamp-2 group-hover:text-primary transition-colors flex-1">
                Auto Feeder Pakan Otomatis Wi-Fi
              </h3>
              <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between">
                <div>
                  <span className="text-label-sm font-label-sm text-outline">Kapasitas 15kg</span>
                  <p className="text-price-lg font-price-lg text-primary">Rp 350.000</p>
                </div>
                <button aria-label="Tambah ke Keranjang" className="w-10 h-10 rounded-xl bg-primary hover:bg-secondary-fixed-dim text-on-primary hover:text-primary flex items-center justify-center transition-colors shadow-sm active:scale-95">
                  <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                </button>
              </div>
            </div>

            {/* Product Card 4 */}
            <div className="bg-surface-container-lowest border border-outline-variant hover:border-primary/50 rounded-2xl p-4 flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group">
              <div className="relative rounded-xl overflow-hidden aspect-square bg-[#F1F5F2] mb-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="Sensor pH" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwTUddSBtF2uU8omKSU-ezzLqaU986wii_4naNSH3dj7qJOUmJz9h3Fd0PlKeyz-TawW83QJpArkOkHlk_j4gqCsqpAE0lvf8ncEhz27YOPUR0hVyAcbIfOkkTXHGt-85-wL9EKUkguJAMh8c48_LAcCQA2u9sl6tQiew2oHjygb2iIN_eTxcC-kU4HXFOVMv1UwFTnLmJkydI3UKKM--u3wwj13qOZaPrknOfIVN93zzKjjeCzHKCeg"/>
                <span className="absolute top-2.5 left-2.5 bg-secondary-fixed-dim text-primary text-label-sm font-label-sm px-2.5 py-0.5 rounded-full font-bold shadow-sm">Unggulan</span>
                <button aria-label="Favorit" className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-surface-container-lowest/80 backdrop-blur-sm text-outline hover:text-error flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-[18px]">favorite</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-label-sm font-label-sm text-outline">Alat Ukur Air</span>
                <span className="text-outline">•</span>
                <div className="flex items-center text-amber-500 text-label-sm font-label-sm font-semibold">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="ml-0.5 text-on-surface">4.9</span>
                  <span className="text-outline text-[11px] ml-1">(2.1rb terjual)</span>
                </div>
              </div>
              <h3 className="text-headline-sm font-headline-sm text-on-surface line-clamp-2 group-hover:text-primary transition-colors flex-1">
                Sensor pH Meter Digital Akurasi Tinggi
              </h3>
              <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between">
                <div>
                  <span className="text-label-sm font-label-sm text-outline">Kalibrasi Otomatis</span>
                  <p className="text-price-lg font-price-lg text-primary">Rp 285.000</p>
                </div>
                <button aria-label="Tambah ke Keranjang" className="w-10 h-10 rounded-xl bg-primary hover:bg-secondary-fixed-dim text-on-primary hover:text-primary flex items-center justify-center transition-colors shadow-sm active:scale-95">
                  <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                </button>
              </div>
            </div>

            {/* Product Card 5 */}
            <div className="bg-surface-container-lowest border border-outline-variant hover:border-primary/50 rounded-2xl p-4 flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group">
              <div className="relative rounded-xl overflow-hidden aspect-square bg-[#F1F5F2] mb-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="Aquaponik Mini" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9Od40xEu0Px_AsfoIh0vmIjpI1HwC5fRmNc22FHWUbqOqjJIJDgTNsjDm42Cqvk-ONqXJgDRs1e7DBb0RhkPbrDEUKb4w6o8kVEEIjQFrTygVCdhm59We77av8WF7WKhi3_rgbtWSzkS70SZck4kcebn3tPmY2smvZylYLExjqNFBS7dL69XTPl_RvhSMN0Hr0HOrmocE6wNZ9M1pEDV6cdcidALr3c0oHkN2joJVT5FD60tY6BguiA"/>
                <span className="absolute top-2.5 left-2.5 bg-secondary-fixed-dim text-primary text-label-sm font-label-sm px-2.5 py-0.5 rounded-full font-bold shadow-sm">Unggulan</span>
                <button aria-label="Favorit" className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-surface-container-lowest/80 backdrop-blur-sm text-outline hover:text-error flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-[18px]">favorite</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-label-sm font-label-sm text-outline">Set Aquaponik</span>
                <span className="text-outline">•</span>
                <div className="flex items-center text-amber-500 text-label-sm font-label-sm font-semibold">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="ml-0.5 text-on-surface">4.9</span>
                  <span className="text-outline text-[11px] ml-1">(150 terjual)</span>
                </div>
              </div>
              <h3 className="text-headline-sm font-headline-sm text-on-surface line-clamp-2 group-hover:text-primary transition-colors flex-1">
                Set Aquaponik Mini (Rumahan Urban Farm)
              </h3>
              <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between">
                <div>
                  <span className="text-label-sm font-label-sm text-outline">Paket Siap Rakit</span>
                  <p className="text-price-lg font-price-lg text-primary">Rp 2.800.000</p>
                </div>
                <button aria-label="Tambah ke Keranjang" className="w-10 h-10 rounded-xl bg-primary hover:bg-secondary-fixed-dim text-on-primary hover:text-primary flex items-center justify-center transition-colors shadow-sm active:scale-95">
                  <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                </button>
              </div>
            </div>

            {/* Product Card 6 */}
            <div className="bg-surface-container-lowest border border-outline-variant hover:border-primary/50 rounded-2xl p-4 flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group">
              <div className="relative rounded-xl overflow-hidden aspect-square bg-[#F1F5F2] mb-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="Hidroponik Wick" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCt6Ug-NssABML1bUOYrv3Xo5P-04WNFoAlWmi0gVuQ1X-zbX-xMFM-Xc8Nc8gK7ZxCR3TOzS8soN41rR-6ZrbduXF1Pxr0s2Ak_Kl30_4p2ALt1ScAwdr4VRVkT1smt0pDPP6JU418abrToPFh6rPMK3P4Fh23yPnEuN4t92xRlBXDBa7283df49nst5A2qT-1tgHBSbh5nNJK-royIhlYOf-UCzLrIDeNrzMN56hxLojUIliQVGETYg"/>
                <span className="absolute top-2.5 left-2.5 bg-secondary-fixed-dim text-primary text-label-sm font-label-sm px-2.5 py-0.5 rounded-full font-bold shadow-sm">Unggulan</span>
                <button aria-label="Favorit" className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-surface-container-lowest/80 backdrop-blur-sm text-outline hover:text-error flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-[18px]">favorite</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-label-sm font-label-sm text-outline">Set Hidroponik</span>
                <span className="text-outline">•</span>
                <div className="flex items-center text-amber-500 text-label-sm font-label-sm font-semibold">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="ml-0.5 text-on-surface">4.7</span>
                  <span className="text-outline text-[11px] ml-1">(890 terjual)</span>
                </div>
              </div>
              <h3 className="text-headline-sm font-headline-sm text-on-surface line-clamp-2 group-hover:text-primary transition-colors flex-1">
                Set Hidroponik Wick System Pemula
              </h3>
              <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between">
                <div>
                  <span className="text-label-sm font-label-sm text-outline">Termasuk Nutrisi AB Mix</span>
                  <p className="text-price-lg font-price-lg text-primary">Rp 450.000</p>
                </div>
                <button aria-label="Tambah ke Keranjang" className="w-10 h-10 rounded-xl bg-primary hover:bg-secondary-fixed-dim text-on-primary hover:text-primary flex items-center justify-center transition-colors shadow-sm active:scale-95">
                  <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                </button>
              </div>
            </div>

            {/* Product Card 7 */}
            <div className="bg-surface-container-lowest border border-outline-variant hover:border-primary/50 rounded-2xl p-4 flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group">
              <div className="relative rounded-xl overflow-hidden aspect-square bg-[#F1F5F2] mb-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="NFT 6 Lubang" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdpswTzBTOExZC5Anl681nAZGTNx-vGBk75gz-cIxamUO-op5uDijMvyI8yho5nKEBF-uvphL8_PH2l_SgDN63tyZ4XxY8fj4KJbiRR6sixDluPwO9Nn2eilpj99Kd0YWC-HmPkxC9kRq9GDhmWnxlEFLoqFWal7dW3QdnabBdKmVpNEDlM7DA5VVVrCYITXtD9_ZhI2x1p665ouzBe7APH1NMjisE0y6is1XtY2HAvem6Cy4N0kxbMQ"/>
                <span className="absolute top-2.5 left-2.5 bg-error-container text-on-error-container text-label-sm font-label-sm px-2.5 py-0.5 rounded-full font-bold shadow-sm">-12%</span>
                <button aria-label="Favorit" className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-surface-container-lowest/80 backdrop-blur-sm text-outline hover:text-error flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-[18px]">favorite</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-label-sm font-label-sm text-outline">Set Hidroponik</span>
                <span className="text-outline">•</span>
                <div className="flex items-center text-amber-500 text-label-sm font-label-sm font-semibold">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="ml-0.5 text-on-surface">4.9</span>
                  <span className="text-outline text-[11px] ml-1">(520 terjual)</span>
                </div>
              </div>
              <h3 className="text-headline-sm font-headline-sm text-on-surface line-clamp-2 group-hover:text-primary transition-colors flex-1">
                Set Hidroponik NFT 6 Lubang Vertikal
              </h3>
              <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between">
                <div>
                  <span className="text-label-sm font-label-sm line-through text-outline">Rp 850.000</span>
                  <p className="text-price-lg font-price-lg text-primary">Rp 750.000</p>
                </div>
                <button aria-label="Tambah ke Keranjang" className="w-10 h-10 rounded-xl bg-primary hover:bg-secondary-fixed-dim text-on-primary hover:text-primary flex items-center justify-center transition-colors shadow-sm active:scale-95">
                  <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                </button>
              </div>
            </div>

            {/* Product Card 8 */}
            <div className="bg-surface-container-lowest border border-outline-variant hover:border-primary/50 rounded-2xl p-4 flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group">
              <div className="relative rounded-xl overflow-hidden aspect-square bg-[#F1F5F2] mb-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="Bioflok Lele" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBvNkSCJ_2xrnbcOPnu4YTxaQmEWPW1M8BuW8J3FPUL8JZDUJaABPM8fVdVQe--MfqZ5RJXcBHXtE-4WxIKgW4KdsSUOjliycfWd-piyAToRcPV029zaD05SWSnxgnIpimWmCJO-yzGiwJdf-9Tcvgb0g9-ps_6E1X2K65NFg-f0ioq14nLhapI2J2mFY59-Otnr20F4pjdFoZ-r17euWKiawoEP_m6DX8WMoyPh-BkxnXoa_dLAx9zDQ"/>
                <span className="absolute top-2.5 left-2.5 bg-error-container text-on-error-container text-label-sm font-label-sm px-2.5 py-0.5 rounded-full font-bold shadow-sm">-11%</span>
                <button aria-label="Favorit" className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-surface-container-lowest/80 backdrop-blur-sm text-outline hover:text-error flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-[18px]">favorite</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-label-sm font-label-sm text-outline">Set Tambak</span>
                <span className="text-outline">•</span>
                <div className="flex items-center text-amber-500 text-label-sm font-label-sm font-semibold">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="ml-0.5 text-on-surface">4.8</span>
                  <span className="text-outline text-[11px] ml-1">(1.1rb terjual)</span>
                </div>
              </div>
              <h3 className="text-headline-sm font-headline-sm text-on-surface line-clamp-2 group-hover:text-primary transition-colors flex-1">
                Set Tambak Bioflok Lele Starter D-2M
              </h3>
              <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between">
                <div>
                  <span className="text-label-sm font-label-sm line-through text-outline">Rp 1.850.000</span>
                  <p className="text-price-lg font-price-lg text-primary">Rp 1.650.000</p>
                </div>
                <button aria-label="Tambah ke Keranjang" className="w-10 h-10 rounded-xl bg-primary hover:bg-secondary-fixed-dim text-on-primary hover:text-primary flex items-center justify-center transition-colors shadow-sm active:scale-95">
                  <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-10 text-center">
            <Link className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-surface-container-lowest hover:bg-primary hover:text-on-primary text-primary border border-primary font-headline-sm text-headline-sm transition-all duration-200 shadow-sm active:scale-95" href="/products">
              <span>Buka Katalog Lengkap (120+ Produk)</span>
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION: FEATURED BUNDLE SPOTLIGHT */}
      <section className="py-14 md:py-16 max-w-7xl mx-auto px-margin">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 md:p-10 shadow-sm hover:shadow-md transition-shadow">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 relative rounded-2xl overflow-hidden aspect-[16/10] bg-surface-container-low group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Bundle" src="https://lh3.googleusercontent.com/aida-public/AB6AXuALUOkJyK8A9qpfneXdqxPQXxx6E9KwjIepiFXL9iQ6ojPu9RcqKK8hTeCClPBe9PUypc_r4aXbf_7-zr2Mjg4Mmgm3E8QrmMGubzrBrHgbt-ahakOSsOhV8H4ORYrWvTzriKurvcmNJ42VePL-L9J18c88ZYWCCbsapFGs7z4Z0iZQ-pq2UKlxzAh-aFeyt-zCk_KEqbNWAdOaZnk2wc-txXH3lYvLil7bg_NKODXf2VHWcwg3xDsNAw"/>
              <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent"></div>
              <div className="absolute top-4 left-4">
                <span className="bg-primary text-on-primary text-label-md font-label-md px-3 py-1 rounded-full font-bold shadow-md flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-secondary-fixed-dim">local_fire_department</span>
                  Set Bundle Terlaris
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 bg-surface-container-lowest/90 backdrop-blur-md p-3 rounded-xl border border-white/40 flex items-center justify-between">
                <div>
                  <p className="text-label-sm font-label-sm text-outline">Daya Berkecambah</p>
                  <p className="text-headline-sm font-headline-sm font-bold text-primary">≥ 95% Sertifikasi Resmi</p>
                </div>
                <div className="text-right">
                  <p className="text-label-sm font-label-sm text-outline">Masa Panen Cepat</p>
                  <p className="text-headline-sm font-headline-sm font-bold text-secondary">25 - 28 Hari</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-6 flex flex-col items-start space-y-4">
              <span className="text-label-md font-label-md text-secondary font-bold uppercase tracking-wider">Benih Tanaman Hortikultura</span>
              <h2 className="text-headline-lg font-headline-lg text-on-surface">
                Benih Pakcoy Premium (100 biji) &amp; Starter Nutrisi
              </h2>
              <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">
                Benih pakcoy F1 hibrida dengan daya adaptasi tinggi di dataran rendah maupun tinggi. Daun hijau tebal, renyah, tahan busuk hitam dan cepat panen dalam 25 hari.
              </p>
              <div className="space-y-2.5 py-2 w-full">
                <div className="flex items-center gap-2.5 text-body-md font-body-md text-on-surface">
                  <span className="w-5 h-5 rounded-full bg-tertiary-fixed/40 text-tertiary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </span>
                  <span>Ready stock siap kirim instan hari ini</span>
                </div>
                <div className="flex items-center gap-2.5 text-body-md font-body-md text-on-surface">
                  <span className="w-5 h-5 rounded-full bg-tertiary-fixed/40 text-tertiary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </span>
                  <span>Gratis ongkir untuk pembelian minimum 4 paket</span>
                </div>
                <div className="flex items-center gap-2.5 text-body-md font-body-md text-on-surface">
                  <span className="w-5 h-5 rounded-full bg-tertiary-fixed/40 text-tertiary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </span>
                  <span>Bonus PDF Panduan Budidaya Intensif via WhatsApp</span>
                </div>
              </div>
              <div className="pt-2 w-full">
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-price-lg font-price-lg text-primary text-[28px]">Rp 25.000</span>
                  <span className="text-body-sm font-body-sm text-outline">/ pack isi 100 butir</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-headline-sm px-7 py-3.5 rounded-full shadow-md transition-all active:scale-95">
                    <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                    <span>Beli Sekarang</span>
                  </button>
                  <button className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-surface-container hover:bg-surface-container-high text-primary font-headline-sm text-headline-sm px-6 py-3.5 rounded-full border border-outline-variant transition-colors">
                    <span>Lihat Detail</span>
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: CALL TO ACTION BANNER */}
      <section className="py-8 max-w-7xl mx-auto px-margin" id="konsultasi">
        <div className="relative bg-primary text-on-primary rounded-3xl p-8 md:p-14 text-center overflow-hidden shadow-xl">
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-secondary-fixed-dim/20 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-tertiary-fixed/20 blur-3xl pointer-events-none"></div>
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-secondary-fixed-dim text-label-md font-label-md backdrop-blur-sm">
              <span className="material-symbols-outlined text-[16px]">psychology</span>
              <span>Pendampingan Agronomi &amp; Desain Sistem</span>
            </div>
            <h2 className="text-headline-lg font-headline-lg md:text-[36px] md:leading-[44px] text-on-primary font-bold">
              Butuh Konsultasi untuk Proyek Pertanian Anda?
            </h2>
            <p className="text-body-lg font-body-lg text-primary-fixed leading-relaxed">
              Tim ahli JagoFarm siap membantu merancang sistem pertanian modern yang sesuai dengan kebutuhan, luas lahan, dan budget Anda.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link className="inline-flex items-center justify-center gap-2 bg-secondary-fixed-dim hover:bg-secondary text-primary font-headline-sm text-headline-sm px-7 py-3.5 rounded-full font-bold shadow-md transition-all active:scale-95" href="/products">
                <span>Mulai Belanja</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
              <a className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-on-primary border border-white/30 backdrop-blur-md font-headline-sm text-headline-sm px-6 py-3.5 rounded-full transition-all active:scale-95 font-semibold" href="https://wa.me/6281234567890" rel="noopener noreferrer" target="_blank">
                <span className="material-symbols-outlined text-[20px] text-tertiary-fixed">chat</span>
                <span>Chat via WhatsApp</span>
              </a>
            </div>
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-label-md font-label-md text-primary-fixed-dim">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-secondary-fixed-dim">schedule</span>
                Respon Cepat &lt; 15 Menit
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-secondary-fixed-dim">verified</span>
                Gratis Sketsa Rancangan Awal
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}