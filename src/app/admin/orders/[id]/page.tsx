"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, MapPin, CreditCard, Truck, CheckCircle2, Clock, Package, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatPrice, formatDate, formatDateTime } from "@/lib/utils"

const mockOrder = {
  id: "JF260918ABC123",
  date: "2026-09-18T14:30:00",
  status: "PAID",
  customer: {
    name: "Budi Santoso",
    email: "budi.santoso@mail.com",
    phone: "081234567890",
  },
  shippingAddress: {
    label: "Rumah",
    address: "Jl. Sudirman No. 45, RT 02/RW 05",
    city: "Jakarta Selatan",
    province: "DKI Jakarta",
    postalCode: "12190",
  },
  items: [
    { id: "1", name: "Kit Hidroponik NFT 6 Lubang", price: 750_000, quantity: 1, image: "/images/products/hidroponik-nft.jpg" },
    { id: "2", name: "Pupuk AB Mix Hidroponik 1 Liter", price: 45_000, quantity: 2, image: "/images/products/ab-mix.jpg" },
    { id: "3", name: "Benih Lele Sangkuriang 100 Ekor", price: 65_000, quantity: 3, image: "/images/products/benih-lele.jpg" },
  ],
  payment: {
    method: "Bank Transfer — BCA",
    proof: "/images/payments/bca-transfer.jpg",
    paidAt: "2026-09-18T15:10:00",
  },
  shipping: {
    courier: "JNE",
    service: "REG",
    trackingNumber: "",
    cost: 25_000,
  },
  subtotal: 1_035_000,
  shippingCost: 25_000,
  total: 1_060_000,
  notes: "Tolong packing dengan bubble wrap ya",
}

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive"; icon: typeof Clock }> = {
  PENDING: { label: "Menunggu Pembayaran", variant: "warning", icon: Clock },
  PAID: { label: "Sudah Dibayar", variant: "success", icon: CreditCard },
  PROCESSING: { label: "Diproses", variant: "default", icon: Package },
  SHIPPED: { label: "Dikirim", variant: "default", icon: Truck },
  DELIVERED: { label: "Selesai", variant: "success", icon: CheckCircle2 },
  CANCELLED: { label: "Dibatalkan", variant: "destructive", icon: XCircle },
}

const timeline = [
  { status: "PENDING", date: "2026-09-18T14:30:00", label: "Pesanan dibuat" },
  { status: "PAID", date: "2026-09-18T15:10:00", label: "Pembayaran dikonfirmasi" },
]

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [orderStatus, setOrderStatus] = useState(mockOrder.status)
  const [trackingNumber, setTrackingNumber] = useState(mockOrder.shipping.trackingNumber)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch order by id
    setLoading(false)
  }, [id])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1B4D3E] border-t-transparent" />
      </div>
    )
  }

  const sc = statusConfig[orderStatus] || statusConfig.PENDING

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pesanan #{id}</h1>
            <p className="text-sm text-gray-500">{formatDateTime(mockOrder.date)}</p>
          </div>
        </div>
        <Badge variant={sc.variant} className="text-sm">{sc.label}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Items */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Item Pesanan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="pb-3 font-medium">Produk</th>
                        <th className="pb-3 text-right font-medium">Harga</th>
                        <th className="pb-3 text-center font-medium">Qty</th>
                        <th className="pb-3 text-right font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockOrder.items.map((item) => (
                        <tr key={item.id} className="border-b last:border-0">
                          <td className="py-3 font-medium">{item.name}</td>
                          <td className="py-3 text-right text-gray-600">{formatPrice(item.price)}</td>
                          <td className="py-3 text-center">{item.quantity}</td>
                          <td className="py-3 text-right font-medium">{formatPrice(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t">
                        <td colSpan={3} className="py-2 text-gray-500">Subtotal</td>
                        <td className="py-2 text-right font-medium">{formatPrice(mockOrder.subtotal)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="py-2 text-gray-500">Ongkir ({mockOrder.shipping.courier} {mockOrder.shipping.service})</td>
                        <td className="py-2 text-right font-medium">{formatPrice(mockOrder.shippingCost)}</td>
                      </tr>
                      <tr className="border-t">
                        <td colSpan={3} className="py-3 text-lg font-bold">Total</td>
                        <td className="py-3 text-right text-lg font-bold text-[#1B4D3E]">{formatPrice(mockOrder.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status Timeline */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status Pesanan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  {timeline.map((step, i) => {
                    const isLast = i === timeline.length - 1
                    return (
                      <div key={step.status} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isLast ? "bg-[#1B4D3E] text-white" : "bg-gray-200 text-gray-500"}`}>
                            {(() => {
                              const Icon = statusConfig[step.status]?.icon || Clock
                              return <Icon className="h-4 w-4" />
                            })()}
                          </div>
                          {!isLast && <div className="h-full w-px bg-gray-200" />}
                        </div>
                        <div className="pb-6">
                          <p className="font-medium">{step.label}</p>
                          <p className="text-xs text-gray-400">{formatDateTime(step.date)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Update Status */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Update Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Status</label>
                  <Select value={orderStatus} onValueChange={setOrderStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Menunggu</SelectItem>
                      <SelectItem value="PAID">Dibayar</SelectItem>
                      <SelectItem value="PROCESSING">Diproses</SelectItem>
                      <SelectItem value="SHIPPED">Dikirim</SelectItem>
                      <SelectItem value="DELIVERED">Selesai</SelectItem>
                      <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  label="No. Resi"
                  placeholder="Masukkan nomor resi..."
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
                <Button className="w-full">Simpan Perubahan</Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Customer Info */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pelanggan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{mockOrder.customer.name}</p>
                  <p className="text-sm text-gray-500">{mockOrder.customer.email}</p>
                  <p className="text-sm text-gray-500">{mockOrder.customer.phone}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Shipping Address */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-4 w-4" />
                  Alamat Pengiriman
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{mockOrder.shippingAddress.label}</p>
                <p className="text-sm text-gray-600">{mockOrder.shippingAddress.address}</p>
                <p className="text-sm text-gray-600">
                  {mockOrder.shippingAddress.city}, {mockOrder.shippingAddress.province} {mockOrder.shippingAddress.postalCode}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-4 w-4" />
                  Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-gray-400">Metode</p>
                  <p className="text-sm font-medium">{mockOrder.payment.method}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Dibayar pada</p>
                  <p className="text-sm">{formatDateTime(mockOrder.payment.paidAt)}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notes */}
          {mockOrder.notes && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Catatan</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 italic">&ldquo;{mockOrder.notes}&rdquo;</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
