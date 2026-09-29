"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { DollarSign, ShoppingCart, Users, TrendingUp, ArrowUpRight, ArrowDownRight, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice, formatDate } from "@/lib/utils"

interface Stats {
  revenue: number; orders: number; customers: number; avgOrderValue: number;
  totalRevenue?: number; totalOrders?: number; totalCustomers?: number;
  orderStatusCounts?: Record<string, number>;
}
interface DailyRevenuePoint { date: string; revenue: number; orders: number }
/** Seri bulanan hasil agregasi server (GET /api/admin/stats -> monthlyRevenue). */
interface MonthlyRevenuePoint { month: string; label: string; revenue: number; orders: number }
interface RecentOrder {
  id: string; orderNumber?: string; customer?: string; total: number; status: string;
  date?: string; createdAt?: string; user?: { name?: string | null; email?: string | null } | null;
}
interface StatusBreakdown { status: string; count: number; color: string }
interface DashboardData {
  stats: Stats; recentOrders: RecentOrder[]; orderStatusBreakdown?: StatusBreakdown[];
  dailyRevenue?: DailyRevenuePoint[];
  monthlyRevenue?: MonthlyRevenuePoint[];
}

// Nilai enum Prisma OrderStatus semuanya lowercase (pending, paid, processing,
// shipped, delivered, cancelled, expired) — kunci di bawah ini harus lowercase
// juga, kalau tidak label status jatuh ke nilai mentah.
const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  pending: { label: "Menunggu", variant: "warning" },
  paid: { label: "Dibayar", variant: "success" },
  processing: { label: "Diproses", variant: "default" },
  shipped: { label: "Dikirim", variant: "default" },
  delivered: { label: "Selesai", variant: "success" },
  cancelled: { label: "Dibatalkan", variant: "destructive" },
  expired: { label: "Kedaluwarsa", variant: "secondary" },
}

const colorMap: Record<string, string> = {
  pending: "bg-yellow-500",
  paid: "bg-green-500",
  processing: "bg-blue-500",
  shipped: "bg-indigo-500",
  delivered: "bg-emerald-500",
  cancelled: "bg-red-500",
  expired: "bg-gray-400",
}

/* -------------------------------------------------------------------------- */
/* Grafik pendapatan bulanan — SVG/CSS buatan sendiri, tanpa dependensi baru   */
/* -------------------------------------------------------------------------- */

/** Tinggi area batang dalam piksel, dipakai menghitung tinggi tiap batang */
const BAR_AREA_HEIGHT = 150

function monthLabel(year: number, month: number, style: "short" | "long") {
  const d = new Date(year, month, 1)
  return style === "short"
    ? d.toLocaleDateString("id-ID", { month: "short" })
    : d.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
}

function compactRupiah(value: number) {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value)
  } catch {
    return `Rp ${Math.round(value / 1000)} rb`
  }
}

interface MonthBucket { key: string; label: string; fullLabel: string; revenue: number; orders: number }

/** Kerangka N bulan terakhir (termasuk bulan ini) yang siap diisi data. */
function emptyMonthBuckets(months: number): { buckets: MonthBucket[]; byKey: Map<string, MonthBucket> } {
  const now = new Date()
  const buckets: MonthBucket[] = []
  const byKey = new Map<string, MonthBucket>()

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth()
    const bucket: MonthBucket = {
      key: `${year}-${String(month + 1).padStart(2, "0")}`,
      label: monthLabel(year, month, "short"),
      fullLabel: monthLabel(year, month, "long"),
      revenue: 0,
      orders: 0,
    }
    buckets.push(bucket)
    byKey.set(bucket.key, bucket)
  }

  return { buckets, byKey }
}

/**
 * Susun deret pendapatan bulanan dari data HARIAN yang dikirim endpoint stats
 * (`dailyRevenue`), dibatasi N bulan terakhir. Dipakai sebagai fallback kalau
 * server belum mengirim `monthlyRevenue`.
 */
function buildMonthlySeries(points: DailyRevenuePoint[] | undefined, months: number): MonthBucket[] {
  const { buckets, byKey } = emptyMonthBuckets(months)

  for (const point of points ?? []) {
    const key = String(point?.date ?? "").slice(0, 7) // "YYYY-MM"
    const bucket = byKey.get(key)
    if (!bucket) continue
    const revenue = Number(point.revenue)
    const orders = Number(point.orders)
    bucket.revenue += Number.isFinite(revenue) ? revenue : 0
    bucket.orders += Number.isFinite(orders) ? orders : 0
  }

  return buckets
}

/**
 * Pakai seri bulanan hasil agregasi SERVER (`monthlyRevenue`) bila tersedia.
 * Mengembalikan null kalau field itu tidak ada/kosong supaya pemanggil jatuh
 * kembali ke agregasi lama dari `dailyRevenue`.
 */
function buildMonthlySeriesFromServer(
  points: MonthlyRevenuePoint[] | undefined,
  months: number
): MonthBucket[] | null {
  if (!points || points.length === 0) return null

  const { buckets, byKey } = emptyMonthBuckets(months)
  let matched = false

  for (const point of points) {
    const key = String(point?.month ?? "").slice(0, 7) // "YYYY-MM"
    const bucket = byKey.get(key)
    if (!bucket) continue
    matched = true
    const revenue = Number(point.revenue)
    const orders = Number(point.orders)
    bucket.revenue += Number.isFinite(revenue) ? revenue : 0
    bucket.orders += Number.isFinite(orders) ? orders : 0
  }

  return matched ? buckets : null
}

