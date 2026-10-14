"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useCategories } from "@/hooks/use-categories";
import { useSiteContent } from "@/hooks/use-site-content";
import { useCartStore } from "@/lib/cart-store";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { SiteContent } from "@/lib/site-settings-shared";


const SEARCH_PLACEHOLDER = "Cari paket tambak, kit hidroponik, sensor IoT, benih...";

/**
 * `content` dikirim oleh parent server component (layout) supaya teks navbar
 * tampil tanpa flash; bila tidak ada (mis. dipakai di tempat lain), hook
 * mengambil dari /api/site-content dengan fallback default.
 */
export function Navbar({ content }: { content?: SiteContent } = {}) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const cartCount = useCartStore((s) => s.totalItems());
  const { categories } = useCategories();
  const fetchedContent = useSiteContent();
  const site = content ?? fetchedContent;

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data.user);
    });

    const { data: authSubscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) setUser(session?.user ?? null);
      }
    );

    return () => {
      mounted = false;
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k" || (!event.metaKey && !event.ctrlKey)) return;

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      router.push("/products");
      return;
    }
    router.push(`/products?search=${encodeURIComponent(query)}`);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      {/* TOP PROMO ANNOUNCEMENT STRIP */}
      <div className="bg-white text-black border-b border-black px-margin py-2 text-label-md font-label-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="hidden md:flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-black text-white text-[10px] font-bold">NEW</span>
            <span className="text-black">{site.navAnnouncement}</span>
          </div>
          <div className="flex items-center justify-center gap-1 mx-auto md:mx-0">
            <span className="material-symbols-outlined text-[16px] text-black">eco</span>
            <span>{site.navPromo}</span>
          </div>
          <div className="hidden lg:flex items-center gap-4 text-black">
            <Link className="hover:text-black transition-colors" href="/faq">Pusat Bantuan</Link>
            <span className="opacity-40">•</span>
            <Link className="hover:text-black transition-colors flex items-center gap-1" href="/contact">
              <span className="material-symbols-outlined text-[14px]">support_agent</span>
              {site.navSupportBadge}
            </Link>
          </div>
        </div>
      </div>

      {/* SHARED COMPONENT: TopNavBar */}
      <header className="bg-surface-container-lowest dark:bg-inverse-surface border-b border-outline-variant dark:border-outline shadow-sm dark:shadow-none docked full-width top-0 sticky z-50">
        <div className="flex items-center justify-between px-margin py-3 max-w-7xl mx-auto w-full gap-4">
          {/* Brand Logo Anchor */}
          <Link className="flex items-center gap-2.5 shrink-0 group" href="/">
            <div className="w-10 h-10 rounded-xl bg-white border border-black flex items-center justify-center text-black shadow-sm group-hover:scale-105 transition-transform duration-200">
              <span className="material-symbols-outlined text-[24px] text-black" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span>
            </div>
            <div className="flex flex-col">
              <span className="text-headline-md font-headline-md font-extrabold text-black dark:text-inverse-primary tracking-tight leading-none">JagoFarm</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-outline">{site.navBrandTagline}</span>
            </div>
          </Link>

          {/* Search Bar on the Left / Center-Left */}
          <div className="flex-1 max-w-xl hidden md:block">
            <form className="relative flex items-center" onSubmit={handleSearch} role="search">
              <span className="material-symbols-outlined absolute left-3.5 text-black text-[20px] pointer-events-none">search</span>
              <input
                ref={searchInputRef}
                type="text"
                name="search"
                aria-label="Cari produk"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white hover:bg-white border border-black focus:border-black focus:ring-1 focus:ring-black rounded-full pl-11 pr-24 py-2 text-body-md font-body-md text-black placeholder:text-black transition-colors outline-none"
                placeholder={SEARCH_PLACEHOLDER}
              />
              <div className="absolute right-2 flex items-center gap-1">
                <span className="text-[11px] bg-white border border-black rounded px-1.5 py-0.5 text-black">⌘K</span>
              </div>
            </form>
          </div>

          {/* Navigation Links from Shared Components JSON */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link className="text-black dark:text-inverse-primary font-bold text-label-lg font-label-lg hover:text-black dark:hover:text-inverse-primary transition-colors duration-150 flex items-center gap-1" href="/products">
              Kategori
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </Link>
            {categories.slice(0, 3).map((cat) => (
              <Link key={cat.id} className="text-on-surface-variant dark:text-surface-variant font-medium text-label-lg font-label-lg hover:text-black dark:hover:text-inverse-primary transition-colors duration-150" href={`/products?category=${cat.slug}`}>
                {cat.name}
              </Link>
            ))}
            <Link className="text-on-surface-variant dark:text-surface-variant font-medium text-label-lg font-label-lg hover:text-black dark:hover:text-inverse-primary transition-colors duration-150 flex items-center gap-1" href="/consultation">
              Konsultasi
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
            </Link>
          </nav>

          {/* Trailing Icon Actions: shopping_cart, account_circle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Hamburger — buka menu mobile (hanya di layar kecil) */}
            <button
              type="button"
              aria-label="Buka menu"
              aria-expanded={mobileOpen}
              className="md:hidden p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
              onClick={() => setMobileOpen(true)}
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
            {/* Search Trigger for Mobile */}
            <button aria-label="Search" className="md:hidden p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors" onClick={() => router.push("/products")}>
              <span className="material-symbols-outlined text-[24px]">search</span>
            </button>
            {/* Mode gelap */}
            <ThemeToggle className="hidden sm:inline-flex" />
            {/* Wishlist */}
            <Link href="/wishlist" aria-label="Favorit" className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-black transition-colors relative">
              <span className="material-symbols-outlined text-[22px]">favorite</span>
            </Link>
            {/* Shopping Cart */}
            <Link href="/cart" aria-label="shopping_cart" className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-black transition-colors relative transition-all duration-200 active:scale-95">
              <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-error text-on-error text-label-sm font-label-sm w-4 h-4 rounded-full flex items-center justify-center font-bold">{cartCount}</span>
              )}
            </Link>
            <div className="h-6 w-px bg-outline-variant mx-1 hidden sm:block"></div>
            {/* Account Circle */}
            {user ? (
              <div className="flex items-center gap-1">
                <Link href="/account" aria-label="Akun saya" className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-black transition-all duration-200 active:scale-95">
                  <span className="material-symbols-outlined text-[28px] text-black">account_circle</span>
                  <span className="hidden sm:flex flex-col items-start leading-tight">
                    <span className="text-label-lg font-label-lg font-semibold text-black">Akun saya</span>
                    <span className="max-w-[150px] truncate text-[11px] text-on-surface-variant">{user.email}</span>
                  </span>
                </Link>
                <button type="button" onClick={handleSignOut} className="hidden md:inline-flex text-[11px] font-semibold text-outline hover:text-error px-2 py-1 rounded-full hover:bg-surface-container" aria-label="Keluar">
                  Keluar
                </button>
              </div>
            ) : (
              <Link href="/account" aria-label="account_circle" className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-black transition-all duration-200 active:scale-95">
                <span className="material-symbols-outlined text-[28px] text-black">account_circle</span>
                <span className="hidden sm:inline-block text-label-lg font-label-lg font-semibold text-black">Masuk / Daftar</span>
              </Link>
            )}
          </div>
        </div>
      </header>
      
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}