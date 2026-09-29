"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Icon } from "@/components/ui/icon";
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { formatPrice, formatDate } from "@/lib/utils"

/** Pesan error yang aman ditampilkan di UI (unknown -> string). */
function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Bentuk mentah pesanan dari GET /api/admin/orders. */
interface OrderApiItem {
  id: string; orderNumber: string;
  createdAt?: string | null; date?: string | null;
  user?: { name?: string | null; email?: string | null } | null;
  customer?: string | null; email?: string | null;
  items?: unknown[] | number | null;
  total?: number | string | null;
  status?: string | null; paymentStatus?: string | null;
  trackingNumber?: string | null;
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

interface Order {
  id: string
  orderNumber: string
  date: string
  customer: string
  email: string
  items: number
  total: number
  status: string
  paymentStatus: string
  trackingNumber: string | null
}

const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  pending: { label: "Menunggu", variant: "warning" },
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
  refunded: { label: "Dikembalikan", variant: "secondary" },
  failed: { label: "Gagal", variant: "destructive" },
}

/** Tangga status normal — dipakai untuk menyusun opsi "Ubah Status". */
const STATUS_LADDER: OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered"]

/** Opsi status yang boleh dipilih dari status saat ini (mengikuti aturan API). */
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

export default function OrdersPage() {
  const { toast } = useToast()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [busyId, setBusyId] = useState<string | null>(null)

  // dialog input resi
  const [resiOpen, setResiOpen] = useState(false)
  const [resiOrder, setResiOrder] = useState<Order | null>(null)
  const [resiValue, setResiValue] = useState("")
  const [resiCourier, setResiCourier] = useState("")
  const [resiEtd, setResiEtd] = useState("")
  const [resiSaving, setResiSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter)
    params.set("page", String(page))
    params.set("limit", "20")

    try {
      const res = await fetch(`/api/admin/orders?${params}`, { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const list = (data.orders || []).map((o: OrderApiItem) => ({
        id: o.id || o.orderNumber,
        orderNumber: o.orderNumber || o.id,
        date: o.createdAt || o.date || "",
        customer: o.user?.name || o.customer || "-",
        email: o.user?.email || o.email || "",
        items: Array.isArray(o.items) ? o.items.length : (o.items ?? 0),
        total: Number(o.total ?? 0),
        status: String(o.status || "pending").toLowerCase(),
        paymentStatus: String(o.paymentStatus || "unpaid").toLowerCase(),
        trackingNumber: o.trackingNumber ?? null,
      }))
      setOrders(list)
      setTotal(Number(data.pagination?.total ?? list.length))
      setTotalPages(Math.max(1, Number(data.pagination?.totalPages ?? 1)))
      setError(null)
    } catch (e) {
      setError(toMessage(e))
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page])

  useEffect(() => {
    const timer = setTimeout(fetchData, 300)
    return () => clearTimeout(timer)
  }, [fetchData])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset nomor halaman saat filter berubah (disengaja, bukan nilai turunan render)
    setPage(1)
  }, [search, statusFilter])

  const patchOrder = useCallback(
    async (orderId: string, payload: Record<string, unknown>) => {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Gagal memperbarui pesanan (HTTP ${res.status})`)
      return data
    },
    []
  )

  const handleStatusChange = async (order: Order, status: OrderStatus) => {
    setBusyId(order.id)
    try {
      await patchOrder(order.id, { status })
      toast({
        title: "Status diperbarui",
        description: `Pesanan ${order.orderNumber} → ${statusConfig[status]?.label || status}.`,
      })
      await fetchData()
    } catch (e) {
      toast({
        title: "Gagal mengubah status",
        description: toMessage(e),
        variant: "destructive",
      })
    } finally {
      setBusyId(null)
    }
  }

  const openResiDialog = (order: Order) => {
    setResiOrder(order)
    setResiValue(order.trackingNumber || "")
    setResiCourier("")
    setResiEtd("")
    setResiOpen(true)
  }

  const handleResiSubmit = async () => {
    if (!resiOrder) return
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

      await patchOrder(resiOrder.id, payload)
      toast({
        title: "Resi tersimpan",
        description: `Pesanan ${resiOrder.orderNumber} ditandai dikirim dengan resi ${resiValue.trim()}.`,
      })
      setResiOpen(false)
      setResiOrder(null)
      await fetchData()
    } catch (e) {
      toast({
        title: "Gagal menyimpan resi",
        description: toMessage(e),
        variant: "destructive",
      })
    } finally {
      setResiSaving(false)
    }
  }

  if (loading && orders.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-40 rounded bg-gray-200" />
        <div className="h-16 rounded-lg bg-gray-200" />
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded bg-gray-200" />)}</div>
      </div>
    )
  }

  if (error && orders.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Icon name="info" size={40} className="mx-auto text-red-400" />
          <p className="mt-2 text-sm text-gray-600">Gagal memuat pesanan: {error}</p>
          <button onClick={() => location.reload()} className="mt-2 text-sm text-[#1B4D3E] underline">Coba lagi</button>
        </div>
      </div>
    )
  }

  const firstRow = orders.length === 0 ? 0 : (page - 1) * 20 + 1
  const lastRow = (page - 1) * 20 + orders.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pesanan</h1>
        <p className="text-sm text-gray-500">{total} pesanan total</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Cari no. pesanan atau pelanggan..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Menunggu</SelectItem>
              <SelectItem value="paid">Dibayar</SelectItem>
              <SelectItem value="processing">Diproses</SelectItem>
              <SelectItem value="shipped">Dikirim</SelectItem>
              <SelectItem value="delivered">Selesai</SelectItem>
              <SelectItem value="cancelled">Dibatalkan</SelectItem>
              <SelectItem value="expired">Kedaluwarsa</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Icon name="search" size={40} className="mx-auto text-gray-300" />
              <p className="mt-2">Tidak ada pesanan ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/80 text-left text-gray-500">
                    <th className="px-4 py-3 font-medium">No. Pesanan</th>
                    <th className="px-4 py-3 font-medium">Tanggal</th>
                    <th className="px-4 py-3 font-medium">Pelanggan</th>
                    <th className="px-4 py-3 font-medium text-center">Item</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Pembayaran</th>
                    <th className="px-4 py-3 font-medium">Resi</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, i) => {
                    const options = nextStatuses(order.status)
                    const status = statusConfig[order.status]
                    const payment = paymentConfig[order.paymentStatus]
                    return (
                      <tr key={order.id} className={busyId === order.id ? "bg-[#1B4D3E]/5" : i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                        <td className="px-4 py-3 font-mono text-xs font-medium">{order.orderNumber}</td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(order.date)}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{order.customer}</p>
                          <p className="text-xs text-gray-400">{order.email}</p>
                        </td>
                        <td className="px-4 py-3 text-center">{order.items}</td>
                        <td className="px-4 py-3 font-medium">{formatPrice(order.total)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={payment?.variant || "secondary"}>
                            {payment?.label || order.paymentStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {order.trackingNumber ? (
                            <span className="font-mono text-xs text-gray-600">{order.trackingNumber}</span>
                          ) : (
                            <span className="text-xs text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={status?.variant || "default"}>
                            {status?.label || order.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Input Resi"
                              onClick={() => openResiDialog(order)}
                            >
                              <Icon name="local_shipping" size={16} className="mr-1" /> Resi
                            </Button>
                            <Link href={`/admin/orders/${order.id}`}>
                              <Button variant="ghost" size="sm" title="Detail">
                                <Icon name="visibility" size={16} className="mr-1" /> Detail
                              </Button>
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" title="Ubah status / aksi lain">
                                  <Icon name="more_vert" size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel>Ubah Status</DropdownMenuLabel>
                                {options.length === 0 ? (
                                  <DropdownMenuItem disabled>
                                    Status sudah final
                                  </DropdownMenuItem>
                                ) : (
                                  options.map((option) => (
                                    <DropdownMenuItem
                                      key={option}
                                      onClick={() => handleStatusChange(order, option)}
                                    >
                                      {statusConfig[option]?.label || option}
                                    </DropdownMenuItem>
                                  ))
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/orders/${order.id}`} className="cursor-pointer">
                                    <Icon name="description" size={16} className="mr-2" /> Detail Pesanan
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openResiDialog(order)}>
                                  <Icon name="local_shipping" size={16} className="mr-2" /> Input Resi
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {orders.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row">
              <p className="text-xs text-gray-500">
                Menampilkan {firstRow}–{lastRow} dari {total} pesanan
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <Icon name="chevron_left" size={16} className="mr-1" /> Sebelumnya
                </Button>
                <span className="text-xs text-gray-500">
                  Halaman {page} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Berikutnya <Icon name="chevron_right" size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={resiOpen} onOpenChange={(open) => { setResiOpen(open); if (!open) setResiOrder(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Input Resi Pengiriman</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Pesanan <span className="font-mono font-medium">{resiOrder?.orderNumber}</span>
              {resiOrder?.customer ? ` — ${resiOrder.customer}` : ""}
            </p>
            <Input
              label="Nomor Resi"
              placeholder="Contoh: JX1234567890"
              value={resiValue}
              onChange={(e) => setResiValue(e.target.value)}
            />
            <Input
              label="Kurir (opsional)"
              placeholder="JNE / J&T / SiCepat"
              value={resiCourier}
              onChange={(e) => setResiCourier(e.target.value)}
            />
            <Input
              label="Estimasi Kirim / ETD (opsional)"
              placeholder="Contoh: 2-3 hari"
              value={resiEtd}
              onChange={(e) => setResiEtd(e.target.value)}
            />
            <p className="rounded-lg bg-[#1B4D3E]/5 p-3 text-xs text-gray-600">
              Menyimpan resi akan mengisi tanggal kirim dan menaikkan status pesanan ke
              &quot;Dikirim&quot; bila statusnya masih Menunggu atau Diproses.
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setResiOpen(false)}>Batal</Button>
            <Button onClick={handleResiSubmit} disabled={resiSaving}>
              {resiSaving ? "Menyimpan..." : "Simpan Resi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
