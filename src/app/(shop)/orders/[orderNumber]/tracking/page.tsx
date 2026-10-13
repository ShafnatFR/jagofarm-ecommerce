"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";

interface TrackingEvent {
  /** Timestamp asli dari order (ISO string); null bila event tidak punya waktu. */
  time: string | null;
  title: string;
  description: string;
  icon: string;
  status: "done" | "current" | "pending";
}

interface OrderItemData {
  id: string;
  quantity: number;
  price: number;
  product?: { name?: string | null } | null;
  variant?: { name?: string | null } | null;
}

interface ShippingAddressData {
  recipientName?: string | null;
  phone?: string | null;
  detail?: string | null;
  district?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
}

/** Bentuk order dari GET /api/orders/[orderNumber] (hasil serializeOrder). */
interface SerializedOrder {
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  createdAt: string;
  updatedAt?: string | null;
  paidAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  total: number;
  items: OrderItemData[];
  shippingAddress?: ShippingAddressData | null;
  shippingCourier: string | null;
  shippingService?: string | null;
  trackingNumber: string | null;
}

interface OrderData extends SerializedOrder {
  trackingEvents: TrackingEvent[];
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: "Menunggu Pembayaran", color: "bg-secondary-fixed-dim text-primary", icon: "schedule" },
  paid: { label: "Dibayar", color: "bg-tertiary-fixed/30 text-tertiary", icon: "check_circle" },
  processing: { label: "Diproses", color: "bg-primary-fixed/30 text-primary", icon: "inventory_2" },
  shipped: { label: "Dikirim", color: "bg-primary-fixed/30 text-primary", icon: "local_shipping" },
  delivered: { label: "Diterima", color: "bg-tertiary-fixed/30 text-tertiary", icon: "verified" },
  cancelled: { label: "Dibatalkan", color: "bg-error-container text-error", icon: "cancel" },
  expired: { label: "Kedaluwarsa", color: "bg-surface-container-low text-on-surface", icon: "timer_off" },
};

/**
 * Riwayat lacak hanya dibangun dari timestamp asli order (createdAt, paidAt,
 * shippedAt, deliveredAt, updatedAt). Event tanpa timestamp tersedia
 * (status "processing", pembatalan tanpa catatan waktu) tetap ditampilkan,
 * hanya tanpa informasi waktu.
 */
function buildTrackingEvents(order: SerializedOrder): TrackingEvent[] {
  const status = order.status;
  const courier = (order.shippingCourier ?? "").trim() || "kurir";
  const paymentConfirmed =
    Boolean(order.paidAt) || order.paymentStatus === "paid";

  const events: TrackingEvent[] = [
    {
      time: order.createdAt ?? null,
      title: "Pesanan Dibuat",
      description: "Pesanan Anda telah diterima sistem",
      icon: "receipt_long",
      status: "done",
    },
  ];

  if (
    paymentConfirmed ||
    ["processing", "shipped", "delivered"].includes(status)
  ) {
    events.push({
      time: order.paidAt ?? null,
      title: "Pembayaran Dikonfirmasi",
      description: "Pembayaran telah diverifikasi",
      icon: "payments",
      status: status === "pending" ? "current" : "done",
    });
  }

  if (["processing", "shipped", "delivered"].includes(status)) {
    events.push({
      time: null,
      title: "Pesanan Sedang Dikemas",
      description: "Tim gudang sedang menyiapkan pesanan Anda",
      icon: "inventory_2",
      status: status === "processing" ? "current" : "done",
    });
  }

  if (["shipped", "delivered"].includes(status)) {
    events.push({
      time: order.shippedAt ?? null,
      title: "Diserahkan ke Kurir",
      description: `Paket diserahkan ke ${courier}`,
      icon: "local_shipping",
      status: status === "shipped" ? "current" : "done",
    });
  }

  if (status === "delivered") {
    events.push({
      time: order.deliveredAt ?? null,
      title: "Paket Diterima",
      description: "Paket telah sampai di tujuan",
      icon: "verified",
      status: "done",
    });
  }

  if (status === "cancelled") {
    events.push({
      time: order.updatedAt ?? null,
      title: "Pesanan Dibatalkan",
      description: "Pesanan telah dibatalkan",
      icon: "cancel",
      status: "done",
    });
  }

  if (status === "expired") {
    events.push({
      time: order.updatedAt ?? null,
      title: "Pesanan Kedaluwarsa",
      description: "Batas waktu pembayaran sudah lewat",
      icon: "timer_off",
      status: "done",
    });
  }

  return events.reverse();
}

