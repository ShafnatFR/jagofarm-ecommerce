import Link from "next/link";
import type { Metadata } from "next";
import { HeroProductCarousel } from "@/components/home/hero-product-carousel";
import { FeaturedProducts, type FeaturedProductItem } from "@/components/home/featured-products";
import { SITE_CONFIG } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { getHomeHero, getSiteContent } from "@/lib/site-settings";
import { getHomeCatalog } from "@/lib/home-data";

// Metadata beranda (judul & deskripsi spesifik untuk SEO + social share).
export const metadata: Metadata = {
  // absolute: hindari template layout menempelkan "| JagoFarm" dua kali.
  title: {
    absolute: "JagoFarm — Solusi Akuaponik & Hidroponik Modern",
  },
  description:
    "Belanja pupuk, bibit, alat pertanian, dan kebutuhan akuaponik/hidroponik dengan harga terjangkau. Pengiriman cepat ke seluruh Indonesia.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "JagoFarm — Solusi Akuaponik & Hidroponik Modern",
    description:
      "Marketplace pertanian terlengkap: pupuk, bibit, alat tani, dan kebutuhan akuaponik/hidroponik.",
    url: "/",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

const CATEGORY_ICONS: Record<string, { icon: string; desc: string; badge?: string }> = {
  "set-tambak": { icon: "water", desc: "Paket kolam terpal bulat & bioflok air tawar" },
  "set-hidroponik": { icon: "potted_plant", desc: "Kit NFT, DWC & Wick pipa talang lengkap" },
  "set-aquaponik": { icon: "set_meal", desc: "Sistem simbiosis terpadu ikan & tanaman" },
  "iot-smart-farming": { icon: "developer_board", desc: "Sensor, monitoring & kontroler otomatis", badge: "POPULER" },
  "benih": { icon: "spa", desc: "Bibit sayuran, buah hibrida, & media tanam" },
  "anakan-ikan": { icon: "waves", desc: "Benih lele sangkuriang, nila merah, & gurame" },
};

export default async function HomePage() {
  // Katalog dari cache 5 menit (lihat lib/home-data); hero & teks konten dibaca segar dari DB.
  const [{ categories, featuredProducts, heroProducts, productCount, categoryCount }, hero, content] =
    await Promise.all([getHomeCatalog(), getHomeHero(), getSiteContent()]);

  // Data untuk grid "Produk Unggulan" (chip filter butuh client state), jadi
  // Decimal & relasi diserialisasi plus rata-rata rating dari review approved.
  const featuredProductItems: FeaturedProductItem[] = featuredProducts.map((p) => {
    const ratings = p.reviews ?? [];
    const average =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : undefined;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      basePrice: Number(p.basePrice),
      discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
      image: p.images?.[0]?.url || "/placeholder-product.png",
      categoryName: p.category.name,
      categorySlug: p.category.slug,
      isFeatured: p.isFeatured,
      weightGram: p.weightGram ?? null,
      rating: average,
      reviewCount: p._count.reviews,
    };
  });
  return (
    <div className="w-full">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden text-white py-12 md:py-16 lg:py-20 bg-gradient-to-br from-[#0c2e20] via-[#082217] to-[#04120d] border-b border-outline-variant/40">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/20 opacity-40 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 right-1/4 w-[500px] h-[500px] rounded-full bg-lime/10 opacity-30 blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 right-10 w-80 h-80 rounded-full bg-leaf/10 blur-3xl pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-margin relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Hero Text Cluster */}
            <div className="lg:col-span-7 flex flex-col items-start space-y-6">
              {/* Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-lime/30 text-lime text-label-md font-label-md">
                <span className="material-symbols-outlined text-[16px] text-lime" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span>{hero.eyebrow}</span>
              </div>
              {/* Main Headline */}
              <div className="space-y-1">
                <h1 className="text-display-hero-mobile md:text-display-hero font-serif font-semibold tracking-tight text-white leading-[1.05]">
                  {hero.headline}{" "}
                  <span className="text-lime italic underline decoration-lime/30 decoration-4 underline-offset-8">{hero.headlineHighlight}</span>
                </h1>
              </div>
              {/* Subtitle */}
              <p className="text-body-lg font-body-lg text-[#dfe7d7]/90 max-w-xl leading-relaxed">
                {hero.subtitle}
              </p>
              {/* CTA Actions */}
              <div className="flex flex-wrap items-center gap-4 pt-2 w-full sm:w-auto">
                <Link className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#f4f0e6] hover:bg-lime text-[#092f21] font-semibold text-headline-sm px-7 py-3.5 rounded-full shadow-lg transition-all duration-200 active:scale-95" href={hero.primaryCtaHref}>
                  <span>{hero.primaryCtaLabel}</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </Link>
                <Link className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-md font-semibold text-headline-sm px-6 py-3.5 rounded-full transition-all duration-200 active:scale-95" href={hero.secondaryCtaHref}>
                  <span className="material-symbols-outlined text-[20px]">headset_mic</span>
                  <span>{hero.secondaryCtaLabel}</span>
                </Link>
              </div>
              {/* Trust Metrics Bar */}
              <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-6 w-full max-w-lg">
                <div>
                  <p className="text-headline-md font-serif font-bold text-lime">{productCount}+</p>
                  <p className="text-body-sm font-body-sm text-[#a6b8ad]">Produk Siap Kirim</p>
                </div>
                <div>
                  <p className="text-headline-md font-serif font-bold text-lime">{categoryCount}</p>
                  <p className="text-body-sm font-body-sm text-[#a6b8ad]">Kategori Budidaya</p>
                </div>
                <div>
                  <p className="text-headline-md font-serif font-bold text-white">{SITE_CONFIG.hoursShort}</p>
                  <p className="text-body-sm font-body-sm text-[#a6b8ad]">Jam Layanan</p>
                </div>
              </div>
            </div>
            {/* Right Hero — Product Carousel */}
            <div className="lg:col-span-5 relative">
              <HeroProductCarousel
                products={heroProducts.map((p) => ({
                  id: p.id,
                  name: p.name,
                  slug: p.slug,
                  basePrice: Number(p.base_price),
                  discountPrice: p.discount_price ? Number(p.discount_price) : null,
                  imageUrl: p.image_url || "/placeholder-product.png",
                  categoryName: p.category_name || "Produk",
                }))}
                intervalMs={4000}
              />
            </div>
          </div>
        </div>
      </section>

      {/* TRUST & VALUE HIGHLIGHTS STRIP */}
      <section className="border-b border-outline-variant/60 bg-surface-container-low/40">
        <div className="max-w-7xl mx-auto px-margin py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="flex items-center gap-3.5 p-2">
              <div className="w-12 h-12 rounded-xl bg-sage/30 dark:bg-sage/40 text-forest dark:text-lime flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]">local_shipping</span>
              </div>
              <div>
                <h2 className="text-headline-sm font-headline-sm text-on-surface font-semibold">{content.trustShippingTitle}</h2>
                <p className="text-body-sm font-body-sm text-on-surface-variant">{content.trustShippingDesc}</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5 p-2">
              <div className="w-12 h-12 rounded-xl bg-sage/30 dark:bg-sage/40 text-forest dark:text-lime flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              </div>
              <div>
                <h2 className="text-headline-sm font-headline-sm text-on-surface font-semibold">{content.trustGuaranteeTitle}</h2>
                <p className="text-body-sm font-body-sm text-on-surface-variant">{content.trustGuaranteeDesc}</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5 p-2">
              <div className="w-12 h-12 rounded-xl bg-sage/30 dark:bg-sage/40 text-forest dark:text-lime flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]">support_agent</span>
              </div>
              <div>
                <h2 className="text-headline-sm font-headline-sm text-on-surface font-semibold">{content.trustConsultTitle}</h2>
                <p className="text-body-sm font-body-sm text-on-surface-variant">{content.trustConsultDesc}</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5 p-2">
              <div className="w-12 h-12 rounded-xl bg-sage/30 dark:bg-sage/40 text-forest dark:text-lime flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]">credit_card</span>
              </div>
              <div>
                <h2 className="text-headline-sm font-headline-sm text-on-surface font-semibold">{content.trustPaymentTitle}</h2>
                <p className="text-body-sm font-body-sm text-on-surface-variant">{content.trustPaymentDesc}</p>
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
            <h2 className="text-headline-lg font-serif font-semibold text-on-surface mt-1">Kategori Produk</h2>
            <p className="text-body-md font-body-md text-on-surface-variant mt-1">Temukan kebutuhan pertanian dan budi daya modern Anda</p>
          </div>
          <Link className="inline-flex items-center gap-1.5 text-primary hover:text-secondary font-headline-sm text-headline-sm group transition-colors" href="/products">
            <span>Lihat Semua Kategori</span>
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const meta = CATEGORY_ICONS[cat.slug] || { icon: "category", desc: "Produk berkualitas tinggi" };
            return (
              <Link key={cat.id} className="group bg-surface border border-outline-variant hover:border-primary/50 hover:bg-surface-container-low/60 rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative overflow-hidden" href={`/products?category=${cat.slug}`}>
                {meta.badge && <span className="absolute top-2 right-2 text-[9px] bg-lime text-forest-deep font-bold px-2 py-0.5 rounded-full">{meta.badge}</span>}
                <div className="w-14 h-14 rounded-2xl bg-surface-container-low group-hover:bg-primary group-hover:text-on-primary flex items-center justify-center text-primary transition-all duration-300 mb-3.5">
                  <span className="material-symbols-outlined text-[28px]">{meta.icon}</span>
                </div>
                <h3 className="text-headline-sm font-headline-sm text-on-surface group-hover:text-primary transition-colors">{cat.name}</h3>
                <p className="text-body-sm font-body-sm text-on-surface-variant mt-1 line-clamp-2">{meta.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* SECTION: PRODUK UNGGULAN (PRODUCT GRID) */}
      <section className="py-14 bg-surface-container-low/30 border-y border-outline-variant/60" id="produk">
        <div className="max-w-7xl mx-auto px-margin">
          <FeaturedProducts products={featuredProductItems} />

          <div className="mt-10 text-center">
            <Link className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-surface hover:bg-primary hover:text-on-primary text-primary border border-primary/50 font-headline-sm text-headline-sm transition-all duration-200 shadow-sm active:scale-95 font-semibold" href="/products">
              <span>Buka Katalog Lengkap ({productCount}+ Produk)</span>
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION: FEATURED PRODUCT SPOTLIGHT */}
      {featuredProducts.length > 0 && (() => {
        const spot = featuredProducts[0];
        const spotImage = spot.images?.[0]?.url || "/placeholder-product.png";
        const spotPrice = spot.discountPrice
          ? Number(spot.discountPrice)
          : Number(spot.basePrice);
        const spotSlug = spot.slug;
        return (
      <section className="py-14 md:py-16 max-w-7xl mx-auto px-margin">
        <div className="bg-surface border border-outline-variant rounded-3xl p-6 md:p-10 shadow-sm hover:shadow-md transition-shadow">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 relative rounded-2xl overflow-hidden aspect-[16/10] bg-surface-container-low group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={spot.name} src={spotImage}/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute top-4 left-4">
                <span className="bg-primary text-on-primary text-label-md font-label-md px-3 py-1 rounded-full font-bold shadow-md flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-lime">local_fire_department</span>
                  Produk Unggulan
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 bg-surface/90 backdrop-blur-md p-3 rounded-xl border border-outline-variant/50 flex items-center justify-between">
                <div><p className="text-label-sm font-label-sm text-on-surface-variant">Kategori</p><p className="text-headline-sm font-headline-sm font-bold text-primary">{spot.category.name}</p></div>
                <div className="text-right"><p className="text-label-sm font-label-sm text-on-surface-variant">Stok Tersedia</p><p className="text-headline-sm font-headline-sm font-bold text-secondary">{spot.stock} unit</p></div>
              </div>
            </div>
            <div className="lg:col-span-6 flex flex-col items-start space-y-4">
              <span className="text-label-md font-label-md text-secondary font-bold uppercase tracking-wider">{spot.category.name}</span>
              <h2 className="text-headline-lg font-serif font-semibold text-on-surface">{spot.name}</h2>
              <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">{spot.shortDesc || spot.description?.slice(0, 200) || "Produk pilihan berkualitas tinggi untuk kebutuhan pertanian modern."}</p>
              <div className="space-y-2.5 py-2 w-full">
                {["Ready stock siap kirim instan hari ini", "Garansi produk resmi & berkualitas", "Konsultasi gratis via WhatsApp"].map((feat) => (
                  <div key={feat} className="flex items-center gap-2.5 text-body-md font-body-md text-on-surface">
                    <span className="w-5 h-5 rounded-full bg-sage/40 dark:bg-sage/30 text-forest dark:text-lime flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-[16px]">check</span></span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 w-full">
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-price-lg font-serif font-bold text-primary text-[32px]">{formatPrice(spotPrice)}</span>
                  {spot.discountPrice && (
                    <span className="text-body-sm font-body-sm text-on-surface-variant line-through">{formatPrice(Number(spot.basePrice))}</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-headline-sm px-7 py-3.5 rounded-full shadow-md transition-all active:scale-95 font-semibold" href={`/products/${spotSlug}`}>
                    <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                    <span>Beli Sekarang</span>
                  </Link>
                  <Link className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-headline-sm text-headline-sm px-6 py-3.5 rounded-full border border-outline-variant transition-colors" href={`/products/${spotSlug}`}>
                    <span>Lihat Detail</span>
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
        );
      })()}

      {/* SECTION: CALL TO ACTION BANNER */}
      <section className="py-10 max-w-7xl mx-auto px-margin" id="konsultasi">
        <div className="relative bg-gradient-to-br from-[#0e3324] via-[#09251a] to-[#04120d] text-white border border-outline-variant/30 rounded-3xl p-8 md:p-14 text-center overflow-hidden shadow-2xl">
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-lime/10 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-leaf/10 blur-3xl pointer-events-none"></div>
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-lime text-label-md font-label-md border border-white/15 backdrop-blur-sm">
              <span className="material-symbols-outlined text-[16px]">psychology</span>
              <span>{content.homeCtaBadge}</span>
            </div>
            <h2 className="text-headline-lg font-serif font-semibold md:text-[38px] md:leading-[46px] text-white">
              {content.homeCtaTitle}
            </h2>
            <p className="text-body-lg font-body-lg text-[#dfe7d7]/85 max-w-xl mx-auto leading-relaxed">
              {content.homeCtaSubtitle}
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link className="inline-flex items-center justify-center gap-2 bg-[#f4f0e6] hover:bg-lime text-[#092f21] font-headline-sm text-headline-sm px-8 py-3.5 rounded-full font-bold shadow-lg transition-all active:scale-95" href="/products">
                <span>Mulai Belanja</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
              <a className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-md font-headline-sm text-headline-sm px-7 py-3.5 rounded-full transition-all active:scale-95 font-semibold" href={`https://wa.me/${SITE_CONFIG.whatsappIntl}`} rel="noopener noreferrer" target="_blank">
                <span className="material-symbols-outlined text-[20px] text-lime">chat</span>
                <span>Chat via WhatsApp</span>
              </a>
            </div>
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-label-md font-label-md text-[#a6b8ad]">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-lime">schedule</span>
                {content.homeCtaPoint1}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-lime">verified</span>
                {content.homeCtaPoint2}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}