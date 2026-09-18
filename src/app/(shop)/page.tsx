import Link from "next/link";
import {
  ArrowRight,
  Droplets,
  Sprout,
  Fish,
  Cpu,
  Leaf,
  Egg,
  Truck,
  Shield,
  Headphones,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/product/product-grid";

const categories = [
  {
    name: "Set Tambak",
    slug: "set-tambak",
    icon: Droplets,
    description: "Paket lengkap kolam tambak",
    image: "/categories/tambak.jpg",
  },
  {
    name: "Set Hidroponik",
    slug: "set-hidroponik",
    icon: Sprout,
    description: "Sistem hidroponik siap pakai",
    image: "/categories/hidroponik.jpg",
  },
  {
    name: "Set Aquaponik",
    slug: "set-aquaponik",
    icon: Fish,
    description: "Gabungan akuakultur & hidroponik",
    image: "/categories/aquaponik.jpg",
  },
  {
    name: "IoT & Smart Farming",
    slug: "iot-smart-farming",
    icon: Cpu,
    description: "Sensor & otomasi pertanian",
    image: "/categories/iot.jpg",
  },
  {
    name: "Benih",
    slug: "benih",
    icon: Leaf,
    description: "Benih tanaman & sayuran",
    image: "/categories/benih.jpg",
  },
  {
    name: "Anakan Ikan",
    slug: "anakan-ikan",
    icon: Egg,
    description: "Benih ikan air tawar & laut",
    image: "/categories/anakan-ikan.jpg",
  },
];

const featuredProducts = [
  {
    id: "1",
    name: "Set Hidroponik NFT 6 Lubang — Starter Kit",
    slug: "set-hidroponik-nft-6-lubang",
    price: 850000,
    discountPrice: 699000,
    image: "/products/hidroponik-nft-6.jpg",
    rating: 4.8,
    reviewCount: 124,
    category: "Set Hidroponik",
    isFeatured: true,
  },
  {
    id: "2",
    name: "IoT pH & Suhu Sensor untuk Tambak",
    slug: "iot-ph-suhu-sensor-tambak",
    price: 1250000,
    image: "/products/iot-sensor.jpg",
    rating: 4.9,
    reviewCount: 67,
    category: "IoT & Smart Farming",
    isFeatured: true,
  },
  {
    id: "3",
    name: "Set Aquaponik Compact 120x80cm",
    slug: "set-aquaponik-compact-120x80",
    price: 2500000,
    discountPrice: 2100000,
    image: "/products/aquaponik-compact.jpg",
    rating: 4.7,
    reviewCount: 89,
    category: "Set Aquaponik",
    isFeatured: true,
  },
  {
    id: "4",
    name: "Benih Lele Sangkuriang Super — 1000 ekor",
    slug: "benih-lele-sangkuriang-1000",
    price: 150000,
    image: "/products/benih-lele.jpg",
    rating: 4.6,
    reviewCount: 203,
    category: "Benih",
    isFeatured: true,
  },
  {
    id: "5",
    name: "Set Tambak Terpal 3x3m Lengkap",
    slug: "set-tambak-terpal-3x3",
    price: 1800000,
    discountPrice: 1550000,
    image: "/products/tambak-terpal.jpg",
    rating: 4.5,
    reviewCount: 56,
    category: "Set Tambak",
    isFeatured: true,
  },
  {
    id: "6",
    name: "Anakan Nila Gift Super — 500 ekor",
    slug: "anakan-nila-gift-500",
    price: 175000,
    image: "/products/anakan-nila.jpg",
    rating: 4.8,
    reviewCount: 142,
    category: "Anakan Ikan",
    isFeatured: true,
  },
  {
    id: "7",
    name: "Smart Water Pump IoT — Solar Panel",
    slug: "smart-water-pump-iot-solar",
    price: 3200000,
    discountPrice: 2850000,
    image: "/products/smart-pump.jpg",
    rating: 4.9,
    reviewCount: 31,
    category: "IoT & Smart Farming",
    isFeatured: true,
  },
  {
    id: "8",
    name: "Nutrisi AB Mix Hidroponik — 1 Liter",
    slug: "nutrisi-ab-mix-1l",
    price: 45000,
    image: "/products/ab-mix.jpg",
    rating: 4.7,
    reviewCount: 318,
    category: "Set Hidroponik",
    isFeatured: true,
  },
];

const features = [
  { icon: Truck, title: "Pengiriman Cepat", desc: "Kirim ke seluruh Indonesia" },
  { icon: Shield, title: "Garansi Produk", desc: "Jaminan kualitas 100%" },
  { icon: Headphones, title: "Konsultasi Gratis", desc: "Tim ahli siap membantu" },
  { icon: CreditCard, title: "Pembayaran Aman", desc: "Midtrans & transfer bank" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div className="text-primary-foreground">
              <span className="inline-block rounded-full bg-accent/20 px-4 py-1.5 text-sm font-medium text-accent">
                🌱 Pertanian Modern Indonesia
              </span>
              <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Mulai Bertani
                <br />
                dengan{" "}
                <span className="text-accent">Teknologi</span>
              </h1>
              <p className="mt-4 max-w-lg text-lg text-primary-foreground/80 leading-relaxed">
                JagoFarm menyediakan set lengkap tambak, hidroponik, aquaponik,
                dan IoT smart farming untuk pertanian modern yang produktif dan
                efisien.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/products">
                  <Button size="lg" variant="accent">
                    Belanja Sekarang
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/products?category=iot-smart-farming">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    Jelajahi IoT Farming
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative h-96 rounded-2xl bg-primary-foreground/10 flex items-center justify-center">
                <div className="text-center text-primary-foreground/30">
                  <Sprout className="mx-auto h-24 w-24" />
                  <p className="mt-2 text-sm">Hero Image</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features bar */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Kategori Produk</h2>
            <p className="mt-1 text-muted-foreground">
              Temukan kebutuhan pertanian modern Anda
            </p>
          </div>
          <Link
            href="/products"
            className="hidden text-sm font-medium text-primary hover:underline sm:flex items-center gap-1"
          >
            Lihat Semua <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className="group flex flex-col items-center rounded-xl border border-border bg-card p-5 text-center transition-all hover:border-primary hover:shadow-md"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary transition-colors group-hover:bg-primary/10">
                <cat.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mt-3 text-sm font-semibold">{cat.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {cat.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-secondary/50">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Produk Unggulan
              </h2>
              <p className="mt-1 text-muted-foreground">
                Pilihan terbaik petani modern Indonesia
              </p>
            </div>
            <Link
              href="/products"
              className="hidden text-sm font-medium text-primary hover:underline sm:flex items-center gap-1"
            >
              Lihat Semua <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6">
            <ProductGrid products={featuredProducts} />
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link href="/products">
              <Button variant="secondary">
                Lihat Semua Produk
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="rounded-2xl bg-primary p-8 text-center text-primary-foreground sm:p-12">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Butuh Konsultasi untuk Proyek Pertanian Anda?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
            Tim ahli JagoFarm siap membantu merancang sistem pertanian modern
            yang sesuai dengan kebutuhan dan budget Anda.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/products">
              <Button size="lg" variant="accent">
                Mulai Belanja
              </Button>
            </Link>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                variant="secondary"
                className="border-white/30 text-white hover:bg-white/10"
              >
                Chat via WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
