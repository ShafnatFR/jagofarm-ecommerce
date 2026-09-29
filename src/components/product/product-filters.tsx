"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/use-categories";

const priceRanges = [
  { label: "Di bawah Rp 100rb", min: 0, max: 100000 },
  { label: "Rp 100rb – 500rb", min: 100000, max: 500000 },
  { label: "Rp 500rb – 1jt", min: 500000, max: 1000000 },
  { label: "Rp 1jt – 5jt", min: 1000000, max: 5000000 },
  { label: "Di atas Rp 5jt", min: 5000000, max: 0 },
];

const sortOptions = [
  { value: "newest", label: "Terbaru" },
  { value: "price-asc", label: "Harga: Rendah → Tinggi" },
  { value: "price-desc", label: "Harga: Tinggi → Rendah" },
  { value: "popular", label: "Paling Populer" },
];

interface ProductFiltersProps {
  className?: string;
}

export function ProductFilters({ className }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { categories, loading } = useCategories();

  const activeCategory = searchParams.get("category") || "";
  const activeSort = searchParams.get("sort") || "newest";
  const activeSearch = searchParams.get("search")?.trim() || "";
  const [searchInput, setSearchInput] = useState(activeSearch);

  // Sinkronkan input dengan URL (mis. saat pencarian dihapus dari header).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sinkronkan input dengan query URL saat berubah dari luar halaman
    setSearchInput(activeSearch);
  }, [activeSearch]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // reset page on filter change
    router.push(`/products?${params.toString()}`);
  }

  function clearFilters() {
    setSearchInput("");
    router.push("/products");
  }

  const hasActiveFilters = Boolean(activeCategory || activeSearch);

  const filterContent = (
    <div className="space-y-6">
      {/* "search" */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Cari Produk</h3>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            updateParam("search", searchInput.trim());
          }}
          className="relative"
        >
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari produk..."
            aria-label="Cari produk"
            className="w-full rounded-lg border border-input bg-background py-2 pl-3 pr-16 text-sm outline-none focus:border-primary"
          />
          {searchInput.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                updateParam("search", "");
              }}
              aria-label="Hapus pencarian"
              className="absolute right-9 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Icon name="close" size={12} />
            </button>
          )}
          <button
            type="submit"
            aria-label="Cari"
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
          >
            <Icon name="search" size={16} />
          </button>
        </form>
        {activeSearch && (
          <p className="mt-2 text-xs text-muted-foreground">
            Menampilkan hasil untuk “{activeSearch}”
          </p>
        )}
      </div>

      {/* Sort */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Urutkan</h3>
        <select
          value={activeSort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Categories */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Kategori</h3>
        <div className="space-y-2">
          {loading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">No categories available</div>
          ) : (
            categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  updateParam("category", activeCategory === cat.slug ? "" : cat.slug)
                }
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors text-left",
                  activeCategory === cat.slug
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-secondary"
                )}
              >
                <span>{cat.name}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Harga</h3>
        <div className="space-y-2">
          {priceRanges.map((range, i) => (
            <button
              key={i}
              onClick={() =>
                updateParam("price", `${range.min}-${range.max}`)
              }
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-secondary text-left"
            >
              <span>{range.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <Button
          variant="secondary"
          size="sm"
          onClick={clearFilters}
          className="w-full"
        >
          <Icon name="close" size={12} className="mr-1" />
          Hapus Filter
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setMobileOpen(true)}
          className="mb-4"
        >
          <Icon name="tune" size={16} className="mr-2" />
          Filter
        </Button>

        {/* Mobile overlay */}
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-card p-4 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Filter</h2>
                <button onClick={() => setMobileOpen(false)}>
                  <Icon name="close" size={20} />
                </button>
              </div>
              {filterContent}
            </div>
          </>
        )}
      </div>

      {/* Desktop sidebar */}
      <aside className={cn("hidden lg:block", className)}>
        <div className="sticky top-20 rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-base font-semibold">Filter</h2>
          {filterContent}
        </div>
      </aside>
    </>
  );
}
