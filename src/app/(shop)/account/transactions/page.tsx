"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/constants";

interface OrderItem {
  quantity: number;
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string | null;
  paymentProvider?: string | null;
  paymentRef?: string | null;
  paidAt?: string | null;
  total: number;
  items?: OrderItem[];
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  unpaid: "bg-yellow-100 text-yellow-700",
  paid: "bg-blue-100 text-blue-700",
  refunded: "bg-gray-100 text-gray-700",
  failed: "bg-red-100 text-red-700",
};

function statusBadge(status: string): { label: string; color: string } {
  return {
    label: ORDER_STATUS_LABELS[status] ?? status,
    color: ORDER_STATUS_COLORS[status] ?? "bg-surface-container-low text-on-surface-variant",
  };
}

function paymentStatusBadge(paymentStatus?: string) {
  return {
    label: PAYMENT_STATUS_LABELS[paymentStatus ?? ""] ?? (paymentStatus ?? "Tidak diketahui"),
    color:
      PAYMENT_STATUS_COLORS[paymentStatus ?? ""] ?? "bg-surface-container-low text-on-surface-variant",
  };
}

function paymentMethodLabel(paymentMethod?: string | null): string {
  if (!paymentMethod) return "—";
  return PAYMENT_METHOD_LABELS[paymentMethod] ?? paymentMethod;
}

export default function TransactionHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
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
        if (!res.ok) throw new Error("Gagal memuat riwayat transaksi");
        const data = await res.json();
        if (cancelled) return;
        setOrders(data.orders ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchOrders();
    return () => {
      cancelled = true;
    };
  }, [page, reloadKey]);

  return (
    <div className="w-full">
      {/* Header */}
      <section className="bg-primary text-on-primary py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-margin text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-secondary-fixed-dim text-label-md font-label-md mb-4 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            <span>Riwayat</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg text-on-primary">Riwayat Transaksi</h1>
          <p className="text-body-md font-body-md text-primary-fixed-dim mt-2">Semua transaksi dan pesanan Anda</p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-margin py-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-surface-container rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : unauthorized ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-[64px] text-outline/40 mb-4">lock</span>
            <h2 className="text-headline-lg font-headline-lg text-on-surface mb-2">Masuk Diperlukan</h2>
            <p className="text-body-lg font-body-lg text-on-surface-variant mb-8">Silakan masuk untuk melihat riwayat transaksi Anda.</p>
            <Link href="/login" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-headline-sm px-7 py-3.5 rounded-full shadow-md transition-all active:scale-95">
              <span className="material-symbols-outlined text-[20px]">login</span>
              Masuk
            </Link>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-[64px] text-error/60 mb-4">error</span>
            <h2 className="text-headline-lg font-headline-lg text-on-surface mb-2">Gagal Memuat Transaksi</h2>
            <p className="text-body-lg font-body-lg text-on-surface-variant mb-8">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-headline-sm px-7 py-3.5 rounded-full shadow-md transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
              Coba Lagi
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-[64px] text-outline/40 mb-4">receipt_long</span>
            <h2 className="text-headline-lg font-headline-lg text-on-surface mb-2">Belum Ada Transaksi</h2>
            <p className="text-body-lg font-body-lg text-on-surface-variant mb-8">Mulai belanja untuk melihat riwayat transaksi</p>
            <Link href="/products" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-headline-sm px-7 py-3.5 rounded-full shadow-md transition-all active:scale-95">
              <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {orders.map((order) => {
                const orderBadge = statusBadge(order.status);
                const payment = paymentStatusBadge(order.paymentStatus);
                const itemCount = (order.items ?? []).reduce((sum, i) => sum + (i.quantity ?? 0), 0);
                const lineCount = order.items?.length ?? 0;
                const isPaid = order.paymentStatus === "paid";
                return (
                  <div key={order.id} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-headline-sm font-headline-sm text-on-surface">{order.orderNumber}</h3>
                        <span className={cn("px-2.5 py-0.5 rounded-full text-label-md font-label-md", orderBadge.color)}>
                          {orderBadge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-body-sm font-body-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>

                    {/* Detail pembayaran */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 rounded-xl border border-outline-variant/70 bg-surface-container-low/40 p-4">
                      <div>
                        <p className="text-label-sm font-label-sm text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">payments</span>
                          Metode
                        </p>
                        <p className="text-body-md font-body-md text-on-surface mt-0.5">{paymentMethodLabel(order.paymentMethod)}</p>
                      </div>
                      <div>
                        <p className="text-label-sm font-label-sm text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">bolt</span>
                          Provider
                        </p>
                        <p className="text-body-md font-body-md text-on-surface mt-0.5 uppercase">{order.paymentProvider ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-label-sm font-label-sm text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">{isPaid ? "paid" : "schedule"}</span>
                          Status Bayar
                        </p>
                        <span className={cn("inline-block mt-1 px-2.5 py-0.5 rounded-full text-label-md font-label-md", payment.color)}>
                          {payment.label}
                        </span>
                      </div>
                      <div>
                        <p className="text-label-sm font-label-sm text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">event_available</span>
                          Tanggal Bayar
                        </p>
                        <p className="text-body-md font-body-md text-on-surface mt-0.5">
                          {order.paidAt ? formatDate(order.paidAt) : "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-outline">inventory_2</span>
                        <span className="text-body-md font-body-md text-on-surface-variant">
                          {lineCount} produk ({itemCount} unit)
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-headline-sm font-headline-sm text-primary">{formatPrice(order.total)}</p>
                        <Link href={`/orders/${order.orderNumber}`} className="inline-flex items-center gap-1 text-label-md font-label-md text-primary hover:underline">
                          Detail
                          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-outline-variant text-body-sm font-body-sm text-on-surface-variant hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  Sebelumnya
                </button>
                <span className="text-body-sm font-body-sm text-on-surface-variant">
                  Halaman {page} dari {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-outline-variant text-body-sm font-body-sm text-on-surface-variant hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  Selanjutnya
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
