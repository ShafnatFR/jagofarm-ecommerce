"use client"

import { useEffect, useState } from "react"
import { DollarSign, ShoppingCart, Users, TrendingUp, ArrowUpRight, ArrowDownRight, Package, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice, formatDate } from "@/lib/utils"

interface Stats {
  revenue: number; orders: number; customers: number; avgOrderValue: number
}
interface RecentOrder { id: string; customer: string; total: number; status: string; date: string }
interface StatusBreakdown { status: string; count: number; color: string }
interface DashboardData {
  stats: Stats; recentOrders: RecentOrder[]; orderStatusBreakdown: StatusBreakdown[]
}

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  PAID: { label: "Dibayar", variant: "success" },
  PENDING: { label: "Menunggu", variant: "warning" },
  SHIPPED: { label: "Dikirim", variant: "default" },
  DELIVERED: { label: "Selesai", variant: "success" },
  CANCELLED: { label: "Dibatalkan", variant: "destructive" },
}

const colorMap: Record<string, string> = {
  PAID: "bg-green-500", PENDING: "bg-yellow-500", SHIPPED: "bg-blue-500",
  DELIVERED: "bg-emerald-500", CANCELLED: "bg-red-500",
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-40 rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-lg bg-gray-200" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-80 rounded-lg bg-gray-200" />
          <div className="h-80 rounded-lg bg-gray-200" />
        </div>
        <div className="h-64 rounded-lg bg-gray-200" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
          <p className="mt-2 text-sm text-gray-600">Gagal memuat data: {error || "Unknown error"}</p>
          <button onClick={() => location.reload()} className="mt-2 text-sm text-[#1B4D3E] underline">Coba lagi</button>
        </div>
      </div>
    )
  }

  const stats = [
    { title: "Total Pendapatan", value: data.stats.revenue, icon: DollarSign, format: "price" as const, trend: "up" as const, change: "" },
    { title: "Total Pesanan", value: data.stats.orders, icon: ShoppingCart, format: "number" as const, trend: "up" as const, change: "" },
    { title: "Pelanggan", value: data.stats.customers, icon: Users, format: "number" as const, trend: "up" as const, change: "" },
    { title: "Rata-rata Pesanan", value: data.stats.avgOrderValue, icon: TrendingUp, format: "price" as const, trend: "up" as const, change: "" },
  ]

  const totalBreakdown = data.orderStatusBreakdown.reduce((s, o) => s + o.count, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Ringkasan performa toko Anda</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-[#1B4D3E]/10 p-2">
                  <stat.icon className="h-5 w-5 text-[#1B4D3E]" />
                </div>
                {stat.change && (
                  <div className={`flex items-center gap-1 text-sm ${stat.trend === "up" ? "text-green-600" : "text-red-500"}`}>
                    {stat.trend === "up" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {stat.change}
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">
                  {stat.format === "price" ? formatPrice(stat.value) : stat.value.toLocaleString("id-ID")}
                </p>
                <p className="text-sm text-gray-500">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Pendapatan Bulanan</CardTitle></CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
              <div className="text-center">
                <TrendingUp className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-2 text-sm text-gray-400">Grafik pendapatan akan ditampilkan di sini</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Status Pesanan</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {data.orderStatusBreakdown.length === 0 && <p className="text-sm text-gray-400">Belum ada data</p>}
            {data.orderStatusBreakdown.map((item) => {
              const pct = totalBreakdown > 0 ? Math.round((item.count / totalBreakdown) * 100) : 0
              return (
                <div key={item.status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{statusConfig[item.status]?.label || item.status}</span>
                    <span className="text-gray-500">{item.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className={`h-full rounded-full ${colorMap[item.status] || "bg-gray-400"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Pesanan Terbaru</CardTitle>
          <a href="/admin/orders" className="text-sm font-medium text-[#1B4D3E] hover:underline">Lihat Semua →</a>
        </CardHeader>
        <CardContent>
          {data.recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">Belum ada pesanan</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 font-medium">No. Pesanan</th>
                    <th className="pb-3 font-medium">Pelanggan</th>
                    <th className="pb-3 font-medium">Tanggal</th>
                    <th className="pb-3 font-medium">Total</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order, i) => (
                    <tr key={order.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="py-3 font-mono text-xs font-medium">{order.id}</td>
                      <td className="py-3">{order.customer}</td>
                      <td className="py-3 text-gray-500">{formatDate(order.date)}</td>
                      <td className="py-3 font-medium">{formatPrice(order.total)}</td>
                      <td className="py-3">
                        <Badge variant={statusConfig[order.status]?.variant || "default"}>
                          {statusConfig[order.status]?.label || order.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
