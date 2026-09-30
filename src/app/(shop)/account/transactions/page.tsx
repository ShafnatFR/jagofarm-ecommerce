"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Order {
  orderNumber: string;
  status: string;
  date: string;
  total: number;
  items: { name: string; qty: number; image: string }[];
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  pending: { label: "Menunggu", color: "bg-secondary-fixed-dim/20 text-secondary" },
  paid: { label: "Dibayar", color: "bg-tertiary-fixed/20 text-tertiary" },
  processing: { label: "Diproses", color: "bg-primary-fixed/20 text-primary" },
  shipped: { label: "Dikirim", color: "bg-primary-fixed/20 text-primary" },
  delivered: { label: "Diterima", color: "bg-tertiary-fixed/20 text-tertiary" },
  cancelled: { label: "Dibatalkan", color: "bg-error-container text-error" },
};

export default function TransactionHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setOrders(data.orders || []);
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

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
              <div key={i} className="h-32 bg-surface-container rounded-2xl animate-pulse" />
            ))}
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
          <div className="space-y-4">
            {orders.map((order) => {
              const badge = STATUS_BADGE[order.status] || STATUS_BADGE.pending;
              return (
                <div key={order.orderNumber} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-headline-sm font-headline-sm text-on-surface">{order.orderNumber}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-label-md font-label-md ${badge.color}`}>{badge.label}</span>
                    </div>
                    <p className="text-body-sm font-body-sm text-on-surface-variant">{order.date}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-outline">inventory_2</span>
                      <span className="text-body-md font-body-md text-on-surface-variant">{order.items.length} produk</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-headline-sm font-headline-sm text-primary">Rp {order.total.toLocaleString("id-ID")}</p>
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
        )}
      </section>
    </div>
  );
}