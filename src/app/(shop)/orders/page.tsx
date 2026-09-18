import Link from "next/link";
import { Metadata } from "next";
import { Package, ChevronRight, Eye } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pesanan Saya",
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Menunggu Pembayaran", color: "bg-yellow-100 text-yellow-700" },
  paid: { label: "Dibayar", color: "bg-blue-100 text-blue-700" },
  processing: { label: "Diproses", color: "bg-indigo-100 text-indigo-700" },
  shipped: { label: "Dikirim", color: "bg-purple-100 text-purple-700" },
  delivered: { label: "Selesai", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Dibatalkan", color: "bg-red-100 text-red-700" },
};

const orders = [
  {
    orderNumber: "JF-20260918-001",
    date: "18 September 2026",
    status: "shipped",
    total: 789000,
    items: [
      { name: "Set Hidroponik NFT 6 Lubang", qty: 1 },
      { name: "Nutrisi AB Mix Hidroponik", qty: 2 },
    ],
  },
  {
    orderNumber: "JF-20260915-003",
    date: "15 September 2026",
    status: "delivered",
    total: 2500000,
    items: [{ name: "Set Aquaponik Compact 120x80cm", qty: 1 }],
  },
  {
    orderNumber: "JF-20260910-007",
    date: "10 September 2026",
    status: "pending",
    total: 175000,
    items: [{ name: "Anakan Nila Gift Super — 500 ekor", qty: 1 }],
  },
];

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Pesanan Saya</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Riwayat dan status pesanan Anda
      </p>

      <div className="mt-6 space-y-4">
        {orders.map((order) => {
          const status = statusConfig[order.status] ?? statusConfig.pending;
          return (
            <div
              key={order.orderNumber}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{order.date}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    status.color
                  )}
                >
                  {status.label}
                </span>
              </div>

              <div className="mt-3 space-y-1">
                {order.items.map((item, i) => (
                  <p key={i} className="text-sm text-muted-foreground">
                    {item.name} × {item.qty}
                  </p>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <p className="text-sm font-bold text-primary">
                  Total: {formatPrice(order.total)}
                </p>
                <Link href={`/orders/${order.orderNumber}`}>
                  <Button variant="secondary" size="sm">
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    Detail
                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {orders.length === 0 && (
        <div className="py-20 text-center">
          <Package className="mx-auto h-16 w-16 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Belum Ada Pesanan</h2>
          <p className="mt-1 text-muted-foreground">
            Mulai belanja untuk melihat pesanan di sini.
          </p>
          <Link href="/products" className="mt-4 inline-block">
            <Button>Belanja Sekarang</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
