"use client"

import { useCallback, useEffect, useState } from "react"
import { Icon } from "@/components/ui/icon";
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { formatPrice, formatDate, formatDateTime } from "@/lib/utils"

/** Pesan error yang aman ditampilkan di UI (unknown -> string). */
function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Bentuk mentah pelanggan dari GET /api/admin/customers. */
interface CustomerApiItem {
  id: string;
  name?: string | null; email?: string | null; phone?: string | null;
  orderCount?: number; ordersCount?: number;
  _count?: { orders?: number } | null;
  totalSpent?: number | null;
  createdAt?: string | null; joinedAt?: string | null;
  lastOrderAt?: string | null; lastOrder?: string | null;
}

type BadgeVariant = "default" | "success" | "warning" | "destructive" | "secondary"

interface Customer {
  id: string; name: string; email: string; phone: string
  ordersCount: number; totalSpent: number; joinedAt: string | null; lastOrder: string | null
}

interface Address {
  id: string; label: string; recipientName: string; phone: string
  province: string; city: string; district: string; postalCode: string
  detail: string | null; isDefault: boolean
}

interface RecentOrder {
  id: string; orderNumber: string; status: string; paymentStatus: string
  paymentMethod: string | null; total: number; trackingNumber: string | null
  createdAt: string; itemCount: number
}

interface CustomerDetail {
  id: string; name: string | null; email: string; phone: string | null; image: string | null
  role: string; createdAt: string; updatedAt: string
  addresses: Address[]
  summary: {
    orderCount: number
    reviewCount: number
    totalSpent: number
    lastOrderAt: string | null
    recentOrders: RecentOrder[]
  }
}

const orderStatusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
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

