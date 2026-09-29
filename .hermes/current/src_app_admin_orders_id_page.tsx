"use client"

import { use, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  AlertCircle,
  Package,
  Truck,
  StickyNote,
  Clock,
  User as UserIcon,
  MapPin,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { formatPrice, formatDateTime } from "@/lib/utils"

/** Pesan error yang aman ditampilkan di UI (unknown -> string). */
function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "expired"

type BadgeVariant = "default" | "success" | "warning" | "destructive" | "secondary"

interface OrderItemDetail {
  id: string
  quantity: number
  price: number
  total: number
  productName: string | null
  variantName: string | null
  productImage: string | null
}

interface OrderDetail {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  paymentMethod: string | null
  shippingCourier: string | null
  shippingService: string | null
  shippingEtd: string | null
  trackingNumber: string | null
  subtotal: number
  discount: number
  shippingCost: number
  total: number
  notes: string | null
  createdAt: string
  paidAt: string | null
  shippedAt: string | null
  deliveredAt: string | null
  user: { id: string; name: string | null; email: string; phone: string | null } | null
  shippingAddress: {
    id: string
    label: string
    recipientName: string
    phone: string
    province: string
    city: string
    district: string
    postalCode: string
    detail: string | null
  } | null
  items: OrderItemDetail[]
}

const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  pending: { label: "Menunggu Pembayaran", variant: "warning" },
  paid: { label: "Dibayar", variant: "success" },
  processing: { label: "Diproses", variant: "default" },
  shipped: { label: "Dikirim", variant: "default" },
  delivered: { label: "Selesai", variant: "success" },
  cancelled: { label: "Dibatalkan", variant: "destructive" },
  expired: { label: "Kedaluwarsa", variant: "destructive" },
}

const paymentConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  unpaid: { label: "Belum Dibayar", variant: "warning" },
  paid: { label: "Lunas", variant: "success" },
  refunded: { label: "Dana Dikembalikan", variant: "secondary" },
  failed: { label: "Pembayaran Gagal", variant: "destructive" },
}

const STATUS_LADDER: OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered"]

