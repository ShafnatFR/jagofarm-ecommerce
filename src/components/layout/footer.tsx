import Link from "next/link";
import { Icon } from "@/components/ui/icon";

const footerLinks = {
  produk: [
    { label: "Set Tambak", href: "/products?category=set-tambak" },
    { label: "Set Hidroponik", href: "/products?category=set-hidroponik" },
    { label: "Set Aquaponik", href: "/products?category=set-aquaponik" },
    { label: "IoT & Smart Farming", href: "/products?category=iot-smart-farming" },
    { label: "Benih Unggulan", href: "/products?category=benih" },
    { label: "Anakan Ikan", href: "/products?category=anakan-ikan" },
  ],
  informasi: [
    { label: "Tentang Kami", href: "/about" },
    { label: "Cara Pemesanan", href: "/how-to-order" },
    { label: "FAQ", href: "/faq" },
    { label: "Hubungi Kami", href: "/contact" },
    { label: "Kebijakan Pengiriman", href: "/shipping-policy" },
    { label: "Kebijakan Pengembalian", href: "/return-policy" },
    { label: "Kebijakan Privasi", href: "/privacy-policy" },
    { label: "Syarat dan Ketentuan", href: "/terms" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-primary border-t border-emerald-800 text-white w-full">
      <div className="w-full px-4 py-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-12 border-b border-emerald-700/80">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-800 text-emerald-200 flex items-center justify-center shadow-sm">
                <Icon name="water_drop" size={22} filled className="text-emerald-200" />
              </div>
              <span className="text-xl font-bold text-white">JagoFarm</span>
            </Link>
            <p className="text-sm text-emerald-200/70 max-w-sm leading-relaxed">
              Solusi pertanian modern Indonesia. Menyediakan peralatan akuaponik, hidroponik, tambak bioflok, dan IoT smart farming berkualitas tinggi demi ketahanan pangan nasional.
            </p>
            <div className="flex items-center gap-3 pt-2">
              {[
                { icon: "share", label: "Share" },
                { icon: "language", label: "Website" },
                { icon: "mail", label: "Email" },
              ].map((s) => (
                <a key={s.label} aria-label={s.label} href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-emerald-700 hover:text-emerald-200 text-white flex items-center justify-center transition-colors">
                  <Icon name={s.icon} size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Produk */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Produk</h4>
            <ul className="space-y-2.5">
              {footerLinks.produk.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-emerald-200/70 hover:text-white transition-colors duration-150">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Informasi */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Informasi</h4>
            <ul className="space-y-2.5">
              {footerLinks.informasi.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-emerald-200/70 hover:text-white transition-colors duration-150">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Kontak</h4>
            <ul className="space-y-3 text-sm text-emerald-200/70">
              <li className="flex items-start gap-2.5">
                <Icon name="location_on" size={18} className="text-emerald-300 shrink-0 mt-0.5" />
                <span>Jl. Pertanian No. 123, Surabaya, Jawa Timur, Indonesia</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Icon name="call" size={18} className="text-emerald-300 shrink-0" />
                <a href="tel:+6281234567890" className="hover:text-white transition-colors">+62 812-3456-7890</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Icon name="mail" size={18} className="text-emerald-300 shrink-0" />
                <a href="mailto:hello@jagofarm.id" className="hover:text-white transition-colors">hello@jagofarm.id</a>
              </li>
              <li className="pt-2">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-[11px] text-emerald-200/60">Jam Operasional Layanan:</p>
                  <p className="text-sm font-semibold text-white">Senin - Sabtu: 08:00 - 17:00 WIB</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-sm text-emerald-200/50 gap-4">
          <p className="text-center sm:text-left">&copy; {new Date().getFullYear()} JagoFarm. All rights reserved.</p>
          <div className="flex items-center gap-3 text-[11px] opacity-70">
            <span>Metode Pembayaran:</span>
            <span className="font-bold tracking-wider">QRIS</span>
            <span>&bull;</span>
            <span className="font-bold tracking-wider">BCA VA</span>
            <span>&bull;</span>
            <span className="font-bold tracking-wider">MANDIRI</span>
            <span>&bull;</span>
            <span className="font-bold tracking-wider">BRI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}