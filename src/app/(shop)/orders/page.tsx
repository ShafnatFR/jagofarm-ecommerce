"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ChevronRight, Eye, AlertCircle, LogIn } from "lucide-react";
import { cn, formatPrice, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Menunggu Pembayaran", color: "bg-yellow-100 text-yellow-700" },
  paid: { label: "Dibayar", color: "bg-blue-100 text-blue-700" },
  processing: { label: "Diproses", color: "bg-purple-100 text-purple-700" },
  shipped: { label: "Dikirim", color: "bg-indigo-100 text-indigo-700" },
  delivered: { label: "Selesai", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Dibatalkan", color: "bg-red-100 text-red-700" },
};

interface OrderItem {
  name: string; quantity: number; price: number;
}
interface Order {
  id: string; orderNumber: string; createdAt: string;
  status: string; total: number; items: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      setError(null);
      setUnauthorized(false);
      try {
        const res = await fetch(`/api/orders?page=${page}&limit=10`);
        if (res.status === 401 || res.status === 403) {
          setUnauthorized(true);
          return;
        }
        if (!res.ok) throw new Error("Gagal memuat pesanan");
        const data = await res.json();
        setOrders(data.orders ?? []);
        setTotalPages(data.totalPages ?? 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [page]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-1 h-3 w-24" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-3 h-8 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <LogIn className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Masuk Diperlukan</h1>
        <p className="mt-2 text-muted-foreground">Silakan masuk untuk melihat riwayat pesanan Anda.</p>
        <Link href="/login" className="mt-6 inline-block">
          <Button size="lg">Masuk <LogIn className="ml-2 h-4 w-4" /></Button>
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">Gagal Memuat Pesanan</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Pesanan Saya</h1>
      <p className="mt-1 text-sm text-muted-foreground">Riwayat dan status pesanan Anda</p>

      {orders.length === 0 ? (
        <div className="py-20 text-center">
          <Package className="mx-auto h-16 w-16 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Belum Ada Pesanan</h2>
          <p className="mt-1 text-muted-foreground">Mulai belanja untuk melihat pesanan di sini.</p>
          <Link href="/products" className="mt-4 inline-block">
            <Button>Belanja Sekarang</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-4">
            {orders.map((order) => {
              const status = statusConfig[order.status] ?? statusConfig.pending;
              return (
                <div key={order.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                    </div>
                    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", status.color)}>
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1">
                    {order.items.map((item, i) => (
                      <p key={i} className="text-sm text-muted-foreground">
                        {item.name} × {item.quantity}
                      </p>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <p className="text-sm font-bold text-primary">Total: {formatPrice(order.total)}</p>
                    <Link href={`/orders/${order.orderNumber}`}>
                      <Button variant="secondary" size="sm">
                        <Eye className="mr-1 h-3.5 w-3.5" /> Detail
                        <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1}
                onClick={() => setPage(page - 1)}>Sebelumnya</Button>
              <span className="text-sm text-muted-foreground">Halaman {page} dari {totalPages}</span>
              <Button variant="secondary" size="sm" disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}>Selanjutnya</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
