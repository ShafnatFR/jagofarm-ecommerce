"use client";

import { useSiteContent } from "@/hooks/use-site-content";
import { formatPriceDual } from "@/lib/utils";

/**
 * Harga + perkiraan USD bila CMS displayCurrency memuat "USD".
 * Tanpa itu = sama dengan formatPrice biasa (tanpa overhead tampilan).
 */
export function useDualPrice() {
  const site = useSiteContent();
  const showUsd = (site.displayCurrency ?? "").toUpperCase().includes("USD");
  const rate = typeof site.usdRate === "number" && site.usdRate > 0 ? site.usdRate : 16000;
  return (price: number | string | { toString(): string }) =>
    formatPriceDual(price, showUsd ? { showUsd: true, usdRate: rate } : undefined);
}
