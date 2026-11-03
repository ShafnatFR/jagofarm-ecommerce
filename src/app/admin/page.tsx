"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Icon } from "@/components/ui/icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice, formatDate } from "@/lib/utils"
import { AdminRefreshButton } from "./admin-refresh"

interface Stats {
  revenue: number; orders: number; customers: number; avgOrderValue: number;
  totalRevenue?: number; totalOrders?: number; totalCustomers?: number;
  orderStatusCounts?: Record<string, number>;
}
interface DailyRevenuePoint {
  date: string; revenue: number; orders: number;
  pendingRevenue?: number; pendingOrders?: number;
  cancelledRevenue?: number; cancelledOrders?: number;
}
/** Seri bulanan hasil agregasi server (GET /api/admin/stats -> monthlyRevenue). */
interface MonthlyRevenuePoint {
  month: string; label: string; revenue: number; orders: number;
  pendingRevenue?: number; pendingOrders?: number;
  cancelledRevenue?: number; cancelledOrders?: number;
}
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
  // Warna status memakai keluarga palet induk (lime/leaf/forest), bukan
  // kuning-biru-indigo bawaan Tailwind, supaya grafik tetap satu nada hijau.
  pending: "bg-[#c9dc94] dark:bg-[#c9df91]",
  paid: "bg-primary",
  processing: "bg-[#66885d] dark:bg-[#b8ce8d]",
  shipped: "bg-[#245f43] dark:bg-[#3d9c6f]",
  delivered: "bg-primary",
  cancelled: "bg-destructive",
  expired: "bg-outline",
}

/* -------------------------------------------------------------------------- */
/* Grafik pendapatan bulanan — SVG/CSS buatan sendiri, tanpa dependensi baru   */
/* -------------------------------------------------------------------------- */

/** Tinggi area batang dalam piksel, dipakai menghitung tinggi tiap batang */
const BAR_AREA_HEIGHT = 150

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

interface DayBucket {
  key: string; label: string; fullLabel: string;
  done: number; doneOrders: number;
  pending: number; pendingOrders: number;
  cancelled: number; cancelledOrders: number;
}

interface HourlyRevenuePoint {
  hour: string; revenue: number; orders: number;
  pendingRevenue?: number; pendingOrders?: number;
  cancelledRevenue?: number; cancelledOrders?: number;
}

/** Kerangka 30 hari terakhir yang siap diisi data per-status. */
function emptyDayBuckets(days: number): { buckets: DayBucket[]; byKey: Map<string, DayBucket> } {
  const now = new Date()
  const buckets: DayBucket[] = []
  const byKey = new Map<string, DayBucket>()

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    const bucket: DayBucket = {
      key,
      label: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      fullLabel: d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
      done: 0, doneOrders: 0, pending: 0, pendingOrders: 0, cancelled: 0, cancelledOrders: 0,
    }
    buckets.push(bucket)
    byKey.set(key, bucket)
  }

  return { buckets, byKey }
}

