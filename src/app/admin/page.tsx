"use client"

import { motion } from "framer-motion"
import { DollarSign, ShoppingCart, Users, TrendingUp, ArrowUpRight, ArrowDownRight, Package } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice, formatDate } from "@/lib/utils"

const stats = [
  {
    title: "Total Pendapatan",
    value: 128_500_000,
    change: "+12.5%",
    trend: "up" as const,
    icon: DollarSign,
    format: "price" as const,
  },
  {
    title: "Total Pesanan",
    value: 342,
    change: "+8.2%",
    trend: "up" as const,
    icon: ShoppingCart,
    format: "number" as const,
  },
  {
    title: "Pelanggan",
    value: 1250,
    change: "+3.1%",
    trend: "up" as const,
    icon: Users,
    format: "number" as const,
  },
  {
    title: "Rata-rata Pesanan",
    value: 375_730,
    change: "-2.4%",
    trend: "down" as const,
    icon: TrendingUp,
    format: "price" as const,
  },
]

const recentOrders = [
  { id: "JF260918ABC123", customer: "Budi Santoso", total: 1_250_000, status: "PAID", date: "2026-09-18" },
  { id: "JF260917DEF456", customer: "Siti Rahma", total: 850_000, status: "PENDING", date: "2026-09-17" },
  { id: "JF260916GHI789", customer: "Ahmad Fauzi", total: 2_100_000, status: "SHIPPED", date: "2026-09-16" },
  { id: "JF260915JKL012", customer: "Dewi Lestari", total: 475_000, status: "DELIVERED", date: "2026-09-15" },
  { id: "JF260914MNO345", customer: "Rizky Pratama", total: 3_500_000, status: "CANCELLED", date: "2026-09-14" },
]

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  PAID: { label: "Dibayar", variant: "success" },
  PENDING: { label: "Menunggu", variant: "warning" },
  SHIPPED: { label: "Dikirim", variant: "default" },
  DELIVERED: { label: "Selesai", variant: "success" },
  CANCELLED: { label: "Dibatalkan", variant: "destructive" },
}

const orderStatusBreakdown = [
  { status: "PAID", count: 45, color: "bg-green-500" },
  { status: "PENDING", count: 23, color: "bg-yellow-500" },
  { status: "SHIPPED", count: 31, color: "bg-blue-500" },
  { status: "DELIVERED", count: 198, color: "bg-emerald-500" },
  { status: "CANCELLED", count: 12, color: "bg-red-500" },
]

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Ringkasan performa toko Anda</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-[#1B4D3E]/10 p-2">
                    <stat.icon className="h-5 w-5 text-[#1B4D3E]" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${stat.trend === "up" ? "text-green-600" : "text-red-500"}`}>
                    {stat.trend === "up" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {stat.change}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.format === "price" ? formatPrice(stat.value) : stat.value.toLocaleString("id-ID")}
                  </p>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Chart Placeholder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Pendapatan Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
              <div className="text-center">
                <TrendingUp className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-2 text-sm text-gray-400">Grafik pendapatan akan ditampilkan di sini</p>
                <p className="text-xs text-gray-300">Integrasikan Chart.js atau Recharts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Pesanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderStatusBreakdown.map((item) => {
              const total = orderStatusBreakdown.reduce((s, o) => s + o.count, 0)
              const pct = Math.round((item.count / total) * 100)
              return (
                <div key={item.status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{statusConfig[item.status]?.label || item.status}</span>
                    <span className="text-gray-500">{item.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Pesanan Terbaru</CardTitle>
          <a href="/admin/orders" className="text-sm font-medium text-[#1B4D3E] hover:underline">
            Lihat Semua →
          </a>
        </CardHeader>
        <CardContent>
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
                {recentOrders.map((order, i) => (
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
        </CardContent>
      </Card>
    </div>
  )
}
