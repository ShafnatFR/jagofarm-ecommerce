"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
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
      <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={onClose} />
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-72 bg-card shadow-xl transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <span className="text-lg font-bold text-primary">Menu</span>
          <button onClick={onClose} className="rounded-full p-1.5 transition-colors hover:bg-secondary">
            <Icon name="close" size={20} />
          </button>
        </div>

        <nav className="px-2 py-4 overflow-y-auto max-h-[calc(100vh-64px)]">
          <div className="space-y-1">
            <Link href="/" onClick={onClose} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-secondary">
              <Icon name="home" size={20} className="text-primary" />
              Beranda
            </Link>
            <Link href="/products" onClick={onClose} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-secondary">
              <div className="flex items-center gap-3">
                <Icon name="category" size={20} className="text-primary" />
                Semua Produk
              </div>
              <Icon name="chevron_right" size={16} className="text-muted-foreground" />
            </Link>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kategori</p>
            <div className="mt-2 space-y-1">
              {loading ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
              ) : categories.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">Belum ada kategori</div>
              ) : (
                categories.map((cat) => (
                  <Link key={cat.id} href={`/products?category=${cat.slug}`} onClick={onClose}
                    className="block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-secondary hover:text-primary">
                    {cat.name}
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Akun</p>
            <div className="mt-2 space-y-1">
              {[
                { href: "/login", label: "Masuk", icon: "login" },
                { href: "/register", label: "Daftar", icon: "person_add" },
                { href: "/orders", label: "Pesanan Saya", icon: "receipt_long" },
                { href: "/wishlist", label: "Wishlist Saya", icon: "favorite" },
              ].map((item) => (
                <Link key={item.href} href={item.href} onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-secondary">
                  <Icon name={item.icon} size={18} className="text-muted-foreground" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}