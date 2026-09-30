"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ReviewForm } from "@/components/product/review-form";
import { useCartStore } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

/** Snap.js global (loaded on demand through loadSnapScript). */
declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

interface OrderItemDetail {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  price: number;
  total: number;
  /** Relasi produk dari GET /api/orders/[orderNumber] (bisa tidak lengkap). */
  product?: {
    id: string;
    name: string;
    slug: string;
    weightGram?: number | null;
    images?: { url: string }[] | null;
  } | null;
  variant?: { id: string; name: string } | null;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  /** Gateway pembayaran order ini ("midtrans" / "mayar"). */
  paymentProvider?: string | null;
  /** Referensi transaksi di gateway. */
  paymentRef?: string | null;
  /** URL halaman pembayaran hosted (Mayar) bila ada. */
  paymentUrl?: string | null;
  trackingNumber: string | null;
  shippingCourier: string | null;
  shippingService: string | null;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  notes: string | null;
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  shippingAddress: {
    recipientName: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    postalCode: string;
    detail: string | null;
  };
  items: OrderItemDetail[];
}

interface PaymentInfo {
  paymentType: string | null;
  vaNumbers: { bank: string; va_number: string }[];
  permataVaNumber: string | null;
  billKey: string | null;
  billerCode: string | null;
  store: string | null;
  qrString: string | null;
  transactionId: string | null;
  transactionTime: string | null;
  settlementTime: string | null;
}

/** Respons GET /api/orders/[orderNumber] — kadang membalas order langsung. */
type OrderResponse = Partial<OrderDetail> & { order?: OrderDetail };

/** Respons GET /api/payments/status/[orderNumber]. */
interface PaymentStatusResponse {
  order?: OrderDetail;
  paymentInfo?: PaymentInfo;
}

/** Respons POST /api/payments/create (Midtrans Snap atau provider redirect). */
interface PaymentCreateResponse {
  provider?: string;
  providerRef?: string;
  paymentUrl?: string;
  token?: string;
  redirectUrl?: string;
  clientKey?: string;
  snapScriptUrl?: string;
  isProduction?: boolean;
  orderNumber?: string;
  grossAmount?: number;
  expiresAt?: string;
}

/** Respons PATCH /api/orders/[orderNumber] (aksi batal). */
interface OrderCancelResponse {
  message?: string;
}

const statusSteps = [
  { key: "pending", label: "Menunggu Pembayaran", icon: "schedule" },
  { key: "paid", label: "Dibayar", icon: "check_circle" },
  { key: "processing", label: "Diproses", icon: "inventory_2" },
  { key: "shipped", label: "Dikirim", icon: "local_shipping" },
  { key: "delivered", label: "Selesai", icon: "check_circle" },
];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  expired: "bg-surface-container-low text-on-surface",
};

const SNAP_SCRIPT_ID = "midtrans-snap-script";

/**
 * Halaman pelacakan resmi kurir. Halaman-halaman ini umumnya meminta nomor resi
 * dimasukkan ulang, jadi nomor resi selalu dicetak di samping tautan.
 * Kurir yang tidak dikenal tidak mendapat tautan (fallback teks saja).
 */
const COURIER_TRACKING: Record<string, { label: string; url: string }> = {
  jne: { label: "JNE", url: "https://www.jne.co.id/id/tracking/trace" },
  sicepat: { label: "SiCepat", url: "https://www.sicepat.com/checkAwb" },
  anteraja: { label: "AnterAja", url: "https://anteraja.id/tracking" },
  pos: { label: "POS Indonesia", url: "https://www.posindonesia.co.id/id/tracking" },
  posindonesia: {
    label: "POS Indonesia",
    url: "https://www.posindonesia.co.id/id/tracking",
  },
  jnt: { label: "J&T", url: "https://www.jet.co.id/track" },
  jet: { label: "J&T", url: "https://www.jet.co.id/track" },
  "j&t": { label: "J&T", url: "https://www.jet.co.id/track" },
};

