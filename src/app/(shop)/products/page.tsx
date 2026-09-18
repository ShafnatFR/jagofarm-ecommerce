import { Suspense } from "react";
import { Metadata } from "next";
import { ProductFilters } from "@/components/product/product-filters";
import { ProductGrid } from "@/components/product/product-grid";
import { Button } from "@/components/ui/button";
import { Grid3X3, List } from "lucide-react";

export const metadata: Metadata = {
  title: "Semua Produk",
  description: "Jelajahi koleksi lengkap produk pertanian modern JagoFarm",
};

const allProducts = [
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
  },
];

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    price?: string;
    page?: string;
    view?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const category = params.category || "";
  const sort = params.sort || "newest";
  const view = params.view || "grid";

  // Filter products
  let filtered = allProducts;
  if (category) {
    const categoryMap: Record<string, string> = {
      "set-tambak": "Set Tambak",
      "set-hidroponik": "Set Hidroponik",
      "set-aquaponik": "Set Aquaponik",
      "iot-smart-farming": "IoT & Smart Farming",
      benih: "Benih",
      "anakan-ikan": "Anakan Ikan",
    };
    const catName = categoryMap[category];
    if (catName) {
      filtered = filtered.filter((p) => p.category === catName);
    }
  }

  // Sort
  if (sort === "price-asc") {
    filtered = [...filtered].sort(
      (a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price)
    );
  } else if (sort === "price-desc") {
    filtered = [...filtered].sort(
      (a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price)
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Semua Produk</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} produk ditemukan
          </p>
        </div>
        <div className="hidden items-center gap-1 sm:flex">
          <Button variant={view === "grid" ? "primary" : "ghost"} size="icon" className="h-8 w-8">
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button variant={view === "list" ? "primary" : "ghost"} size="icon" className="h-8 w-8">
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6 flex gap-6">
        <Suspense>
          <ProductFilters className="w-64 shrink-0" />
        </Suspense>

        <div className="flex-1">
          <ProductGrid
            products={filtered}
            emptyMessage="Tidak ada produk ditemukan untuk filter ini."
          />

          {/* Pagination placeholder */}
          {filtered.length > 0 && (
            <div className="mt-8 flex justify-center gap-2">
              <Button variant="secondary" size="sm" disabled>
                Sebelumnya
              </Button>
              <Button variant="primary" size="sm">
                1
              </Button>
              <Button variant="secondary" size="sm" disabled>
                Selanjutnya
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