function formatTimestamp(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function courierLabel(
  courier: string | null,
  service: string | null | undefined
): string {
  const name = (courier ?? "").trim();
  const via = (service ?? "").trim();
  if (!name) return "Kurir belum ditentukan";
  return via ? `${name} - ${via}` : name;
}

function itemName(item: OrderItemData): string {
  const name = item.product?.name?.trim() || "Produk";
  const variant = item.variant?.name?.trim();
  return variant ? `${name} (${variant})` : name;
}

export default function TrackingPage() {
  const params = useParams();
  const { toast } = useToast();
  const router = useRouter();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderNumber = params.orderNumber as string;
    if (!orderNumber) return;

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderNumber}`);
        if (!res.ok) throw new Error("Order not found");
        const payload = (await res.json()) as Partial<SerializedOrder> & {
          order?: SerializedOrder;
        };
        // GET /api/orders/[orderNumber] membalas { order }; tolerir order langsung.
        const source = payload.order ?? (payload as SerializedOrder);
        if (!source?.orderNumber || !source.status) {
          throw new Error("Order not found");
        }

        const normalized: SerializedOrder = {
          ...source,
          total: Number(source.total) || 0,
          items: (source.items ?? []).map((item) => ({
            ...item,
            quantity: Number(item.quantity) || 0,
            price: Number(item.price) || 0,
          })),
        };

        setOrder({
          ...normalized,
          trackingEvents: buildTrackingEvents(normalized),
        });
      } catch {
        router.push("/orders");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [params.orderNumber, router]);

  async function handleCopyTrackingNumber(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: "Disalin", description: "Nomor resi disalin ke clipboard." });
    } catch {
      toast({
        variant: "destructive",
        title: "Gagal menyalin",
        description: "Silakan salin nomor resi secara manual.",
      });
    }
  }

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
  const trackingNumber = (order.trackingNumber ?? "").trim();
  const lastUpdated = formatTimestamp(order.updatedAt);

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
                    <h3 className="text-headline-sm font-headline-sm text-on-surface">
                      {courierLabel(order.shippingCourier, order.shippingService)}
                    </h3>
                    <p className="text-body-sm font-body-sm text-on-surface-variant">
                      No. Resi: {trackingNumber || "Nomor resi belum tersedia"}
                    </p>
                  </div>
                </div>
                {trackingNumber && (
                  <button
                    type="button"
                    onClick={() => void handleCopyTrackingNumber(trackingNumber)}
                    className="px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant text-label-md font-label-md border border-outline-variant transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px] mr-1">content_copy</span>
                    Salin
                  </button>
                )}
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
                      <p className="text-label-sm font-label-sm text-outline mt-1">
                        {formatTimestamp(event.time) ?? "Waktu tidak dicatat"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-label-sm font-label-sm text-outline mt-4 text-right">
                Terakhir diperbarui: {lastUpdated ?? "-"}
              </p>
            </div>
          </div>

          {/* Right: Order Info */}
          <div className="space-y-6">
            {/* Products */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
              <h3 className="text-headline-sm font-headline-sm text-on-surface mb-4">Produk dalam Pesanan</h3>
              <div className="space-y-3">
                {order.items.length === 0 ? (
                  <p className="text-body-sm font-body-sm text-on-surface-variant">
                    Belum ada item pada pesanan ini.
                  </p>
                ) : (
                  order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start gap-2">
                      <div>
                        <p className="text-body-md font-body-md text-on-surface font-medium">{itemName(item)}</p>
                        <p className="text-label-sm font-label-sm text-on-surface-variant">{item.quantity}x</p>
                      </div>
                      <p className="text-body-md font-body-md text-on-surface font-semibold whitespace-nowrap">Rp {(item.price * item.quantity).toLocaleString("id-ID")}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-outline-variant flex justify-between">
                <span className="text-headline-sm font-headline-sm text-on-surface">Total</span>
                <span className="text-headline-sm font-headline-sm text-primary">Rp {order.total.toLocaleString("id-ID")}</span>
              </div>
            </div>

            {/* Address */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
              <h3 className="text-headline-sm font-headline-sm text-on-surface mb-3">Alamat Tujuan</h3>
              {order.shippingAddress ? (
                <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">
                  <span className="font-medium text-on-surface">{order.shippingAddress.recipientName}</span>
                  {order.shippingAddress.phone ? (
                    <>
                      <br />
                      {order.shippingAddress.phone}
                    </>
                  ) : null}
                  <br />
                  {[
                    order.shippingAddress.detail,
                    order.shippingAddress.district,
                    order.shippingAddress.city,
                    order.shippingAddress.province,
                    order.shippingAddress.postalCode,
                  ]
                    .map((part) => (part ?? "").trim())
                    .filter(Boolean)
                    .join(", ")}
                </p>
              ) : (
                <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">
                  Alamat tidak tersedia
                </p>
              )}
            </div>

            {/* Help */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm text-center">
              <span className="material-symbols-outlined text-[32px] text-primary mb-2">support_agent</span>
              <h3 className="text-headline-sm font-headline-sm text-on-surface">Butuh Bantuan?</h3>
              <p className="text-body-sm font-body-sm text-on-surface-variant mt-1 mb-4">Hubungi kami jika ada kendala</p>
              <a href={`https://wa.me/${SITE_CONFIG.whatsappIntl}`} target="_blank" rel="noopener noreferrer"
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
