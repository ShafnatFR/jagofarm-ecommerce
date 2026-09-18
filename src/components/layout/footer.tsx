import Link from "next/link";
import { Leaf, Mail, Phone, MapPin, Globe, Share2 } from "lucide-react";

const footerLinks = {
  produk: [
    { label: "Set Tambak", href: "/products?category=set-tambak" },
    { label: "Set Hidroponik", href: "/products?category=set-hidroponik" },
    { label: "Set Aquaponik", href: "/products?category=set-aquaponik" },
    { label: "IoT & Smart Farming", href: "/products?category=iot-smart-farming" },
    { label: "Benih", href: "/products?category=benih" },
    { label: "Anakan Ikan", href: "/products?category=anakan-ikan" },
  ],
  informasi: [
    { label: "Tentang Kami", href: "/about" },
    { label: "Cara Pemesanan", href: "/how-to-order" },
    { label: "Kebijakan Pengiriman", href: "/shipping-policy" },
    { label: "Kebijakan Pengembalian", href: "/return-policy" },
    { label: "FAQ", href: "/faq" },
  ],
  akun: [
    { label: "Masuk", href: "/login" },
    { label: "Daftar", href: "/register" },
    { label: "Pesanan Saya", href: "/orders" },
    { label: "Keranjang", href: "/cart" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2">
              <Leaf className="h-6 w-6" />
              <span className="text-lg font-bold">JagoFarm</span>
            </Link>
            <p className="mt-3 text-sm text-primary-foreground/70 leading-relaxed">
              Solusi pertanian modern Indonesia. Menyediakan peralatan
              akuaponik, hidroponik, tambak, dan IoT smart farming
              berkualitas tinggi.
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-white/10 p-2 transition-colors hover:bg-white/20"
              >
                <Share2 className="h-4 w-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-white/10 p-2 transition-colors hover:bg-white/20"
              >
                <Globe className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Produk */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Produk
            </h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.produk.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Informasi */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Informasi
            </h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.informasi.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Kontak
            </h3>
            <ul className="mt-3 space-y-3">
              <li className="flex items-start gap-2 text-sm text-primary-foreground/70">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Jl. Pertanian No. 123, Surabaya, Jawa Timur</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Phone className="h-4 w-4 shrink-0" />
                <span>+62 812-3456-7890</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Mail className="h-4 w-4 shrink-0" />
                <span>hello@jagofarm.id</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-primary-foreground/50">
          © {new Date().getFullYear()} JagoFarm. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
