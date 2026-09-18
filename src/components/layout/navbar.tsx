"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  ChevronDown,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileNav } from "./mobile-nav";
import { useCartStore } from "@/lib/cart-store";
import { useCategories } from "@/hooks/use-categories";

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
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari produk pertanian..."
                className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

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
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari produk pertanian..."
              className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
