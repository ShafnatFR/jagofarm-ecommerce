"use client";

import Link from "next/link";
import { X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCategories } from "@/hooks/use-categories";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const { categories, loading } = useCategories();

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/40 lg:hidden"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-72 bg-card shadow-xl transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <span className="text-lg font-bold text-primary">Menu</span>
          <button
            onClick={onClose}
            className="rounded-lg p-1 transition-colors hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="px-2 py-4">
          {/* Main links */}
          <div className="space-y-1">
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Beranda
            </Link>
            <Link
              href="/products"
              onClick={onClose}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Semua Produk
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>

          {/* Categories */}
          <div className="mt-4 border-t border-border pt-4">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Kategori
            </p>
            <div className="mt-2 space-y-1">
              {loading ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
              ) : categories.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">No categories</div>
              ) : (
                categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/products?category=${cat.slug}`}
                    onClick={onClose}
                    className="block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-secondary hover:text-primary"
                  >
                    {cat.name}
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Account */}
          <div className="mt-4 border-t border-border pt-4">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Akun
            </p>
            <div className="mt-2 space-y-1">
              <Link
                href="/login"
                onClick={onClose}
                className="block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-secondary"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                className="block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-secondary"
              >
                Daftar
              </Link>
              <Link
                href="/orders"
                onClick={onClose}
                className="block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-secondary"
              >
                Pesanan Saya
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
