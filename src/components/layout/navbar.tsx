"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FocusEvent } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { MobileNav } from "./mobile-nav";
import { useCartStore } from "@/lib/cart-store";
import { useCategories } from "@/hooks/use-categories";

const SEARCH_PLACEHOLDER = "Cari paket tambak, kit hidroponik, sensor IoT, benih...";

interface NavbarSearchProps {
  className?: string;
  onNavigate?: () => void;
}

function NavbarSearch({ className, onNavigate }: NavbarSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { categories } = useCategories();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const trimmed = query.trim();
  const suggestions =
    trimmed.length > 0
      ? categories
          .filter((cat) => cat.name.toLowerCase().includes(trimmed.toLowerCase()))
          .slice(0, 5)
      : [];
  const showSuggestions = focused && trimmed.length > 0;

  function runSearch(value: string) {
    const q = value.trim();
    setFocused(false);
    onNavigate?.();
    if (!q) { router.push("/products"); return; }
    router.push(`/products?search=${encodeURIComponent(q)}`);
  }

  function resetSearch() {
    setQuery("");
    setFocused(false);
    if (pathname === "/products") router.push("/products");
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
  }

  return (
    <div className={cn("relative w-full", className)} onFocusCapture={() => setFocused(true)} onBlur={handleBlur}>
      <form role="search" onSubmit={(e) => { e.preventDefault(); runSearch(query); }}>
        <div className="relative flex items-center">
          <Icon name="search" size={20} className="absolute left-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={SEARCH_PLACEHOLDER}
            aria-label="Cari produk"
            className="w-full bg-secondary hover:bg-secondary/80 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-full pl-11 pr-20 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors outline-none"
          />
          {query.length > 0 && (
            <button type="button" onClick={resetSearch} aria-label="Hapus pencarian"
              className="absolute right-10 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <Icon name="close" size={16} />
            </button>
          )}
          <button type="submit" aria-label="Cari"
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary">
            <Icon name="search" size={18} />
          </button>
        </div>
      </form>

      {showSuggestions && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <button type="button" onClick={() => runSearch(trimmed)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary">
            <Icon name="search" size={16} className="shrink-0 text-muted-foreground" />
            <span className="truncate">Cari <span className="font-medium">&ldquo;{trimmed}&rdquo;</span></span>
          </button>
          {suggestions.map((cat) => (
            <button key={cat.id} type="button"
              onClick={() => { setFocused(false); onNavigate?.(); router.push(`/products?category=${encodeURIComponent(cat.slug)}`); }}
              className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-sm transition-colors hover:bg-secondary">
              <Icon name="category" size={16} className="shrink-0 text-muted-foreground" />
              <span className="truncate">Kategori: {cat.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const [showCategories, setShowCategories] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { categories, loading } = useCategories();
  const cartCount = useCartStore((s) => s.totalItems());

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto w-full gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
            <Icon name="water_drop" size={24} filled className="text-emerald-200" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold text-primary tracking-tight leading-none">JagoFarm</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Agri &amp; Aqua Tech</span>
          </div>
        </Link>

        {/* Search — desktop */}
        <NavbarSearch className="hidden md:block flex-1 max-w-xl" />

        {/* Nav links */}
        <nav className="hidden lg:flex items-center gap-6">
          <div className="relative" onMouseEnter={() => setShowCategories(true)} onMouseLeave={() => setShowCategories(false)}>
            <button className="text-primary font-semibold text-sm hover:text-primary/80 transition-colors flex items-center gap-1">
              Kategori
              <Icon name="expand_more" size={16} />
            </button>
            {showCategories && (
              <div className="absolute left-0 top-full mt-1 w-56 rounded-xl border border-border bg-card p-2 shadow-lg">
                {loading ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
                ) : categories.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Belum ada kategori</div>
                ) : (
                  categories.map((cat) => (
                    <Link key={cat.id} href={`/products?category=${cat.slug}`}
                      className="block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-secondary hover:text-primary">
                      {cat.name}
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
          <Link href="/products?category=set-tambak" className="text-muted-foreground font-medium text-sm hover:text-primary transition-colors">Set Tambak</Link>
          <Link href="/products?category=iot-smart-farming" className="text-muted-foreground font-medium text-sm hover:text-primary transition-colors flex items-center gap-1">
            IoT &amp; Smart Farming
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </Link>
          <Link href="/contact" className="text-muted-foreground font-medium text-sm hover:text-primary transition-colors">Konsultasi</Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button aria-label="Search" className="md:hidden p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors">
            <Icon name="search" size={24} />
          </button>
          <Link href="/wishlist" aria-label="Favorit" className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-primary transition-colors relative">
            <Icon name="favorite" size={22} />
          </Link>
          <Link href="/cart" aria-label="Keranjang" className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-primary transition-colors relative">
            <Icon name="shopping_cart" size={24} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-destructive text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>
            )}
          </Link>
          <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
          <Link href="/account" className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-primary transition-all">
            <Icon name="account_circle" size={28} className="text-primary" />
            <span className="hidden sm:inline-block text-sm font-semibold text-primary">Akun</span>
          </Link>
          <button aria-label="Menu" className="lg:hidden p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors" onClick={() => setMobileOpen(true)}>
            <Icon name="menu" size={24} />
          </button>
        </div>
      </div>

      {/* Mobile search */}
      <div className="px-4 pb-3 md:hidden">
        <NavbarSearch />
      </div>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}