/** Label + tautan lacak kurir; `url` null bila kurir belum dikenal. */
function getTrackingInfo(
  courier: string | null | undefined
): { label: string; url: string | null } | null {
  const trimmed = (courier ?? "").trim();
  if (!trimmed) return null;

  const known = COURIER_TRACKING[trimmed.toLowerCase()];
  if (known) return { label: known.label, url: known.url };

  return { label: trimmed, url: null };
}

/** Nama tampilan item pesanan (produk + varian, bila ada). */
function orderItemName(item: OrderItemDetail): string {
  const productName = item.product?.name?.trim() || "Produk";
  return item.variant?.name ? `${productName} (${item.variant.name})` : productName;
}

const FALLBACK_SNAP_SCRIPT_URL =
  "https://app.sandbox.midtrans.com/snap/snap.js";

/** Label provider pembayaran untuk ditampilkan ke pengguna. */
const PAYMENT_PROVIDER_LABELS: Record<string, string> = {
  midtrans: "Midtrans",
  mayar: "Mayar",
};

function providerLabel(id: string | null | undefined): string {
  const raw = (id ?? "").trim();
  if (!raw) return "-";
  return PAYMENT_PROVIDER_LABELS[raw.toLowerCase()] ?? raw;
}

/** Load Snap.js once, with the client key attached as data-client-key. */
function loadSnapScript(scriptUrl: string, clientKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Tidak ada browser context"));
      return;
    }
    if (window.snap) {
      resolve();
      return;
    }
    const existing = document.getElementById(
      SNAP_SCRIPT_ID
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Gagal memuat Midtrans Snap.js"))
      );
      return;
    }
    const script = document.createElement("script");
    script.id = SNAP_SCRIPT_ID;
    script.src = scriptUrl;
    script.async = true;
    script.setAttribute("data-client-key", clientKey);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Gagal memuat Midtrans Snap.js"));
    document.body.appendChild(script);
  });
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "error" in payload) {
    const err = (payload as { error?: unknown }).error;
    if (typeof err === "string" && err.trim()) return err;
    if (err && typeof err === "object") {
      const first = Object.values(err as Record<string, unknown>)
        .flat()
        .find((value) => typeof value === "string" && value.trim());
      if (typeof first === "string") return first;
    }
  }
  return fallback;
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const { toast } = useToast();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const hydrateCart = useCartStore((s) => s.hydrate);

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [autoCheck, setAutoCheck] = useState(false);
  /** URL halaman pembayaran provider redirect-based (Mayar). */
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  /** Provider dari respons create terakhir (dipakai bila order belum menyimpannya). */
  const [createdProvider, setCreatedProvider] = useState<string | null>(null);
  /** Item yang sedang diulas lewat dialog ReviewForm. */
  const [reviewTarget, setReviewTarget] = useState<OrderItemDetail | null>(null);
  /** productId yang sudah diulas dari halaman ini (tidak bisa submit dua kali). */
  const [reviewedProductIds, setReviewedProductIds] = useState<string[]>([]);

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/orders/${orderNumber}`);
      const data = (await res.json().catch(() => null)) as OrderResponse | null;
      if (!res.ok) {
        setOrder(null);
        return;
      }
      // GET /api/orders/[orderNumber] answers { order } — tolerate a bare order too.
      setOrder((data?.order ?? data) as OrderDetail);
    } catch {
      setOrder(null);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pola fetch-saat-mount detail pesanan; setState bagian alur pengambilan data
    setLoading(true);
    fetchOrder().finally(() => setLoading(false));
  }, [orderNumber]);

  // Ringkasan cart server disiapkan lebih dulu supaya 'Beli Lagi' ikut tersinkron.
  useEffect(() => {
    void hydrateCart();
  }, [hydrateCart]);

  // Pulihkan daftar produk yang sudah diulas (bertahan saat reload halaman).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(
        `jagofarm-reviewed-${orderNumber}`
      );
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- memulihkan state dari sessionStorage (sistem eksternal), bukan turunan render
        setReviewedProductIds(
          parsed.filter((value): value is string => typeof value === "string")
        );
      }
    } catch {
      /* sessionStorage tidak tersedia: cukup pakai state lokal */
    }
  }, [orderNumber]);

  // Midtrans Snap callback lands on /orders/{orderNumber}?payment=finish|unfinish|error
  useEffect(() => {
    if (typeof window === "undefined") return;
    const search = new URLSearchParams(window.location.search);
    const kind = search.get("payment");
    if (!kind) return;

    if (kind === "finish") {
      toast({
        title: "Pembayaran selesai",
        description: "Kami sedang memverifikasi pembayaran Anda.",
      });
    } else if (kind === "unfinish") {
      toast({
        title: "Pembayaran belum selesai",
        description: "Pesanan masih menunggu pembayaran. Anda bisa melanjutkannya.",
      });
    } else if (kind === "error") {
      toast({
        variant: "destructive",
        title: "Pembayaran gagal",
        description: "Transaksi tidak berhasil. Silakan coba lagi.",
      });
    }

    window.history.replaceState({}, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hasil pembacaan query Midtrans; setState sengaja memicu cek status sekali
    setAutoCheck(true);
  }, []);

  useEffect(() => {
    if (autoCheck && order) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reaksi sekali setelah order termuat; setState mencegah cek status berulang
      setAutoCheck(false);
      void refreshStatus(true);
    }
  }, [autoCheck, order]);

  async function refreshStatus(showToast = true) {
    if (!order) return;
    setRefreshing(true);
    try {
      const res = await fetch(`/api/payments/status/${order.orderNumber}`);
      const data = (await res.json().catch(() => null)) as PaymentStatusResponse | null;

      if (data?.order) {
        const fresh = data.order as OrderDetail;
        setOrder((prev) => (prev ? { ...prev, ...fresh } : fresh));
      }
      if (data?.paymentInfo) {
        setPaymentInfo(data.paymentInfo as PaymentInfo);
      }

      if (!res.ok) {
        if (showToast) {
          toast({
            variant: "destructive",
            title: "Gagal memuat status pembayaran",
            description: extractErrorMessage(data, "Silakan coba lagi nanti."),
          });
        }
        return;
      }

      if (!showToast) return;

      const status = data?.order?.status ?? order.status;
      const payStatus = data?.order?.paymentStatus ?? order.paymentStatus;

      if (payStatus === "paid") {
        toast({
          title: "Pembayaran terkonfirmasi",
          description: "Pesanan Anda sudah dibayar dan akan segera diproses.",
        });
      } else if (status === "expired") {
        toast({
          variant: "destructive",
          title: "Pesanan kedaluwarsa",
          description: "Batas waktu pembayaran sudah lewat. Silakan buat pesanan baru.",
        });
      } else if (status === "cancelled") {
        toast({
          variant: "destructive",
          title: "Pesanan dibatalkan",
          description: "Transaksi dibatalkan. Stok produk dikembalikan.",
        });
      } else {
        toast({
          title: "Status pembayaran diperbarui",
          description: `Status saat ini: ${payStatus}.`,
        });
      }
    } catch {
      if (showToast) {
        toast({
          variant: "destructive",
          title: "Gagal memuat status pembayaran",
          description: "Periksa koneksi Anda lalu coba lagi.",
        });
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function handlePay() {
    if (!order) return;
    setPaying(true);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: order.orderNumber }),
      });
      const data = (await res.json().catch(() => null)) as PaymentCreateResponse | null;

      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "Gagal memulai pembayaran",
          description: extractErrorMessage(
            data,
            "Transaksi pembayaran tidak dapat dibuat."
          ),
        });
        return;
      }

      const token = data?.token as string | undefined;
      const redirectUrl = data?.redirectUrl as string | undefined;
      const createdPaymentUrl = data?.paymentUrl as string | undefined;
      const clientKey =
        (process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY as string | undefined) ||
        (data?.clientKey as string | undefined);
      const snapScriptUrl =
        (data?.snapScriptUrl as string | undefined) || FALLBACK_SNAP_SCRIPT_URL;

      if (data?.provider) setCreatedProvider(data.provider);

      if (!token) {
        // Provider redirect-based (Mayar): tampilkan panel pembayaran dulu,
        // jangan langsung melempar pengguna keluar halaman.
        const paymentPageUrl = createdPaymentUrl ?? redirectUrl;
        if (createdPaymentUrl) {
          setPaymentUrl(createdPaymentUrl);
          toast({
            title: "Halaman pembayaran siap",
            description: `Selesaikan pembayaran lewat halaman ${providerLabel(
              data?.provider
            )}, lalu klik Cek Status Pembayaran.`,
          });
          await fetchOrder();
          return;
        }
        if (paymentPageUrl) {
          window.location.href = paymentPageUrl;
          return;
        }
        toast({
          variant: "destructive",
          title: "Pembayaran tidak tersedia",
          description: "Link pembayaran tidak diterima dari penyedia pembayaran.",
        });
        return;
      }

      if (clientKey) {
        try {
          await loadSnapScript(snapScriptUrl, clientKey);
        } catch {
          /* jatuh ke redirect_url di bawah */
        }
      }

      if (typeof window !== "undefined" && window.snap) {
        window.snap.pay(token, {
          onSuccess: () => {
            toast({
              title: "Pembayaran berhasil",
              description: "Kami sedang memverifikasi pembayaran Anda.",
            });
            void refreshStatus(true);
          },
          onPending: () => {
            toast({
              title: "Menunggu pembayaran",
              description:
                "Selesaikan pembayaran sesuai instruksi, lalu klik Cek Status Pembayaran.",
            });
            void refreshStatus(true);
          },
          onError: () => {
            toast({
              variant: "destructive",
              title: "Pembayaran gagal",
              description: "Transaksi tidak berhasil. Silakan coba lagi.",
            });
            void refreshStatus(true);
          },
          onClose: () => {
            toast({
              title: "Jendela pembayaran ditutup",
              description: "Anda bisa melanjutkan pembayaran kapan saja.",
            });
          },
        });
        return;
      }

      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      toast({
        variant: "destructive",
        title: "Pembayaran tidak tersedia",
        description: "Snap.js gagal dimuat dan redirect URL tidak tersedia.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Gagal memulai pembayaran",
        description: "Periksa koneksi Anda lalu coba lagi.",
      });
    } finally {
      setPaying(false);
    }
  }

  async function handleCancel() {
    if (!order) return;
    setCanceling(true);
    try {
      const res = await fetch(`/api/orders/${order.orderNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = (await res.json().catch(() => null)) as OrderCancelResponse | null;

      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "Gagal membatalkan pesanan",
          description: extractErrorMessage(
            data,
            "Pesanan tidak dapat dibatalkan saat ini."
          ),
        });
        return;
      }

      setCancelOpen(false);
      toast({
        title: "Pesanan dibatalkan",
        description:
          data?.message ?? "Pesanan berhasil dibatalkan dan stok dikembalikan.",
      });
      await fetchOrder();
    } catch {
      toast({
        variant: "destructive",
        title: "Gagal membatalkan pesanan",
        description: "Periksa koneksi Anda lalu coba lagi.",
      });
    } finally {
      setCanceling(false);
    }
  }

  /**
   * Masukkan satu item pesanan kembali ke keranjang.
   * weightGram diambil dari data produk bila tersedia, kalau tidak 0.
   */
  function pushItemToCart(item: OrderItemDetail, quantity: number) {
    addItem({
      id: item.variantId ? `${item.productId}-${item.variantId}` : item.productId,
      productId: item.productId,
      variantId: item.variantId ?? undefined,
      name: orderItemName(item),
      price: item.price,
      quantity,
      image: item.product?.images?.[0]?.url ?? undefined,
      weightGram: Number(item.product?.weightGram ?? 0) || 0,
      slug: item.product?.slug,
    });
  }

  /** 'Beli Lagi' per item: tambah ke keranjang lalu arahkan ke /cart. */
  function handleReorderItem(item: OrderItemDetail) {
    pushItemToCart(item, item.quantity);
    toast({
      title: "Ditambahkan ke keranjang",
      description: orderItemName(item),
    });
    router.push("/cart");
  }

  /** 'Beli Lagi' seluruh order: tambah semua item lalu arahkan ke /cart. */
  function handleReorderAll() {
    if (!order || order.items.length === 0) return;
    for (const item of order.items) {
      pushItemToCart(item, item.quantity);
    }
    toast({
      title: "Ditambahkan ke keranjang",
      description: `${order.items.length} item dari pesanan ${order.orderNumber} ditambahkan ke keranjang.`,
    });
    router.push("/cart");
  }

  /**
   * Dipanggil ReviewForm setelah ulasan berhasil dikirim. Toast-nya sudah
   * ditampilkan ReviewForm; di sini item ditandai "sudah diulas" supaya tidak
   * bisa submit dua kali dari halaman ini (state + sessionStorage).
   */
  function handleReviewSuccess(item: OrderItemDetail) {
    setReviewedProductIds((prev) => {
      const next = prev.includes(item.productId)
        ? prev
        : [...prev, item.productId];
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem(
            `jagofarm-reviewed-${orderNumber}`,
            JSON.stringify(next)
          );
        } catch {
          /* sessionStorage tidak tersedia: cukup state lokal */
        }
      }
      return next;
    });
    setReviewTarget(null);
    toast({
      title: "Ulasan berhasil dikirim",
      description: `Terima kasih! Ulasan untuk ${orderItemName(item)} sudah tayang.`,
    });
  }

  async function copyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: "Disalin", description: `${label} disalin ke clipboard.` });
    } catch {
      toast({
        variant: "destructive",
        title: "Gagal menyalin",
        description: "Salin nilainya secara manual.",
      });
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-container rounded w-1/3" />
          <div className="h-64 bg-surface-container rounded" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Order tidak ditemukan</h1>
        <Link href="/orders">
          <Button>Kembali ke Orders</Button>
        </Link>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex((s) => s.key === order.status);
  const canPay = order.status === "pending" && order.paymentStatus === "unpaid";
  const isPending = order.status === "pending";
  const isDelivered = order.status === "delivered";
  const canReorder =
    order.status !== "cancelled" &&
    order.status !== "expired" &&
    order.items.length > 0;
  const trackingInfo = getTrackingInfo(order.shippingCourier);

  const paymentProviderId = order.paymentProvider ?? createdProvider;
  const activePaymentUrl = paymentUrl ?? order.paymentUrl ?? null;
  /**
   * Panel pembayaran hosted hanya untuk provider redirect-based (Mayar).
   * Midtrans tetap memakai Snap.js lewat token, jadi tidak perlu panel ini.
   */
  const showPaymentPanel =
    isPending && Boolean(activePaymentUrl) && paymentProviderId !== "midtrans";

  const vaNumbers = paymentInfo?.vaNumbers ?? [];
  const hasPaymentInfo = Boolean(
    vaNumbers.length > 0 ||
      paymentInfo?.permataVaNumber ||
      paymentInfo?.billKey ||
      paymentInfo?.qrString ||
      paymentInfo?.store
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/orders" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <Icon name="arrow_back" size={16} className="mr-1" /> Kembali
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Badge className={statusColors[order.status]}>{order.status}</Badge>
      </div>

      {/* Status Timeline */}
      {order.status !== "cancelled" && order.status !== "expired" && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex justify-between">
              {statusSteps.map((step, i) => {
                const isActive = i <= currentStepIndex;
                return (
                  <div key={step.key} className="flex flex-col items-center text-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${isActive ? "bg-primary text-white" : "bg-surface-container text-gray-400"}`}>
                      <Icon name={step.icon} size={20} />
                    </div>
                    <span className={`text-xs ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}>{step.label}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Items */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Item Pesanan</CardTitle>
            </CardHeader>
            <CardContent>
              {order.items.map((item) => {
                const reviewed = reviewedProductIds.includes(item.productId);
                return (
                  <div key={item.id} className="flex flex-wrap justify-between gap-3 py-3 border-b last:border-0">
                    <div>
                      <p className="font-medium">{orderItemName(item)}</p>
                      {item.variant && <p className="text-sm text-muted-foreground">{item.variant.name}</p>}
                      <p className="text-sm text-muted-foreground">{item.quantity} x {formatPrice(item.price)}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {isDelivered && item.product ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={reviewed}
                            title={
                              reviewed
                                ? "Produk ini sudah Anda ulas dari pesanan ini"
                                : undefined
                            }
                            onClick={() => setReviewTarget(item)}
                          >
                            <Icon name="star" size={12} className="mr-1" />
                            {reviewed ? "Sudah Diulas" : "Tulis Ulasan"}
                          </Button>
                        ) : isDelivered ? null : (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled
                              title="Ulasan bisa ditulis setelah pesanan diterima (status Selesai)"
                            >
                              <Icon name="star" size={12} className="mr-1" /> Tulis Ulasan
                            </Button>
                            <span className="text-[11px] text-muted-foreground">
                              Aktif setelah pesanan Selesai
                            </span>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="accent"
                          onClick={() => handleReorderItem(item)}
                        >
                          <Icon name="shopping_cart" size={12} className="mr-1" /> Beli Lagi
                        </Button>
                      </div>
                    </div>
                    <p className="font-semibold">{formatPrice(item.total)}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alamat Pengiriman</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{order.shippingAddress.recipientName}</p>
              <p className="text-sm text-muted-foreground">{order.shippingAddress.phone}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {order.shippingAddress.detail && `${order.shippingAddress.detail}, `}
                {order.shippingAddress.district}, {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode}
              </p>
            </CardContent>
          </Card>

          {/* Payment instructions (VA / QRIS / gerai) */}
          {isPending && hasPaymentInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Info Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {paymentInfo?.paymentType && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Metode</span>
                    <span className="font-medium uppercase">{paymentInfo.paymentType}</span>
                  </div>
                )}
                {vaNumbers.map((va) => (
                  <div key={`${va.bank}-${va.va_number}`} className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-muted-foreground">VA {va.bank.toUpperCase()}</p>
                      <p className="font-mono font-medium">{va.va_number}</p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => void copyValue(va.va_number, `VA ${va.bank.toUpperCase()}`)}
                    >
                      <Icon name="content_copy" size={12} className="mr-1" /> Salin
                    </Button>
                  </div>
                ))}
                {paymentInfo?.permataVaNumber && (
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-muted-foreground">VA Permata</p>
                      <p className="font-mono font-medium">{paymentInfo.permataVaNumber}</p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => void copyValue(paymentInfo.permataVaNumber as string, "VA Permata")}
                    >
                      <Icon name="content_copy" size={12} className="mr-1" /> Salin
                    </Button>
                  </div>
                )}
                {(paymentInfo?.billerCode || paymentInfo?.billKey) && (
                  <div>
                    <p className="text-muted-foreground">Kode Pembayaran</p>
                    <p className="font-mono font-medium">
                      {paymentInfo?.billerCode} {paymentInfo?.billKey}
                    </p>
                  </div>
                )}
                {paymentInfo?.store && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gerai</span>
                    <span className="font-medium">{paymentInfo.store}</span>
                  </div>
                )}
                {paymentInfo?.qrString && (
                  <div>
                    <p className="text-muted-foreground">QRIS</p>
                    <p className="break-all font-mono text-xs">{paymentInfo.qrString}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Panel pembayaran provider redirect-based (mis. Mayar) */}
          {showPaymentPanel && activePaymentUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pembayaran Online</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Penyedia</span>
                  <span className="font-medium">
                    {providerLabel(paymentProviderId)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metode</span>
                  <span className="font-medium uppercase">
                    {order.paymentMethod || "Pilih di halaman pembayaran"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant={order.paymentStatus === "paid" ? "default" : "secondary"}
                  >
                    {order.paymentStatus}
                  </Badge>
                </div>
                <a
                  href={activePaymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <Icon name="open_in_new" size={16} />
                  Buka Halaman Pembayaran
                </a>
                <Button
                  className="w-full"
                  onClick={() => {
                    window.location.href = activePaymentUrl;
                  }}
                >
                  <Icon name="credit_card" size={16} className="mr-2" />
                  Lanjutkan ke Pembayaran
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => void refreshStatus(true)}
                  disabled={refreshing}
                >
                  <Icon name="refresh" size={16} />
                  Cek Status Pembayaran
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ongkir</span>
                <span>{formatPrice(order.shippingCost)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Diskon</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Penyedia</span>
                <span className="font-medium">
                  {providerLabel(paymentProviderId)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Metode</span>
                <span>{order.paymentMethod || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={order.paymentStatus === "paid" ? "default" : "secondary"}>
                  {order.paymentStatus}
                </Badge>
              </div>
              {order.paidAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dibayar</span>
                  <span>
                    {new Date(order.paidAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              {order.shippingCourier && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Kurir</span>
                  <span className="text-right">
                    {trackingInfo?.label ?? order.shippingCourier}
                    {order.shippingService ? ` - ${order.shippingService}` : ""}
                  </span>
                </div>
              )}
              {order.trackingNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resi</span>
                  <span className="font-mono">{order.trackingNumber}</span>
                </div>
              )}
              {order.trackingNumber && trackingInfo?.url && (
                <a
                  href={trackingInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <Icon name="local_shipping" size={16} />
                  Lacak paket di {trackingInfo.label}
                </a>
              )}
              {order.trackingNumber && trackingInfo && !trackingInfo.url && (
                <p className="text-xs text-muted-foreground">
                  Pelacakan otomatis untuk kurir {trackingInfo.label} belum
                  tersedia. Silakan lacak nomor resi di situs resmi kurir.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-2">
            {canReorder && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleReorderAll}
              >
                <Icon name="shopping_cart" size={16} className="mr-2" /> Beli Lagi Semua Item
              </Button>
            )}

            {canPay && (
              <Button className="w-full" onClick={() => void handlePay()} disabled={paying}>
                {paying ? (
                  <>
                    <Icon name="progress_activity" size={16} className="mr-2 animate-spin" /> Memproses...
                  </>
                ) : (
                  <>
                    <Icon name="credit_card" size={16} className="mr-2" /> Bayar Sekarang
                  </>
                )}
              </Button>
            )}

            {isPending && !showPaymentPanel && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => void refreshStatus(true)}
                disabled={refreshing}
              >
                <Icon name="refresh" size={16} />
                Cek Status Pembayaran
              </Button>
            )}

            {isPending && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setCancelOpen(true)}
                disabled={canceling}
              >
                <Icon name="cancel" size={16} className="mr-2" /> Batalkan Pesanan
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan pesanan?</DialogTitle>
            <DialogDescription>
              Pesanan {order.orderNumber} akan dibatalkan dan stok produk
              dikembalikan. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setCancelOpen(false)}
              disabled={canceling}
            >
              Tidak, kembali
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleCancel()}
              disabled={canceling}
            >
              {canceling ? (
                <>
                  <Icon name="progress_activity" size={16} className="mr-2 animate-spin" /> Membatalkan...
                </>
              ) : (
                "Ya, batalkan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Tulis Ulasan — hanya bisa dibuka untuk item order 'delivered'. */}
      <Dialog
        open={reviewTarget !== null}
        onOpenChange={(open) => {
          if (!open) setReviewTarget(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tulis Ulasan</DialogTitle>
            <DialogDescription>
              {reviewTarget
                ? `${orderItemName(reviewTarget)} — bagikan pengalaman Anda memakai produk ini.`
                : "Bagikan pengalaman Anda memakai produk ini."}
            </DialogDescription>
          </DialogHeader>
          {reviewTarget && (
            <ReviewForm
              productId={reviewTarget.productId}
              onSuccess={() => handleReviewSuccess(reviewTarget)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
