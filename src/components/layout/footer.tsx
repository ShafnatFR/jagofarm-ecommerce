import Link from "next/link";

export function Footer() {
  return (
    <>
      <footer className="bg-primary dark:bg-surface-container-lowest border-t border-primary-container dark:border-outline-variant text-on-primary-container dark:text-on-surface-variant w-full">
        <div className="w-full px-margin py-space-xl max-w-7xl mx-auto">
          {/* Top Grid: Brand & Link Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-12 border-b border-primary-container/80">
            {/* Brand Bio (2 Cols on lg) */}
            <div className="lg:col-span-2 space-y-4">
              <Link className="flex items-center gap-2.5" href="/">
                <div className="w-9 h-9 rounded-xl bg-secondary-fixed-dim text-primary flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span>
                </div>
                <span className="text-headline-md font-headline-md font-bold text-on-primary dark:text-primary">JagoFarm</span>
              </Link>
              <p className="text-body-sm font-body-sm text-primary-fixed-dim max-w-sm leading-relaxed">
                Solusi pertanian modern Indonesia. Menyediakan peralatan akuaponik, hidroponik, tambak bioflok, dan IoT smart farming berkualitas tinggi demi ketahanan pangan nasional.
              </p>
              {/* Social Links */}
              <div className="flex items-center gap-3 pt-2">
                <a aria-label="Share" className="w-9 h-9 rounded-full bg-white/10 hover:bg-secondary-fixed-dim hover:text-primary text-on-primary flex items-center justify-center transition-colors" href="#">
                  <span className="material-symbols-outlined text-[18px]">share</span>
                </a>
                <a aria-label="Website" className="w-9 h-9 rounded-full bg-white/10 hover:bg-secondary-fixed-dim hover:text-primary text-on-primary flex items-center justify-center transition-colors" href="#">
                  <span className="material-symbols-outlined text-[18px]">language</span>
                </a>
                <a aria-label="Email" className="w-9 h-9 rounded-full bg-white/10 hover:bg-secondary-fixed-dim hover:text-primary text-on-primary flex items-center justify-center transition-colors" href="mailto:hello@jagofarm.id">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </a>
              </div>
            </div>
            {/* Col 1: PRODUK */}
            <div>
              <h4 className="text-headline-sm font-headline-sm text-on-primary font-bold mb-4">PRODUK</h4>
              <ul className="space-y-2.5 text-label-md font-label-md">
                <li><Link className="text-on-primary-container dark:text-on-surface-variant hover:text-on-primary dark:hover:text-primary transition-colors duration-150" href="/products?category=set-tambak">Set Tambak</Link></li>
                <li><Link className="text-on-primary-container dark:text-on-surface-variant hover:text-on-primary dark:hover:text-primary transition-colors duration-150" href="/products?category=set-hidroponik">Set Hidroponik</Link></li>
                <li><Link className="text-on-primary-container dark:text-on-surface-variant hover:text-on-primary dark:hover:text-primary transition-colors duration-150" href="/products?category=set-aquaponik">Set Aquaponik</Link></li>
                <li><Link className="text-on-primary-container dark:text-on-surface-variant hover:text-on-primary dark:hover:text-primary transition-colors duration-150" href="/products?category=iot-smart-farming">IoT &amp; Smart Farming</Link></li>
                <li><Link className="text-on-primary-container dark:text-on-surface-variant hover:text-on-primary dark:hover:text-primary transition-colors duration-150" href="/products?category=benih">Benih Unggulan</Link></li>
                <li><Link className="text-on-primary-container dark:text-on-surface-variant hover:text-on-primary dark:hover:text-primary transition-colors duration-150" href="/products?category=anakan-ikan">Anakan Ikan</Link></li>
              </ul>
            </div>
            {/* Col 2: INFORMASI & KEBIJAKAN */}
            <div>
              <h4 className="text-headline-sm font-headline-sm text-on-primary font-bold mb-4">INFORMASI</h4>
              <ul className="space-y-2.5 text-label-md font-label-md">
                <li><Link className="text-on-primary-container dark:text-on-surface-variant hover:text-on-primary dark:hover:text-primary transition-colors duration-150" href="/about">Tentang Kami</Link></li>
                <li><Link className="text-on-primary-container dark:text-on-surface-variant hover:text-on-primary dark:hover:text-primary transition-colors duration-150" href="/how-to-order">Cara Pemesanan</Link></li>
                <li><Link className="text-on-primary-container dark:text-on-surface-variant hover:text-on-primary dark:hover:text-primary transition-colors duration-150" href="/faq">FAQ</Link></li>
                <li><Link className="text-on-primary-container dark:text-on-surface-variant hover:text-on-primary dark:hover:text-primary transition-colors duration-150" href="/contact">Hubungi Kami</Link></li>
                <li><Link className="text-on-primary-container dark:text-on-surface-variant hover:text-on-primary dark:hover:text-primary transition-colors duration-150" href="/shipping-policy">Kebijakan Pengiriman</Link></li>
                <li><Link className="text-on-primary-container dark:text-on-surface-variant hover:text-on-primary dark:hover:text-primary transition-colors duration-150" href="/return-policy">Kebijakan Pengembalian</Link></li>
                <li><Link className="text-on-primary-container dark:text-on-surface-variant hover:text-on-primary dark:hover:text-primary transition-colors duration-150" href="/privacy-policy">Kebijakan Privasi</Link></li>
                <li><Link className="text-on-primary-container dark:text-on-surface-variant hover:text-on-primary dark:hover:text-primary transition-colors duration-150" href="/terms">Syarat dan Ketentuan</Link></li>
              </ul>
            </div>
            {/* Col 3: KONTAK KANTOR */}
            <div>
              <h4 className="text-headline-sm font-headline-sm text-on-primary font-bold mb-4">KONTAK</h4>
              <ul className="space-y-3 text-body-sm font-body-sm text-primary-fixed-dim">
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-secondary-fixed-dim shrink-0 mt-0.5">location_on</span>
                  <span>Jl. Pertanian No. 123, Surabaya, Jawa Timur, Indonesia</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-secondary-fixed-dim shrink-0">call</span>
                  <a className="hover:text-on-primary transition-colors" href="tel:+6281234567890">+62 812-3456-7890</a>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-secondary-fixed-dim shrink-0">mail</span>
                  <a className="hover:text-on-primary transition-colors" href="mailto:hello@jagofarm.id">hello@jagofarm.id</a>
                </li>
                <li className="pt-2">
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-[11px] text-primary-fixed-dim">Jam Operasional Layanan:</p>
                    <p className="text-label-md font-label-md text-on-primary font-semibold">Senin - Sabtu: 08:00 - 17:00 WIB</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          {/* Bottom Copyright Row */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-body-sm font-body-sm text-primary-fixed-dim gap-4">
            <p className="text-center sm:text-left">
              © 2026 JagoFarm. All rights reserved.
            </p>
            {/* Payment Partners Badges */}
            <div className="flex items-center gap-3 text-[11px] opacity-70">
              <span>Metode Pembayaran:</span>
              <span className="font-bold tracking-wider">QRIS</span>
              <span>•</span>
              <span className="font-bold tracking-wider">BCA VA</span>
              <span>•</span>
              <span className="font-bold tracking-wider">MANDIRI</span>
              <span>•</span>
              <span className="font-bold tracking-wider">BRI</span>
            </div>
          </div>
        </div>
      </footer>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant px-4 py-2 flex items-center justify-around z-40 shadow-lg">
        <Link className="flex flex-col items-center gap-0.5 text-primary" href="/">
          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="text-label-sm font-label-sm font-bold">Home</span>
        </Link>
        <Link className="flex flex-col items-center gap-0.5 text-on-surface-variant hover:text-primary" href="/products">
          <span className="material-symbols-outlined text-[22px]">category</span>
          <span className="text-label-sm font-label-sm">Kategori</span>
        </Link>
        <Link className="flex flex-col items-center gap-0.5 text-on-surface-variant hover:text-primary" href="/products?category=set-tambak">
          <span className="material-symbols-outlined text-[22px]">water</span>
          <span className="text-label-sm font-label-sm">Tambak</span>
        </Link>
        <Link className="flex flex-col items-center gap-0.5 text-on-surface-variant hover:text-primary relative" href="/cart">
          <span className="material-symbols-outlined text-[22px]">shopping_cart</span>
          <span className="absolute -top-1 right-2 bg-error text-on-error text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">3</span>
          <span className="text-label-sm font-label-sm">Toko</span>
        </Link>
        <Link className="flex flex-col items-center gap-0.5 text-on-surface-variant hover:text-primary" href="/account">
          <span className="material-symbols-outlined text-[22px]">account_circle</span>
          <span className="text-label-sm font-label-sm">Akun</span>
        </Link>
      </div>
    </>
  );
}