function MonthlyRevenueChart({
  points,
  monthly,
  loading,
}: {
  points?: DailyRevenuePoint[]
  monthly?: MonthlyRevenuePoint[]
  loading: boolean
}) {
  const [months, setMonths] = useState(6)

  // Prioritaskan agregasi server; fallback ke dailyRevenue (perilaku lama).
  const series = useMemo(
    () => buildMonthlySeriesFromServer(monthly, months) ?? buildMonthlySeries(points, months),
    [monthly, points, months]
  )
  const total = series.reduce((sum, bucket) => sum + bucket.revenue, 0)
  const peak = series.reduce((max, bucket) => Math.max(max, bucket.revenue), 0)
  const hasData = peak > 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          Total {months} bulan terakhir:{" "}
          <span className="font-semibold text-gray-800">{formatPrice(total)}</span>
        </p>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {[6, 12].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMonths(option)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                months === option ? "bg-white text-[#1B4D3E] shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {option} bulan
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1B4D3E] border-t-transparent" />
            <p className="text-sm text-gray-400">Memuat data pendapatan...</p>
          </div>
        </div>
      ) : !hasData ? (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
          <div className="text-center">
            <TrendingUp className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">Belum ada pendapatan pada {months} bulan terakhir</p>
            <p className="text-xs text-gray-400">Grafik akan terisi otomatis setelah ada pesanan masuk</p>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-end gap-1.5 sm:gap-2" style={{ height: `${BAR_AREA_HEIGHT + 46}px` }}>
            {series.map((bucket) => {
              const height = bucket.revenue > 0 ? Math.max(4, Math.round((bucket.revenue / peak) * BAR_AREA_HEIGHT)) : 2
              return (
                <div key={bucket.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[10px] font-medium text-gray-500">
                    {bucket.revenue > 0 ? compactRupiah(bucket.revenue) : ""}
                  </span>
                  <div
                    className={`w-full max-w-14 rounded-t-md transition-colors ${
                      bucket.revenue > 0 ? "bg-[#1B4D3E]/80 hover:bg-[#1B4D3E]" : "bg-gray-200"
                    }`}
                    style={{ height: `${height}px` }}
                    title={`${bucket.fullLabel}: ${formatPrice(bucket.revenue)} dari ${bucket.orders} pesanan`}
                  />
                  <span className="text-[11px] font-medium text-gray-500" title={bucket.fullLabel}>
                    {bucket.label}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-gray-400">
            Angka di atas batang adalah pendapatan bulan tersebut. Arahkan kursor ke batang untuk
            detail lengkap (bulan, rupiah, jumlah pesanan).
          </p>
        </div>
      )}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revenueHistory, setRevenueHistory] = useState<DailyRevenuePoint[] | undefined>(undefined)
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenuePoint[] | undefined>(undefined)
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // Data pendapatan 12 bulan untuk grafik bulanan (KPI tetap memakai periode default).
  // `monthlyRevenue` (agregasi server) diprioritaskan; `dailyRevenue` disimpan
  // sebagai fallback kalau field baru belum tersedia.
  useEffect(() => {
    fetch("/api/admin/stats?period=365")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((res) => {
        const monthly = Array.isArray(res?.monthlyRevenue) ? res.monthlyRevenue : []
        setMonthlyRevenue(monthly.length > 0 ? monthly : undefined)
        setRevenueHistory(Array.isArray(res?.dailyRevenue) ? res.dailyRevenue : [])
      })
      .catch(() => { setMonthlyRevenue(undefined); setRevenueHistory([]) })
      .finally(() => setHistoryLoading(false))
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
    { title: "Total Pendapatan", value: data.stats.totalRevenue ?? data.stats.revenue ?? 0, icon: DollarSign, format: "price" as const, trend: "up" as const, change: "" },
    { title: "Total Pesanan", value: data.stats.totalOrders ?? data.stats.orders ?? 0, icon: ShoppingCart, format: "number" as const, trend: "up" as const, change: "" },
    { title: "Pelanggan", value: data.stats.totalCustomers ?? data.stats.customers ?? 0, icon: Users, format: "number" as const, trend: "up" as const, change: "" },
    { title: "Rata-rata Pesanan", value: data.stats.avgOrderValue ?? 0, icon: TrendingUp, format: "price" as const, trend: "up" as const, change: "" },
  ]

  const statusCounts = data.stats.orderStatusCounts ?? {}
  const breakdown: StatusBreakdown[] = Array.isArray(data.orderStatusBreakdown) && data.orderStatusBreakdown.length > 0
    ? data.orderStatusBreakdown
    : Object.entries(statusCounts).map(([status, count]) => ({ status, count: count as number, color: colorMap[status] || "bg-gray-500" }))

  const totalBreakdown = breakdown.reduce((s, o) => s + o.count, 0)

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
            <MonthlyRevenueChart points={revenueHistory} monthly={monthlyRevenue} loading={historyLoading} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Status Pesanan</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {breakdown.length === 0 && <p className="text-sm text-gray-400">Belum ada data</p>}
            {breakdown.map((item) => {
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
          <Link href="/admin/orders" className="text-sm font-medium text-[#1B4D3E] hover:underline">Lihat Semua →</Link>
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
                  {data.recentOrders.map((order, i) => {
                    const orderDate = order.date || order.createdAt
                    return (
                      <tr key={order.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                        <td className="py-3 font-mono text-xs font-medium">{order.orderNumber || order.id}</td>
                        <td className="py-3">{order.customer || order.user?.name || order.user?.email || "-"}</td>
                        <td className="py-3 text-gray-500">{orderDate ? formatDate(orderDate) : "-"}</td>
                        <td className="py-3 font-medium">{formatPrice(order.total)}</td>
                        <td className="py-3">
                          <Badge variant={statusConfig[order.status]?.variant || "default"}>
                            {statusConfig[order.status]?.label || order.status}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
