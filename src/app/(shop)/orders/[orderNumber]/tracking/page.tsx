"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface TrackingEvent {
  time: string;
  title: string;
  description: string;
  icon: string;
  status: "done" | "current" | "pending";
}

interface OrderData {
  orderNumber: string;
  status: string;
  createdAt: string;
  total: number;
  items: { name: string; qty: number; price: number }[];
  shippingAddress: string;
  courier: string;
  trackingNumber: string;
  trackingEvents: TrackingEvent[];
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: "Menunggu Pembayaran", color: "bg-secondary-fixed-dim text-primary", icon: "schedule" },
  paid: { label: "Dibayar", color: "bg-tertiary-fixed/30 text-tertiary", icon: "check_circle" },
  processing: { label: "Diproses", color: "bg-primary-fixed/30 text-primary", icon: "inventory_2" },
  shipped: { label: "Dikirim", color: "bg-primary-fixed/30 text-primary", icon: "local_shipping" },
  delivered: { label: "Diterima", color: "bg-tertiary-fixed/30 text-tertiary", icon: "verified" },
  cancelled: { label: "Dibatalkan", color: "bg-error-container text-error", icon: "cancel" },
};

export default function TrackingPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${params.orderNumber}`);
        if (!res.ok) throw new Error("Order not found");
        const data = await res.json();

        // Generate mock tracking events based on order status
        const events: TrackingEvent[] = [
          { time: data.createdAt, title: "Pesanan Dibuat", description: "Pesanan Anda telah diterima sistem", icon: "receipt_long", status: "done" },
        ];

        if (["paid", "processing", "shipped", "delivered"].includes(data.status)) {
          events.push({ time: data.createdAt, title: "Pembayaran Dikonfirmasi", description: "Pembayaran telah diverifikasi", icon: "payments", status: "done" });
        }
        if (["processing", "shipped", "delivered"].includes(data.status)) {
          events.push({ time: data.createdAt, title: "Pesanan Sedang Dikemas", description: "Tim gudang sedang menyiapkan pesanan Anda", icon: "inventory_2", status: "done" });
        }
        if (["shipped", "delivered"].includes(data.status)) {
          events.push({ time: data.createdAt, title: "Diserahkan ke Kurir", description: `Paket diserahkan ke ${data.courier || "kurir"}`, icon: "local_shipping", status: data.status === "shipped" ? "current" : "done" });
        }
        if (data.status === "delivered") {
          events.push({ time: data.createdAt, title: "Paket Diterima", description: "Paket telah sampai di tujuan", icon: "verified", status: "done" });
        }
        if (data.status === "cancelled") {
          events.push({ time: data.createdAt, title: "Pesanan Dibatalkan", description: "Pesanan telah dibatalkan", icon: "cancel", status: "done" });
        }

        setOrder({
          ...data,
          courier: data.courier || "SiCepat",
          trackingNumber: data.trackingNumber || `SC${Math.random().toString().slice(2, 12)}`,
          trackingEvents: events.reverse(),
        });
      } catch {
        router.push("/orders");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [params.orderNumber, router]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-margin py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-container rounded w-1/3" />
          <div className="h-64 bg-surface-container rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!order) return null;

  const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.pending;

  return (
    <div className="w-full">
      {/* Header */}
      <section className="bg-primary text-on-primary py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-margin">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-headline-lg font-headline-lg">Lacak Pengiriman</h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-md font-label-md ${statusInfo.color}`}>
                  <span className="material-symbols-outlined text-[14px]">{statusInfo.icon}</span>
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-body-md font-body-md text-primary-fixed-dim">{order.orderNumber}</p>
            </div>
            <div className="flex gap-2">
              <Link href="/orders" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-on-primary border border-white/30 text-label-md font-label-md transition-colors">
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Kembali
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-margin py-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left: Timeline */}
          <div className="md:col-span-2 space-y-6">
            {/* Courier Card */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-fixed/30 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">local_shipping</span>
                  </div>
                  <div>
                    <h3 className="text-headline-sm font-headline-sm text-on-surface">{order.courier}</h3>
                    <p className="text-body-sm font-body-sm text-on-surface-variant">No. Resi: {order.trackingNumber}</p>
                  </div>
                </div>
                <button onClick={() => navigator.clipboard.writeText(order.trackingNumber)} className="px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant text-label-md font-label-md border border-outline-variant transition-colors">
                  <span className="material-symbols-outlined text-[14px] mr-1">content_copy</span>
                  Salin
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
              <h3 className="text-headline-sm font-headline-sm text-on-surface mb-6">Riwayat Perjalanan Paket</h3>
              <div className="space-y-0">
                {order.trackingEvents.map((event, i) => (
                  <div key={i} className="flex gap-4">
                    {/* Timeline line + dot */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        event.status === "done" ? "bg-tertiary-fixed/30 text-tertiary" :
                        event.status === "current" ? "bg-primary text-on-primary animate-pulse" :
                        "bg-surface-container text-outline"
                      }`}>
                        <span className="material-symbols-outlined text-[16px]">{event.icon}</span>
                      </div>
                      {i < order.trackingEvents.length - 1 && (
                        <div className={`w-0.5 flex-1 min-h-[40px] ${event.status === "done" ? "bg-tertiary-fixed/30" : "bg-outline-variant"}`} />
                      )}
                    </div>
                    {/* Content */}
                    <div className="pb-6 flex-1">
                      <h4 className="text-headline-sm font-headline-sm text-on-surface">{event.title}</h4>
                      <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">{event.description}</p>
                      <p className="text-label-sm font-label-sm text-outline mt-1">{event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-label-sm font-label-sm text-outline mt-4 text-right">Terakhir diperbarui: baru saja</p>
            </div>
          </div>

          {/* Right: Order Info */}
          <div className="space-y-6">
            {/* Products */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
              <h3 className="text-headline-sm font-headline-sm text-on-surface mb-4">Produk dalam Pesanan</h3>
              <div className="space-y-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-body-md font-body-md text-on-surface font-medium">{item.name}</p>
                      <p className="text-label-sm font-label-sm text-on-surface-variant">{item.qty}x</p>
                    </div>
                    <p className="text-body-md font-body-md text-on-surface font-semibold whitespace-nowrap">Rp {(item.price * item.qty).toLocaleString("id-ID")}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-outline-variant flex justify-between">
                <span className="text-headline-sm font-headline-sm text-on-surface">Total</span>
                <span className="text-headline-sm font-headline-sm text-primary">Rp {order.total.toLocaleString("id-ID")}</span>
              </div>
            </div>

            {/* Address */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
              <h3 className="text-headline-sm font-headline-sm text-on-surface mb-3">Alamat Tujuan</h3>
              <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">{order.shippingAddress}</p>
            </div>

            {/* Help */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm text-center">
              <span className="material-symbols-outlined text-[32px] text-primary mb-2">support_agent</span>
              <h3 className="text-headline-sm font-headline-sm text-on-surface">Butuh Bantuan?</h3>
              <p className="text-body-sm font-body-sm text-on-surface-variant mt-1 mb-4">Hubungi kami jika ada kendala</p>
              <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-label-lg font-label-lg px-5 py-2.5 rounded-full transition-all active:scale-95">
                <span className="material-symbols-outlined text-[18px]">chat</span>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}