function nextStatuses(current: string): OrderStatus[] {
  const status = current.toLowerCase() as OrderStatus
  if (status === "cancelled" || status === "expired" || status === "delivered") return []

  const index = STATUS_LADDER.indexOf(status)
  if (index === -1) return []

  const forward = STATUS_LADDER.slice(index + 1).filter(
    (candidate) => candidate !== "delivered" || status === "shipped"
  )

  return [...forward, "cancelled", "expired"]
}

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { toast } = useToast()

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusDraft, setStatusDraft] = useState("")
  const [statusSaving, setStatusSaving] = useState(false)
  const [resiValue, setResiValue] = useState("")
  const [resiCourier, setResiCourier] = useState("")
  const [resiEtd, setResiEtd] = useState("")
  const [resiSaving, setResiSaving] = useState(false)
  const [notesDraft, setNotesDraft] = useState("")
  const [notesSaving, setNotesSaving] = useState(false)

  const fetchOrder = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      const loaded: OrderDetail = data.order
      setOrder(loaded)
      setResiValue(loaded.trackingNumber || "")
      setResiCourier(loaded.shippingCourier || "")
      setResiEtd(loaded.shippingEtd || "")
      setNotesDraft(loaded.notes || "")
      setError(null)
    } catch (e) {
      setError(toMessage(e))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pola fetch-saat-mount detail pesanan admin; setState ada di dalam fetchOrder()
    fetchOrder()
  }, [fetchOrder])

  const patchOrder = async (payload: Record<string, unknown>, successTitle: string) => {
    const res = await fetch(`/api/admin/orders/${order?.id ?? id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
    toast({ title: successTitle, description: data?.message || "Perubahan tersimpan." })
    await fetchOrder()
    return data
  }

  const handleStatusSave = async () => {
    if (!statusDraft) {
      toast({
        title: "Pilih status terlebih dahulu",
        description: "Tentukan status baru untuk pesanan ini.",
        variant: "destructive",
      })
      return
    }
    setStatusSaving(true)
    try {
      await patchOrder({ status: statusDraft }, "Status pesanan diperbarui")
      setStatusDraft("")
    } catch (e) {
      toast({ title: "Gagal mengubah status", description: toMessage(e), variant: "destructive" })
    } finally {
      setStatusSaving(false)
    }
  }

  const handleResiSave = async () => {
    if (!resiValue.trim()) {
      toast({
        title: "Nomor resi wajib diisi",
        description: "Masukkan nomor resi dari kurir sebelum menyimpan.",
        variant: "destructive",
      })
      return
    }
    setResiSaving(true)
    try {
      const payload: Record<string, unknown> = { trackingNumber: resiValue.trim() }
      if (resiCourier.trim()) payload.shippingCourier = resiCourier.trim()
      if (resiEtd.trim()) payload.shippingEtd = resiEtd.trim()
      await patchOrder(payload, "Resi pengiriman tersimpan")
    } catch (e) {
      toast({ title: "Gagal menyimpan resi", description: toMessage(e), variant: "destructive" })
    } finally {
      setResiSaving(false)
    }
  }

  const handleNotesSave = async () => {
    setNotesSaving(true)
    try {
      await patchOrder({ notes: notesDraft }, "Catatan internal tersimpan")
    } catch (e) {
      toast({ title: "Gagal menyimpan catatan", description: toMessage(e), variant: "destructive" })
    } finally {
      setNotesSaving(false)
    }
  }

  if (loading && !order) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100" />)}
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-sm text-gray-600">{error || "Pesanan tidak ditemukan"}</p>
        <Link href="/admin/orders"><Button variant="secondary">Kembali ke daftar pesanan</Button></Link>
      </div>
    )
  }

  const status = statusConfig[order.status] ?? { label: order.status, variant: "default" as BadgeVariant }
  const payment = paymentConfig[order.paymentStatus] ?? {
    label: order.paymentStatus,
    variant: "secondary" as BadgeVariant,
  }
  const options = nextStatuses(order.status)
  const address = order.shippingAddress
  const timeline = [
    { label: "Pesanan dibuat", value: order.createdAt },
    { label: "Pembayaran diterima", value: order.paidAt },
    { label: "Paket dikirim", value: order.shippedAt },
    { label: "Paket diterima", value: order.deliveredAt },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="font-mono text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
            <p className="text-sm text-gray-500">Dibuat {formatDateTime(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status.variant}>{status.label}</Badge>
          <Badge variant={payment.variant}>{payment.label}</Badge>
          <Button variant="secondary" size="sm" onClick={fetchOrder} disabled={loading}>
            <RefreshCw className="mr-1 h-4 w-4" /> Muat ulang
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Kiri: item + ringkasan pembayaran */}
        <div className="space-y-6 lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader><CardTitle className="text-lg">Item Pesanan</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50/80 text-left text-gray-500">
                        <th className="px-4 py-3 font-medium">Produk</th>
                        <th className="px-4 py-3 font-medium text-center">Qty</th>
                        <th className="px-4 py-3 font-medium text-right">Harga</th>
                        <th className="px-4 py-3 font-medium text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, i) => (
                        <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                {item.productImage ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={item.productImage}
                                    alt={item.productName || "Produk"}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                                    <Package className="h-5 w-5" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{item.productName || "Produk"}</p>
                                {item.variantName && (
                                  <p className="text-xs text-gray-400">Varian: {item.variantName}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">{formatPrice(item.price)}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatPrice(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-2 border-t p-4 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Diskon</span><span>-{formatPrice(order.discount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Ongkos Kirim{order.shippingService ? ` (${order.shippingService})` : ""}</span>
                    <span>{formatPrice(order.shippingCost)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-base font-bold text-[#1B4D3E]">
                    <span>Total</span><span>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-4 w-4 text-[#1B4D3E]" /> Riwayat Waktu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  {timeline.map((step) => (
                    <li key={step.label} className="flex items-start gap-3">
                      <span
                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${step.value ? "bg-[#1B4D3E]" : "bg-gray-200"}`}
                      />
                      <div>
                        <p className={`text-sm font-medium ${step.value ? "text-gray-900" : "text-gray-400"}`}>
                          {step.label}
                        </p>
                        <p className="text-xs text-gray-400">
                          {step.value ? formatDateTime(step.value) : "Belum terjadi"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <StickyNote className="h-4 w-4 text-[#1B4D3E]" /> Catatan Internal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  className="flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E]"
                  placeholder="Catatan untuk tim gudang / CS..."
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                />
                <Button onClick={handleNotesSave} disabled={notesSaving}>
                  {notesSaving ? "Menyimpan..." : "Simpan Catatan"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Kanan: panel aksi + pelanggan */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader><CardTitle className="text-lg">Panel Aksi</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ubah Status</label>
                  {options.length === 0 ? (
                    <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
                      Status pesanan ini sudah final dan tidak dapat diubah lagi.
                    </p>
                  ) : (
                    <div className="flex gap-2">
                      <Select value={statusDraft} onValueChange={setStatusDraft}>
                        <SelectTrigger><SelectValue placeholder="Pilih status baru" /></SelectTrigger>
                        <SelectContent>
                          {options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {statusConfig[option]?.label || option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={handleStatusSave} disabled={statusSaving}>
                        {statusSaving ? "..." : "Simpan"}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-t pt-4">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Truck className="h-4 w-4" /> Input Resi
                  </label>
                  <Input
                    placeholder="Nomor resi"
                    value={resiValue}
                    onChange={(e) => setResiValue(e.target.value)}
                  />
                  <Input
                    placeholder="Kurir (opsional)"
                    value={resiCourier}
                    onChange={(e) => setResiCourier(e.target.value)}
                  />
                  <Input
                    placeholder="Estimasi kirim / ETD (opsional)"
                    value={resiEtd}
                    onChange={(e) => setResiEtd(e.target.value)}
                  />
                  <Button variant="secondary" onClick={handleResiSave} disabled={resiSaving} className="w-full">
                    {resiSaving ? "Menyimpan..." : "Simpan Resi"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserIcon className="h-4 w-4 text-[#1B4D3E]" /> Pelanggan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-medium text-gray-900">{order.user?.name || "-"}</p>
                <p className="text-gray-500">{order.user?.email || "-"}</p>
                <p className="text-gray-500">{order.user?.phone || "Telepon belum diisi"}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-4 w-4 text-[#1B4D3E]" /> Alamat Pengiriman
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {address ? (
                  <>
                    <p className="font-medium text-gray-900">{address.recipientName}</p>
                    <p className="text-gray-500">{address.phone}</p>
                    <p className="text-gray-500">
                      {address.detail ? `${address.detail}, ` : ""}
                      {address.district}, {address.city}, {address.province} {address.postalCode}
                    </p>
                    <p className="pt-1 text-xs text-gray-400">Label: {address.label}</p>
                  </>
                ) : (
                  <p className="text-gray-400">Alamat pengiriman tidak tersedia.</p>
                )}
                <div className="mt-3 space-y-1 border-t pt-3 text-xs text-gray-500">
                  <p>Kurir: {order.shippingCourier || "-"}</p>
                  <p>Layanan: {order.shippingService || "-"}</p>
                  <p>Resi: {order.trackingNumber || "-"}</p>
                  <p>ETD: {order.shippingEtd || "-"}</p>
                  <p>Metode Bayar: {order.paymentMethod || "-"}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