export default function CustomersPage() {
  const { toast } = useToast()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detail, setDetail] = useState<CustomerDetail | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    try {
      const r = await fetch(`/api/admin/customers?${params}`, { cache: "no-store" })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const d = await r.json()
      setCustomers(
        (d.customers || []).map((c: CustomerApiItem) => ({
          id: c.id,
          name: c.name || "-",
          email: c.email || "-",
          phone: c.phone || "-",
          ordersCount: c.orderCount ?? c._count?.orders ?? c.ordersCount ?? 0,
          totalSpent: Number(c.totalSpent ?? 0),
          joinedAt: c.createdAt ?? c.joinedAt ?? null,
          lastOrder: c.lastOrderAt ?? c.lastOrder ?? null,
        }))
      )
      setError(null)
    } catch (e) {
      setError(toMessage(e))
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(fetchData, 300)
    return () => clearTimeout(timer)
  }, [fetchData])

  const openDetail = async (customer: Customer) => {
    setDetailOpen(true)
    setDetail(null)
    setDetailError(null)
    setDetailLoading(true)
    try {
      const r = await fetch(`/api/admin/customers/${customer.id}`, { cache: "no-store" })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`)
      setDetail(data.customer)
    } catch (e) {
      const message = toMessage(e)
      setDetailError(message)
      toast({
        title: "Gagal memuat detail pelanggan",
        description: message,
        variant: "destructive",
      })
    } finally {
      setDetailLoading(false)
    }
  }

  if (loading && customers.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-40 rounded bg-surface-container" />
        <div className="h-16 rounded-lg bg-surface-container" />
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded bg-surface-container" />)}</div>
      </div>
    )
  }

  if (error && customers.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Icon name="info" size={40} className="mx-auto text-red-400" />
          <p className="mt-2 text-sm text-on-surface-variant">Gagal memuat pelanggan: {error}</p>
          <button onClick={() => location.reload()} className="mt-2 text-sm text-[#1B4D3E] underline">Coba lagi</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Pelanggan</h1>
        <p className="text-sm text-on-surface-variant">{customers.length} pelanggan terdaftar</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Cari nama, email, atau telepon..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {customers.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Icon name="search" size={40} className="mx-auto text-gray-300" />
              <p className="mt-2">Tidak ada pelanggan ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-surface-container-low/80 text-left text-on-surface-variant">
                    <th className="px-4 py-3 font-medium">Pelanggan</th>
                    <th className="px-4 py-3 font-medium">Kontak</th>
                    <th className="px-4 py-3 text-center font-medium">Pesanan</th>
                    <th className="px-4 py-3 font-medium">Total Belanja</th>
                    <th className="px-4 py-3 font-medium">Bergabung</th>
                    <th className="px-4 py-3 font-medium">Terakhir Order</th>
                    <th className="px-4 py-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, i) => (
                    <tr key={customer.id} className={i % 2 === 0 ? "bg-white" : "bg-surface-container-low/50"}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1B4D3E]/10 text-sm font-bold text-[#1B4D3E]">
                            {customer.name.charAt(0)}
                          </div>
                          <p className="font-medium">{customer.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1.5 text-on-surface-variant"><Icon name="mail" size={12} /> {customer.email}</span>
                          <span className="flex items-center gap-1.5 text-gray-400"><Icon name="call" size={12} /> {customer.phone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center"><Badge variant="secondary">{customer.ordersCount}</Badge></td>
                      <td className="px-4 py-3 font-medium text-[#1B4D3E]">{formatPrice(customer.totalSpent)}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{customer.joinedAt ? formatDate(customer.joinedAt) : "-"}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{customer.lastOrder ? formatDate(customer.lastOrder) : "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Detail pelanggan"
                          onClick={() => openDetail(customer)}
                        >
                          <Icon name="visibility" size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={(open) => { setDetailOpen(open); if (!open) setDetail(null) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Pelanggan</DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex h-40 items-center justify-center gap-2 text-sm text-on-surface-variant">
              <Icon name="progress_activity" size={16} className="animate-spin" /> Memuat detail pelanggan...
            </div>
          ) : detailError || !detail ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
              <Icon name="info" size={32} className="text-red-400" />
              <p className="text-sm text-on-surface-variant">{detailError || "Detail pelanggan tidak tersedia."}</p>
            </div>
          ) : (
            <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
              {/* Profil + ringkasan */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1B4D3E]/10 text-lg font-bold text-[#1B4D3E]">
                  {(detail.name || detail.email).charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-on-surface">{detail.name || "-"}</p>
                  <p className="text-xs text-on-surface-variant">{detail.email}</p>
                  <p className="text-xs text-gray-400">
                    {detail.phone || "Telepon belum diisi"} • Bergabung{" "}
                    {detail.createdAt ? formatDate(detail.createdAt) : "-"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-on-surface-variant">Jumlah Pesanan</p>
                  <p className="text-lg font-bold text-on-surface">{detail.summary.orderCount}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-on-surface-variant">Total Belanja</p>
                  <p className="text-lg font-bold text-[#1B4D3E]">{formatPrice(detail.summary.totalSpent)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-on-surface-variant">Order Terakhir</p>
                  <p className="text-sm font-medium text-on-surface-variant">
                    {detail.summary.lastOrderAt ? formatDateTime(detail.summary.lastOrderAt) : "-"}
                  </p>
                </div>
              </div>

              {/* Alamat */}
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-on-surface">
                  <Icon name="location_on" size={16} className="text-[#1B4D3E]" /> Daftar Alamat ({detail.addresses.length})
                </p>
                {detail.addresses.length === 0 ? (
                  <p className="text-xs text-gray-400">Belum ada alamat tersimpan.</p>
                ) : (
                  <div className="space-y-2">
                    {detail.addresses.map((address) => (
                      <div key={address.id} className="rounded-lg border p-3 text-xs text-on-surface-variant">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-on-surface">{address.label}</span>
                          {address.isDefault && <Badge variant="success">Utama</Badge>}
                        </div>
                        <p className="mt-1 font-medium text-on-surface">
                          {address.recipientName} • {address.phone}
                        </p>
                        <p>
                          {address.detail ? `${address.detail}, ` : ""}
                          {address.district}, {address.city}, {address.province} {address.postalCode}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order terakhir */}
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-on-surface">
                  <Icon name="shopping_cart" size={16} className="text-[#1B4D3E]" /> Order Terakhir
                </p>
                {detail.summary.recentOrders.length === 0 ? (
                  <p className="text-xs text-gray-400">Belum ada pesanan.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-surface-container-low/80 text-left text-on-surface-variant">
                          <th className="px-3 py-2 font-medium">No. Pesanan</th>
                          <th className="px-3 py-2 font-medium">Tanggal</th>
                          <th className="px-3 py-2 text-center font-medium">Item</th>
                          <th className="px-3 py-2 font-medium text-right">Total</th>
                          <th className="px-3 py-2 font-medium">Status</th>
                          <th className="px-3 py-2 font-medium">Bayar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.summary.recentOrders.map((order) => (
                          <tr key={order.id} className="border-t">
                            <td className="px-3 py-2 font-mono">{order.orderNumber}</td>
                            <td className="px-3 py-2 text-on-surface-variant">{formatDate(order.createdAt)}</td>
                            <td className="px-3 py-2 text-center">{order.itemCount}</td>
                            <td className="px-3 py-2 text-right font-medium">{formatPrice(order.total)}</td>
                            <td className="px-3 py-2">
                              <Badge variant={orderStatusConfig[order.status]?.variant || "default"}>
                                {orderStatusConfig[order.status]?.label || order.status}
                              </Badge>
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant={paymentConfig[order.paymentStatus]?.variant || "secondary"}>
                                {paymentConfig[order.paymentStatus]?.label || order.paymentStatus}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
