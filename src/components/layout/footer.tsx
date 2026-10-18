"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCategories } from "@/hooks/use-categories";
import { useCartStore } from "@/lib/cart-store";
import {
  STORE_PROFILE_DEFAULT,
  type StoreProfile,
} from "@/lib/site-settings-shared";

/**
 * Footer adalah client component (butuh keranjang & kategori live), jadi profil
 * toko diambil dari endpoint publik /api/site-profile (DB-first, ter-cache) —
 * pola yang sama dengan badge "Jam Layanan" di halaman masuk. Parent server
 * component bisa langsung mengirim prop `profile` supaya tidak perlu fetch.
 * Selalu ada fallback ke default (SITE_CONFIG) supaya tampilan awal identik.
 */
export function Footer({ profile }: { profile?: StoreProfile } = {}) {
  const { categories, loading } = useCategories();
  const cartCount = useCartStore((s) => s.totalItems());
  const [fetchedProfile, setFetchedProfile] = useState<StoreProfile | null>(null);
  const year = new Date().getFullYear();

  useEffect(() => {
    if (profile) return; // parent sudah mengirim nilai dari server
    let cancelled = false;
    fetch("/api/site-profile")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { profile?: StoreProfile } | null) => {
        if (!cancelled && data?.profile) setFetchedProfile(data.profile);
      })
      .catch(() => {
        /* biarkan default tampil bila API gagal */
      });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  const store = profile ?? fetchedProfile ?? STORE_PROFILE_DEFAULT;

  return (
    <>
      <footer className="bg-[#061710] border-t border-white/10 text-[#a6b8ad] w-full">
        <div className="w-full px-margin py-space-xl max-w-7xl mx-auto">
          {/* Top Grid: Brand & Link Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-12 border-b border-white/10">
            {/* Brand Bio (2 Cols on lg) */}
            <div className="lg:col-span-2 space-y-4">
              <Link className="flex items-center gap-2.5" href="/">
                <div className="w-9 h-9 rounded-xl bg-lime text-forest-deep flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span>
                </div>
                <span className="text-headline-md font-serif font-bold text-white tracking-tight">{store.name}</span>
              </Link>
              <p className="text-body-sm font-body-sm text-[#a6b8ad] max-w-sm leading-relaxed">
                Solusi pertanian modern Indonesia. Menyediakan peralatan akuaponik, hidroponik, tambak bioflok, dan IoT smart farming berkualitas tinggi demi ketahanan pangan nasional.
              </p>
              {/* Social Links */}
              <div className="flex items-center gap-3 pt-2">
                <a aria-label="Instagram" className="w-9 h-9 rounded-full bg-white/5 hover:bg-lime hover:text-forest-deep text-white/90 flex items-center justify-center border border-white/10 transition-colors" href={store.instagram} rel="noopener noreferrer" target="_blank">
                  <span className="material-symbols-outlined text-[18px]">share</span>
                </a>
                <a aria-label="Website" className="w-9 h-9 rounded-full bg-white/5 hover:bg-lime hover:text-forest-deep text-white/90 flex items-center justify-center border border-white/10 transition-colors" href={store.website} rel="noopener noreferrer" target="_blank">
                  <span className="material-symbols-outlined text-[18px]">language</span>
                </a>
                <a aria-label="Email" className="w-9 h-9 rounded-full bg-white/5 hover:bg-lime hover:text-forest-deep text-white/90 flex items-center justify-center border border-white/10 transition-colors" href={`mailto:${store.email}`}>
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </a>
              </div>
            </div>
            {/* Col 1: PRODUK */}
            <div>
              <h4 className="text-headline-sm font-serif font-bold text-white mb-4 tracking-wide">PRODUK</h4>
              <ul className="space-y-2.5 text-label-md font-label-md">
                {loading ? (
                  <li className="text-[#a6b8ad]">Memuat...</li>
                ) : categories.length === 0 ? (
                  <li><Link className="text-[#a6b8ad] hover:text-lime transition-colors duration-150" href="/products">Semua Produk</Link></li>
                ) : (
                  categories.map((cat) => (
                    <li key={cat.id}>
                      <Link className="text-[#a6b8ad] hover:text-lime transition-colors duration-150" href={`/products?category=${cat.slug}`}>
                        {cat.name}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>
            {/* Col 2: INFORMASI & KEBIJAKAN */}
            <div>
              <h4 className="text-headline-sm font-serif font-bold text-white mb-4 tracking-wide">INFORMASI</h4>
              <ul className="space-y-2.5 text-label-md font-label-md">
                <li><Link className="text-[#a6b8ad] hover:text-lime transition-colors duration-150" href="/about">Tentang Kami</Link></li>
                <li><Link className="text-[#a6b8ad] hover:text-lime transition-colors duration-150" href="/how-to-order">Cara Pemesanan</Link></li>
                <li><Link className="text-[#a6b8ad] hover:text-lime transition-colors duration-150" href="/faq">FAQ</Link></li>
                <li><Link className="text-[#a6b8ad] hover:text-lime transition-colors duration-150" href="/contact">Hubungi Kami</Link></li>
                <li><Link className="text-[#a6b8ad] hover:text-lime transition-colors duration-150" href="/shipping-policy">Kebijakan Pengiriman</Link></li>
                <li><Link className="text-[#a6b8ad] hover:text-lime transition-colors duration-150" href="/return-policy">Kebijakan Pengembalian</Link></li>
                <li><Link className="text-[#a6b8ad] hover:text-lime transition-colors duration-150" href="/privacy-policy">Kebijakan Privasi</Link></li>
                <li><Link className="text-[#a6b8ad] hover:text-lime transition-colors duration-150" href="/terms">Syarat dan Ketentuan</Link></li>
              </ul>
            </div>
            {/* Col 3: KONTAK KANTOR */}
            <div>
              <h4 className="text-headline-sm font-serif font-bold text-white mb-4 tracking-wide">KONTAK</h4>
              <ul className="space-y-3 text-body-sm font-body-sm text-[#a6b8ad]">
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-lime shrink-0 mt-0.5">location_on</span>
                  <span>{store.address}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-lime shrink-0">call</span>
                  <a className="hover:text-white transition-colors" href={`tel:+${store.whatsapp}`}>{store.phone}</a>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-lime shrink-0">mail</span>
                  <a className="hover:text-white transition-colors" href={`mailto:${store.email}`}>{store.email}</a>
                </li>
                <li className="pt-2">
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-[11px] text-[#a6b8ad]">Jam Operasional Layanan:</p>
                    <p className="text-label-md font-label-md text-white font-semibold">{store.hours}</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          {/* Bottom Copyright Row */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-body-sm font-body-sm text-[#63726a] gap-4">
            <p className="text-center sm:text-left">
              © {year} {store.name}. Seluruh hak cipta dilindungi.
            </p>
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
          {cartCount > 0 && (
            <span className="absolute -top-1 right-2 bg-error text-on-error text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">{cartCount}</span>
          )}
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