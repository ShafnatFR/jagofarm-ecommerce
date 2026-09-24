"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { FocusEvent } from "react";
import {
  Search,
  X,
  ShoppingCart,
  User,
  Menu,
  ChevronDown,
  Leaf,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileNav } from "./mobile-nav";
import { useCartStore } from "@/lib/cart-store";
import { useCategories } from "@/hooks/use-categories";

const SEARCH_PLACEHOLDER = "Cari produk pertanian...";

interface NavbarSearchProps {
  className?: string;
  /** Dipanggil sebelum navigasi (mis. untuk menutup sheet mobile). */
  onNavigate?: () => void;
}

/**
 * Input pencarian navbar (dipakai versi desktop & mobile).
 * Submit/Enter -> /products?search=<query> (di-encode).
 * Suggestion diambil dari daftar kategori yang sudah di-fetch navbar.
 */
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
    if (!q) {
      router.push("/products");
      return;
    }
    router.push(`/products?search=${encodeURIComponent(q)}`);
  }

  function resetSearch() {
    setQuery("");
    setFocused(false);
    // Di halaman produk, tombol X juga melepas filter pencarian di URL.
    if (pathname === "/products") {
      router.push("/products");
    }
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setFocused(false);
    }
  }

  return (
    <div
      className={cn("relative w-full", className)}
      onFocusCapture={() => setFocused(true)}
      onBlur={handleBlur}
    >
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          runSearch(query);
        }}
      >
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={SEARCH_PLACEHOLDER}
          aria-label="Cari produk"
          className="w-full rounded-lg border border-input bg-background py-2 pl-4 pr-20 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={resetSearch}
            aria-label="Hapus pencarian"
            className="absolute right-10 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="submit"
          aria-label="Cari"
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
        >
          <Search className="h-4 w-4" />
        </button>
      </form>

      {/* Suggestion: kata kunci + kategori yang sudah dimuat navbar */}
      {showSuggestions && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          <button
            type="button"
            onClick={() => runSearch(trimmed)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              Cari <span className="font-medium">&ldquo;{trimmed}&rdquo;</span>
            </span>
          </button>
          {suggestions.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setFocused(false);
                onNavigate?.();
                router.push(`/products?category=${encodeURIComponent(cat.slug)}`);
              }}
              className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
            >
              <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Leaf className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-primary tracking-tight">
              JagoFarm
            </span>
          </Link>

          {/* Search — desktop */}
          <NavbarSearch className="hidden md:block flex-1 max-w-xl mx-4" />

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Categories dropdown — desktop */}
            <div
              className="relative hidden lg:block"
              onMouseEnter={() => setShowCategories(true)}
              onMouseLeave={() => setShowCategories(false)}
            >
              <button
                className={cn(
                  "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary",
                  showCategories && "bg-secondary"
                )}
              >
                Kategori
                <ChevronDown className="h-4 w-4" />
              </button>
              {showCategories && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-border bg-card p-2 shadow-lg">
                  {loading ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
                  ) : categories.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No categories</div>
                  ) : (
                    categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/products?category=${cat.slug}`}
                        className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary hover:text-primary"
                      >
                        {cat.name}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative rounded-lg p-2 transition-colors hover:bg-secondary"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User */}
            <Link
              href="/login"
              className="rounded-lg p-2 transition-colors hover:bg-secondary"
            >
              <User className="h-5 w-5" />
            </Link>

            {/* Mobile menu */}
            <button
              className="rounded-lg p-2 transition-colors hover:bg-secondary lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search — mobile */}
        <div className="pb-3 md:hidden">
          <NavbarSearch />
        </div>
      </div>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