/** Kerangka 24 slot jam terakhir yang siap diisi data per-status. */
function emptyHourBuckets(): { buckets: DayBucket[]; byKey: Map<string, DayBucket> } {
  const now = new Date()
  const buckets: DayBucket[] = []
  const byKey = new Map<string, DayBucket>()

  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60 * 60 * 1000)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}`
    const bucket: DayBucket = {
      key,
      label: `${String(d.getHours()).padStart(2, "0")}:00`,
      fullLabel: `${d.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} ${String(d.getHours()).padStart(2, "0")}:00`,
      done: 0, doneOrders: 0, pending: 0, pendingOrders: 0, cancelled: 0, cancelledOrders: 0,
    }
    buckets.push(bucket)
    byKey.set(key, bucket)
  }

  return { buckets, byKey }
}

/** Susun deret 24 jam dari hourlyRevenue API. Cocokkan via selisih jam utuh. */
function buildHourlySeries(points: HourlyRevenuePoint[] | undefined): DayBucket[] {
  const { buckets } = emptyHourBuckets()
  const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }

  // Batas tiap bucket dalam epoch-ms (tepi atas tiap jam lokal).
  const edges = buckets.map((b, i) => {
    void b
    const d = new Date(Date.now())
    d.setMinutes(0, 0, 0)
    return d.getTime() - (buckets.length - 1 - i) * 3_600_000
  })

  for (const point of points ?? []) {
    const t = new Date(String(point?.hour ?? "")).getTime()
    if (!Number.isFinite(t)) continue
    // Masukkan ke bucket yang tepinya paling dekat tapi tidak lebih awal.
    const idx = edges.findIndex((edge) => t <= edge + 3_600_000 && t > edge - 3_600_000)
    if (idx < 0) continue
    const bucket = buckets[idx]
    bucket.done += num(point.revenue)
    bucket.doneOrders += num(point.orders)
    bucket.pending += num(point.pendingRevenue)
    bucket.pendingOrders += num(point.pendingOrders)
    bucket.cancelled += num(point.cancelledRevenue)
    bucket.cancelledOrders += num(point.cancelledOrders)
  }

  return buckets
}

/** Susun deret harian 30 hari dari dailyRevenue API. */
function buildDailySeries(points: DailyRevenuePoint[] | undefined, days: number): DayBucket[] {
  const { buckets, byKey } = emptyDayBuckets(days)

  for (const point of points ?? []) {
    const raw = typeof point?.date === "string" ? point.date.slice(0, 10) : ""
    const bucket = byKey.get(raw)
    if (!bucket) continue
    const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
    bucket.done += num(point.revenue)
    bucket.doneOrders += num(point.orders)
    bucket.pending += num(point.pendingRevenue)
    bucket.pendingOrders += num(point.pendingOrders)
    bucket.cancelled += num(point.cancelledRevenue)
    bucket.cancelledOrders += num(point.cancelledOrders)
  }

  return buckets
}

/**
 * Grafik pendapatan 12 bulan / 30 hari / 24 jam, stacked 3 segmen per batang:
 * selesai (hijau) + menunggu (kuning) + batal (merah).
 */
/** Susun deret 12 bulan dari monthlyRevenue API (per-status). */
function buildMonthlyStackedSeries(points: MonthlyRevenuePoint[] | undefined): DayBucket[] {
  const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
  return (points ?? []).map((p) => ({
    key: String(p.month),
    // Label pendek ("Nov") + tahun biar 12 bulan tidak ambigu.
    label: `${String(p.label ?? "").slice(0, 3)} ${String(p.month ?? "").slice(2, 4)}`,
    fullLabel: `${p.label} ${String(p.month ?? "").slice(0, 4)}`,
    done: num(p.revenue),
    doneOrders: num(p.orders),
    pending: num(p.pendingRevenue),
    pendingOrders: num(p.pendingOrders),
    cancelled: num(p.cancelledRevenue),
    cancelledOrders: num(p.cancelledOrders),
  }))
}

function MonthlyRevenueChart({
  points,
  hourly,
  monthly,
  loading,
}: {
  points?: DailyRevenuePoint[]
  hourly?: HourlyRevenuePoint[]
  monthly?: MonthlyRevenuePoint[]
  loading: boolean
}) {
  const [mode, setMode] = useState<"12m" | "30d" | "24h">("12m")

  // 12 bulan: agregasi server monthlyRevenue (per-status).
  const monthlySeries = useMemo(() => buildMonthlyStackedSeries(monthly), [monthly])

  // 30 hari: agregasi dari dailyRevenue API (per-status).
  const dailySeries = useMemo(() => buildDailySeries(points, 30), [points])

  // 24 jam: dari hourlyRevenue API (per-status, 24 slot jam).
  const hourlySeries = useMemo(() => buildHourlySeries(hourly), [hourly])

  const series = mode === "12m" ? monthlySeries : mode === "24h" ? hourlySeries : dailySeries
  const periodLabel = mode === "12m" ? "12 bulan" : mode === "24h" ? "24 jam" : "30 hari"
  const total = series.reduce((s, b) => s + b.done + b.pending + b.cancelled, 0)
  const peak = series.reduce((m, b) => Math.max(m, b.done + b.pending + b.cancelled), 0)
  const hasData = peak > 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-on-surface-variant">
          Total {periodLabel} terakhir:{" "}
          <span className="font-semibold text-on-surface">{formatPrice(total)}</span>
        </p>
        <div className="flex gap-1 rounded-lg bg-surface-container-low p-1">
          {([["30d", "30 hari"], ["24h", "24 jam"]] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === value ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface-variant"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Selesai
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#c9a227]" /> Menunggu
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-destructive" /> Batal
        </span>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-low">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-variant border-t-transparent" />
            <p className="text-sm text-on-surface-variant">Memuat data pendapatan...</p>
          </div>
        </div>
      ) : !hasData ? (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-low">
          <div className="text-center">
            <Icon name="trending_up" size={40} className="mx-auto text-on-surface-variant/70" />
            <p className="mt-2 text-sm text-on-surface-variant">Belum ada pendapatan pada {mode === "24h" ? "24 jam" : "30 hari"} terakhir</p>
            <p className="text-xs text-on-surface-variant">Grafik akan terisi otomatis setelah ada pesanan masuk</p>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-end gap-1.5 sm:gap-2" style={{ height: `${BAR_AREA_HEIGHT + 46}px` }}>
            {series.map((bucket) => {
              const dayTotal = bucket.done + bucket.pending + bucket.cancelled
              const segs = [
                { value: bucket.done, cls: "bg-primary" },
                { value: bucket.pending, cls: "bg-[#c9a227]" },
                { value: bucket.cancelled, cls: "bg-destructive" },
              ]
              return (
                <div key={bucket.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[10px] font-medium text-on-surface-variant">
                    {dayTotal > 0 ? compactRupiah(dayTotal) : ""}
                  </span>
                  <div
                    className="flex w-full max-w-14 flex-col-reverse overflow-hidden rounded-t-md bg-surface-container"
                    style={{ height: `${dayTotal > 0 ? Math.max(4, Math.round((dayTotal / peak) * BAR_AREA_HEIGHT)) : 2}px` }}
                    title={`${bucket.fullLabel}: selesai ${formatPrice(bucket.done)} (${bucket.doneOrders}), menunggu ${formatPrice(bucket.pending)} (${bucket.pendingOrders}), batal ${formatPrice(bucket.cancelled)} (${bucket.cancelledOrders})`}
                  >
                    {segs.map((s, i) =>
                      s.value > 0 ? (
                        <div key={i} className={s.cls} style={{ flexGrow: s.value, flexBasis: 0 }} />
                      ) : null
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-on-surface-variant" title={bucket.fullLabel}>
                    {bucket.label}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-on-surface-variant">
            Angka di atas batang adalah total hari tersebut. Arahkan kursor ke batang untuk
            rincian selesai/menunggu/batal.
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
  const [hourlyHistory, setHourlyHistory] = useState<HourlyRevenuePoint[] | undefined>(undefined)
  const [monthlyHistory, setMonthlyHistory] = useState<MonthlyRevenuePoint[] | undefined>(undefined)
  const [historyLoading, setHistoryLoading] = useState(true)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setHistoryLoading(true)
    setError(null)
    const [summary, history] = await Promise.allSettled([
      fetch("/api/admin/stats").then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() }),
      fetch("/api/admin/stats?period=365").then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() }),
    ])
    if (summary.status === "fulfilled") setData(summary.value)
    else setError(summary.reason instanceof Error ? summary.reason.message : String(summary.reason))
    if (history.status === "fulfilled") {
      setRevenueHistory(Array.isArray(history.value?.dailyRevenue) ? history.value.dailyRevenue : [])
      setHourlyHistory(Array.isArray(history.value?.hourlyRevenue) ? history.value.hourlyRevenue : [])
      setMonthlyHistory(Array.isArray(history.value?.monthlyRevenue) ? history.value.monthlyRevenue : [])
    } else {
      setRevenueHistory([])
      setHourlyHistory([])
      setMonthlyHistory([])
    }
    setLoading(false)
    setHistoryLoading(false)
  }, [])

  useEffect(() => {
    // Fetch both dashboard ranges together so local refresh has one loading boundary.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount updates the page loading state.
    void fetchDashboard()
  }, [fetchDashboard])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-40 rounded bg-surface-container" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-lg bg-surface-container" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-80 rounded-lg bg-surface-container" />
          <div className="h-80 rounded-lg bg-surface-container" />
        </div>
        <div className="h-64 rounded-lg bg-surface-container" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Icon name="info" size={40} className="mx-auto text-destructive/80" />
          <p className="mt-2 text-sm text-on-surface-variant">Gagal memuat data: {error || "Unknown error"}</p>
          <button onClick={() => void fetchDashboard()} className="mt-2 text-sm text-primary underline">Coba lagi</button>
        </div>
      </div>
    )
  }

  const stats = [
    { title: "Total Pendapatan", value: data.stats.totalRevenue ?? data.stats.revenue ?? 0, icon: "attach_money", format: "price" as const, trend: "up" as const, change: "" },
    { title: "Total Pesanan", value: data.stats.totalOrders ?? data.stats.orders ?? 0, icon: "shopping_cart", format: "number" as const, trend: "up" as const, change: "" },
    { title: "Pelanggan", value: data.stats.totalCustomers ?? data.stats.customers ?? 0, icon: "people", format: "number" as const, trend: "up" as const, change: "" },
    { title: "Rata-rata Pesanan", value: data.stats.avgOrderValue ?? 0, icon: "trending_up", format: "price" as const, trend: "up" as const, change: "" },
  ]

  const statusCounts = data.stats.orderStatusCounts ?? {}
  const breakdown: StatusBreakdown[] = Array.isArray(data.orderStatusBreakdown) && data.orderStatusBreakdown.length > 0
    ? data.orderStatusBreakdown
    : Object.entries(statusCounts).map(([status, count]) => ({ status, count: count as number, color: colorMap[status] || "bg-surface-container-low0" }))

  const totalBreakdown = breakdown.reduce((s, o) => s + o.count, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Dashboard</h1>
          <p className="text-sm text-on-surface-variant">Ringkasan performa toko Anda</p>
        </div>
        <AdminRefreshButton endpointPrefixes={["/api/admin/stats"]} onRefresh={fetchDashboard} loading={loading} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Icon name={stat.icon} size={20} />
                </div>
                {stat.change && (
                  <div className={`flex items-center gap-1 text-sm ${stat.trend === "up" ? "text-primary" : "text-destructive"}`}>
                    {stat.trend === "up" ? <Icon name="open_in_new" size={16} /> : <Icon name="south_west" size={16} />}
                    {stat.change}
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-on-surface">
                  {stat.format === "price" ? formatPrice(stat.value) : stat.value.toLocaleString("id-ID")}
                </p>
                <p className="text-sm text-on-surface-variant">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Pendapatan Bulanan</CardTitle></CardHeader>
          <CardContent>
            <MonthlyRevenueChart points={revenueHistory} hourly={hourlyHistory} monthly={monthlyHistory} loading={historyLoading} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Status Pesanan</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {breakdown.length === 0 && <p className="text-sm text-on-surface-variant">Belum ada data</p>}
            {breakdown.map((item) => {
              const pct = totalBreakdown > 0 ? Math.round((item.count / totalBreakdown) * 100) : 0
              return (
                <div key={item.status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{statusConfig[item.status]?.label || item.status}</span>
                    <span className="text-on-surface-variant">{item.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-low">
                    <div className={`h-full rounded-full ${colorMap[item.status] || "bg-outline"}`} style={{ width: `${pct}%` }} />
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
          <Link href="/admin/orders" className="text-sm font-medium text-primary hover:underline">Lihat Semua →</Link>
        </CardHeader>
        <CardContent>
          {data.recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-on-surface-variant">Belum ada pesanan</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-on-surface-variant">
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
                      <tr key={order.id} className={i % 2 === 0 ? "bg-surface" : "bg-surface-container-low/50"}>
                        <td className="py-3 font-mono text-xs font-medium">{order.orderNumber || order.id}</td>
                        <td className="py-3">{order.customer || order.user?.name || order.user?.email || "-"}</td>
                        <td className="py-3 text-on-surface-variant">{orderDate ? formatDate(orderDate) : "-"}</td>
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
