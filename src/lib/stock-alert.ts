import { prisma } from "@/lib/prisma";
import { notifyAdminSafe } from "@/lib/notifications";

/**
 * Pemicu alert stok menipis — best-effort, tidak boleh menggagalkan order.
 * Dipanggil setelah stok berkurang dengan daftar productId yang berubah.
 *
 * Aturan:
 *  - Ambang dari env LOW_STOCK_THRESHOLD (default 5).
 *  - Hanya produk 0 < stock <= ambang yang di-alert.
 *  - Anti-spam: kolom lastStockAlertAt — alert ulang hanya bila stok
 *    sempat pulih di atas ambang lalu jatuh lagi (kolom di-reset saat
 *    stok kembali > ambang), atau alert terakhir > 24 jam.
 */
const ALERT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function lowStockThreshold(): number {
  const raw = parseInt(process.env.LOW_STOCK_THRESHOLD || "5", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 5;
}

export async function checkLowStockSafe(productIds: string[]): Promise<void> {
  try {
    const ids = [...new Set(productIds.filter(Boolean))];
    if (ids.length === 0) return;
    const threshold = lowStockThreshold();
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, stock: true, lastStockAlertAt: true },
    });
    const now = new Date();
    for (const p of products) {
      if (p.stock <= 0 || p.stock > threshold) continue;
      if (
        p.lastStockAlertAt &&
        now.getTime() - p.lastStockAlertAt.getTime() < ALERT_COOLDOWN_MS
      ) {
        continue;
      }
      await prisma.product.update({
        where: { id: p.id },
        data: { lastStockAlertAt: now },
      });
      await notifyAdminSafe({
        type: "stock",
        title: `Stok menipis: ${p.name} (sisa ${p.stock})`,
        body: `Stok produk mencapai ambang ${threshold}. Segera restok.`,
        href: "/admin/products",
      });
    }
  } catch (error) {
    console.error("[stock-alert] gagal:", error);
  }
}

/** Reset penanda alert saat stok dipulihkan di atas ambang (restok/opname). */
export async function resetStockAlertIfRecovered(
  productId: string,
  stock: number
): Promise<void> {
  try {
    if (stock > lowStockThreshold()) {
      await prisma.product.updateMany({
        where: { id: productId, lastStockAlertAt: { not: null } },
        data: { lastStockAlertAt: null },
      });
    }
  } catch (error) {
    console.error("[stock-alert] gagal reset:", error);
  }
}
