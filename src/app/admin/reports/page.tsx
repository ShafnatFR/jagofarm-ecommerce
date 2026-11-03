"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Icon } from "@/components/ui/icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { formatPrice } from "@/lib/utils"
import { AdminRefreshButton } from "../admin-refresh"

type GroupBy = "day" | "month"
type Preset = "today" | "7d" | "30d" | "month"

interface ReportPeriod {
  key: string
  label: string
  revenue: number
  orders: number
  items: number
  paid: number
  pending: number
  cancelled: number
}

interface StatusSlice {
  status: string
  label: string
  count: number
  color: string
}

interface OrderListRow {
  orderNumber: string
  createdAt: string
  status: string
  paymentStatus: string
  total: number
  items: number
}

interface CategoryRow {
  categoryId: string
  categoryName: string
  revenue: number
  orders: number
  items: number
}

interface TopProductRow {
  productId: string
  name: string
  qty: number
  revenue: number
}

interface StockRow {
  id: string
  name: string
  slug: string
  stock: number
  variantCount: number
}

interface StockReport {
  threshold: number
  totalProducts: number
  outOfStockCount: number
  lowStockCount: number
  outOfStock: StockRow[]
  lowStock: StockRow[]
}

interface TopCustomerRow {
  userId: string | null
  name: string
  email: string
  totalSpent: number
  orderCount: number
}

interface CustomerReport {
  totalCustomers: number
  newCustomers: number
  topCustomers: TopCustomerRow[]
}

interface ReportResponse {
  range: {
    from: string
    to: string
    groupBy: GroupBy
    categoryId: string | null
    timezone: string
    inclusive: boolean
  }
  definition: string
  summary: {
    totalRevenue: number
    totalOrders: number
    totalOrdersAll: number
    totalItems: number
    averageOrderValue: number
  }
  series: ReportPeriod[]
  statusBreakdown: StatusSlice[]
  orderList: OrderListRow[]
  categoryBreakdown: CategoryRow[]
  topProducts: TopProductRow[]
  stockReport?: StockReport
  customerReport?: CustomerReport
}

/** Tinggi area batang dalam piksel. */
const REPORT_BAR_HEIGHT = 180

/** Palet kategori (maks 10) — hijau dominan + aksen. */
const CATEGORY_HEX = [
  "#1a7a4a", "#245f43", "#66885d", "#c9a227",
  "#2f7d62", "#8ab17d", "#3d9c6f", "#b8ce8d",
  "#1d4e3b", "#d4a017",
]

/** Bar chart vertikal STACKED per status: hijau=lunas, kuning=menunggu, merah=batal. */
function RevenueBarChart({ rows }: { rows: ReportPeriod[] }) {
  const peak = rows.reduce((m, r) => Math.max(m, r.orders), 0)
  const view = rows.length > 31 ? rows.slice(-31) : rows
  const segsOf = (row: ReportPeriod) => [
    { value: row.paid ?? 0, cls: "bg-primary" },
    { value: row.pending ?? 0, cls: "bg-[#c9a227]" },
    { value: row.cancelled ?? 0, cls: "bg-destructive" },
  ]
  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant mb-2">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Lunas</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#c9a227]" /> Menunggu</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-destructive" /> Batal</span>
      </div>
      <div className="flex items-end gap-1" style={{ height: `${REPORT_BAR_HEIGHT + 46}px` }}>
        {view.map((row) => {
          const total = (row.paid ?? 0) + (row.pending ?? 0) + (row.cancelled ?? 0)
          const h = total > 0 ? Math.max(6, Math.round((total / (peak || 1)) * REPORT_BAR_HEIGHT)) : 2
          return (
            <div key={row.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[10px] font-medium text-on-surface-variant">
                {total > 0 ? total : ""}
              </span>
              <div
                className="flex w-full flex-col-reverse overflow-hidden rounded-t-md bg-surface-container"
                style={{ height: `${h}px` }}
                title={`${row.label}: ${row.orders} order (${formatPrice(row.revenue)})`}
              >
                {segsOf(row).map((sg, i) =>
                  sg.value > 0 ? (
                    <div key={i} className={sg.cls} style={{ flexGrow: sg.value, flexBasis: 0 }} />
                  ) : null
                )}
              </div>
              <span className="text-[11px] font-medium text-on-surface-variant" title={row.key}>
                {row.label}
              </span>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-on-surface-variant">
        Tinggi batang = jumlah order; warna = status. Arahkan kursor untuk rincian.
      </p>
    </div>
  )
}

/** Pie SVG komposisi status order. */
function StatusPieChart({ rows }: { rows: StatusSlice[] }) {
  const total = rows.reduce((sum, r) => sum + r.count, 0)
  const colors: Record<string, string> = { green: "#1a7a4a", yellow: "#c9a227", red: "#dc2626" }
  if (total <= 0) {
    return <p className="py-8 text-center text-sm text-on-surface-variant">Belum ada order pada periode ini</p>
  }
  const segs = rows.reduce(
    (acc: { row: StatusSlice; pct: number; dasharray: string; dashoffset: number }[], row) => {
      const pct = total > 0 ? (row.count / total) * 100 : 0
      const prev = acc.length > 0 ? acc[acc.length - 1] : null
      const dashoffset = prev ? prev.dashoffset - prev.pct : 25
      return [...acc, { row, pct, dasharray: `${pct} ${100 - pct}`, dashoffset }]
    },
    []
  )
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <svg viewBox="0 0 42 42" className="h-44 w-44 shrink-0" role="img" aria-label="Komposisi status order">
        <circle cx="21" cy="21" r="15.9155" fill="transparent" strokeWidth="8" className="stroke-surface-container-low" />
        {segs.filter((sg) => sg.pct > 0).map((sg, i) => (
          <circle key={i} cx="21" cy="21" r="15.9155" fill="transparent" strokeWidth="8"
            stroke={colors[sg.row.color] ?? colors.green}
            strokeDasharray={sg.dasharray} strokeDashoffset={sg.dashoffset} strokeLinecap="butt" />
        ))}
      </svg>
      <ul className="w-full space-y-2 text-sm">
        {segs.map((sg, i) => (
          <li key={i} className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: colors[sg.row.color] ?? colors.green }} />
              <span className="font-medium">{sg.row.label}</span>
            </span>
            <span className="text-on-surface-variant">{sg.row.count} - {Math.round(sg.pct)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Badge status order. */
function OrderStatusBadge({ status, paymentStatus }: { status: string; paymentStatus: string }) {
  const norm = paymentStatus === "paid" ? "paid" : (status === "cancelled" || status === "expired" ? "cancelled" : "pending")
  const map: Record<string, { label: string; cls: string }> = {
    paid: { label: "Lunas", cls: "bg-primary/10 text-primary" },
    pending: { label: "Menunggu", cls: "bg-[#c9a227]/15 text-[#b45309] dark:text-[#fbbf24]" },
    cancelled: { label: "Batal", cls: "bg-destructive/10 text-destructive" },
  }
  const m = map[norm] ?? map.pending
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.cls}`}>{m.label}</span>
}

function CategoryPieChart({ rows }: { rows: CategoryRow[] }) {
  const total = rows.reduce((s, r) => s + r.revenue, 0)
  if (total <= 0) {
    return <p className="py-8 text-center text-sm text-on-surface-variant">Belum ada data kategori pada periode ini</p>
  }
  // Segmen SVG: lingkaran r=15.9155 (keliling 100) dengan stroke-dasharray.
  const segs = rows.slice(0, 10).reduce(
    (acc: { row: CategoryRow; pct: number; dasharray: string; dashoffset: number; color: string }[], row, i) => {
      const pct = (row.revenue / total) * 100
      const prev = acc.length > 0 ? acc[acc.length - 1] : null
      const dashoffset = prev ? prev.dashoffset - prev.pct : 25
      return [...acc, { row, pct, dasharray: `${pct} ${100 - pct}`, dashoffset, color: CATEGORY_HEX[i % CATEGORY_HEX.length] }]
    },
    []
  )
  const rest = rows.slice(10)
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <svg viewBox="0 0 42 42" className="h-44 w-44 shrink-0" role="img" aria-label="Diagram pie pendapatan per kategori">
        <circle cx="21" cy="21" r="15.9155" fill="transparent" strokeWidth="8" className="stroke-surface-container-low" />
        {segs.map((s, i) => (
          <circle
            key={i}
            cx="21" cy="21" r="15.9155" fill="transparent" strokeWidth="8"
            stroke={s.color}
            strokeDasharray={s.dasharray}
            strokeDashoffset={s.dashoffset}
            strokeLinecap="butt"
          >
            <title>{`${s.row.categoryName}: ${formatPrice(s.row.revenue)} (${Math.round(s.pct)}%)`}</title>
          </circle>
        ))}
      </svg>
      <ul className="w-full space-y-2 text-sm">
        {segs.map((s, i) => (
          <li key={i} className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
              <span className="font-medium">{s.row.categoryName}</span>
            </span>
            <span className="text-on-surface-variant">
              {formatPrice(s.row.revenue)} · {Math.round(s.pct)}%
            </span>
          </li>
        ))}
        {rest.length > 0 && (
          <li className="text-xs text-on-surface-variant">
            +{rest.length} kategori lain ({formatPrice(rest.reduce((s, r) => s + r.revenue, 0))})
          </li>
        )}
      </ul>
    </div>
  )
}

function TopProductsBar({ rows }: { rows: TopProductRow[] }) {
  const max = rows.reduce((m, r) => Math.max(m, r.revenue), 0)
  if (rows.length === 0 || max <= 0) {
    return <p className="py-8 text-center text-sm text-on-surface-variant">Belum ada produk terjual pada periode ini</p>
  }
  return (
    <div className="space-y-3">
      {rows.slice(0, 10).map((p, i) => {
        const pct = Math.round((p.revenue / max) * 100)
        return (
          <div key={p.productId} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium">
                <span className="mr-2 text-xs text-on-surface-variant">{i + 1}.</span>
                {p.name}
              </span>
              <span className="shrink-0 text-on-surface-variant">
                {p.qty} item · {formatPrice(p.revenue)}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container-low">
              <div
                className={`h-full rounded-full ${i === 0 ? "bg-primary" : "bg-[#66885d]"}`}
                style={{ width: `${pct}%` }}
                title={`${p.name}: ${p.qty} item, ${formatPrice(p.revenue)}`}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CustomerDonut({ total, baru }: { total: number; baru: number }) {
  const lama = Math.max(0, total - baru)
  const baruPct = total > 0 ? (baru / total) * 100 : 0
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <svg viewBox="0 0 42 42" className="h-36 w-36 shrink-0" role="img" aria-label="Komposisi pelanggan">
        <circle cx="21" cy="21" r="15.9155" fill="transparent" strokeWidth="8" className="stroke-surface-container-low" />
        {total > 0 && (
          <>
            <circle cx="21" cy="21" r="15.9155" fill="transparent" strokeWidth="8" stroke="#1a7a4a"
              strokeDasharray={`${baruPct} ${100 - baruPct}`} strokeDashoffset={25} strokeLinecap="butt">
              <title>{`Baru: ${baru} (${Math.round(baruPct)}%)`}</title>
            </circle>
            <circle cx="21" cy="21" r="15.9155" fill="transparent" strokeWidth="8" stroke="#b8ce8d"
              strokeDasharray={`${100 - baruPct} ${baruPct}`} strokeDashoffset={25 - baruPct} strokeLinecap="butt">
              <title>{`Lama: ${lama} (${Math.round(100 - baruPct)}%)`}</title>
            </circle>
          </>
        )}
      </svg>
      <ul className="w-full space-y-2 text-sm">
        <li className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
            <span className="font-medium">Pelanggan baru</span>
          </span>
          <span className="text-on-surface-variant">{baru} · {Math.round(baruPct)}%</span>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#b8ce8d]" />
            <span className="font-medium">Pelanggan lama</span>
          </span>
          <span className="text-on-surface-variant">{lama} · {Math.round(100 - baruPct)}%</span>
        </li>
      </ul>
    </div>
  )
}


function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function presetRange(preset: Preset): { from: string; to: string } {
  const today = new Date()
  const to = toIsoDate(today)

  switch (preset) {
    case "today":
      return { from: to, to }
    case "7d": {
      const start = new Date(today)
      start.setDate(start.getDate() - 6)
      return { from: toIsoDate(start), to }
    }
    case "month": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      return { from: toIsoDate(start), to }
    }
    case "30d":
    default: {
      const start = new Date(today)
      start.setDate(start.getDate() - 29)
      return { from: toIsoDate(start), to }
    }
  }
}

export default function AdminReportsPage() {
  const { toast } = useToast()

  const initialRange = useMemo(() => presetRange("30d"), [])
  const [from, setFrom] = useState(initialRange.from)
  const [to, setTo] = useState(initialRange.to)
  const [groupBy, setGroupBy] = useState<GroupBy>("day")
  const [activePreset, setActivePreset] = useState<Preset | null>("30d")

  const [data, setData] = useState<ReportResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReport = useCallback(async () => {
    if (!from || !to) return
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ from, to, groupBy })
    try {
      const r = await fetch(`/api/admin/reports?${params.toString()}`, { cache: "no-store" })
      const payload = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(payload?.error || `HTTP ${r.status}`)
      setData(payload as ReportResponse)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      setError(message)
      setData(null)
      toast({
        title: "Gagal memuat laporan",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [from, to, groupBy, toast])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pola fetch-saat-mount laporan; setState ada di dalam fetchReport()
    fetchReport()
  }, [fetchReport])

  const applyPreset = (preset: Preset) => {
    const range = presetRange(preset)
    setFrom(range.from)
    setTo(range.to)
    setActivePreset(preset)
  }

  const [syncing, setSyncing] = useState(false)

  const syncToSheets = async () => {
    if (!from || !to) return
    setSyncing(true)
    try {
      const params = new URLSearchParams({ from, to, groupBy })
      const r = await fetch(`/api/admin/reports/sync?${params.toString()}`, { method: "POST" })
      const payload = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(payload?.error || `HTTP ${r.status}`)
      toast({
        title: "Sinkron ke Spreadsheet selesai",
        description: `${payload?.synced ?? 0} order ditulis ke Spreadsheet.`,
      })
    } catch (e) {
      toast({
        title: "Sinkron gagal",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  const openSpreadsheet = () => {
    window.open(
      "https://docs.google.com/spreadsheets/d/1Fu4c8xrWEMOKgg6VM37667QtO_gSX7kAgWgweWTIFPE/edit",
      "_blank",
      "noopener,noreferrer"
    )
  }

  if (loading && !data && !error) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-56 rounded bg-surface-container" />
        <div className="h-20 rounded-lg bg-surface-container" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-surface-container" />
          ))}
        </div>
        <div className="h-64 rounded-lg bg-surface-container" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Icon name="info" size={40} className="mx-auto text-destructive/80" />
          <p className="mt-2 text-sm text-on-surface-variant">Gagal memuat laporan: {error}</p>
          <button onClick={() => fetchReport()} className="mt-2 text-sm text-primary underline">
            Coba lagi
          </button>
        </div>
      </div>
    )
  }

  const summary = data?.summary
  const series = data?.series ?? []
  const statusBreakdown = data?.statusBreakdown ?? []
  const orderList = data?.orderList ?? []
  const categoryBreakdown = data?.categoryBreakdown ?? []
  const topProducts = data?.topProducts ?? []
  const stockReport = data?.stockReport
  const customerReport = data?.customerReport

  const cards = [
    { title: "Total Pendapatan (Lunas)", value: formatPrice(summary?.totalRevenue ?? 0), icon: "account_balance_wallet" },
    { title: "Pesanan Lunas", value: (summary?.totalOrders ?? 0).toLocaleString("id-ID"), icon: "shopping_cart" },
    { title: "Semua Order", value: (summary?.totalOrdersAll ?? 0).toLocaleString("id-ID"), icon: "receipt_long" },
    { title: "Item Terjual", value: (summary?.totalItems ?? 0).toLocaleString("id-ID"), icon: "inventory_2" },
    { title: "Rata-rata Pesanan", value: formatPrice(summary?.averageOrderValue ?? 0), icon: "trending_up" },
  ]

  const isEmpty = (summary?.totalOrdersAll ?? 0) === 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Laporan Penjualan</h1>
          <p className="text-sm text-on-surface-variant">
            Periode {from} s/d {to} ({groupBy === "day" ? "per hari" : "per bulan"})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AdminRefreshButton endpointPrefixes={["/api/admin/reports"]} onRefresh={fetchReport} loading={loading} />
          <Button variant="secondary" onClick={openSpreadsheet}>
            <Icon name="open_in_new" size={16} className="mr-2" />
            Buka Spreadsheet
          </Button>
          <Button onClick={syncToSheets} disabled={!from || !to || syncing}>
            <Icon name="sync" size={16} className="mr-2" />
            {syncing ? "Menyinkron..." : "Sinkron ke Spreadsheet"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: "today", label: "Hari ini" },
                { key: "7d", label: "7 hari" },
                { key: "30d", label: "30 hari" },
                { key: "month", label: "Bulan ini" },
              ] as { key: Preset; label: string }[]
            ).map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => applyPreset(preset.key)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  activePreset === preset.key
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-outline-variant text-on-surface-variant hover:border-outline-variant hover:text-on-surface"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Dari</label>
              <Input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => {
                  setFrom(e.target.value)
                  setActivePreset(null)
                }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Sampai</label>
              <Input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => {
                  setTo(e.target.value)
                  setActivePreset(null)
                }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Kelompok</label>
              <div className="flex gap-1 rounded-lg bg-surface-container-low p-1">
                {(
                  [
                    { key: "day", label: "Harian" },
                    { key: "month", label: "Bulanan" },
                  ] as { key: GroupBy; label: string }[]
                ).map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setGroupBy(option.key)}
                    className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      groupBy === option.key
                        ? "bg-surface text-primary shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface-variant"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-end">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => fetchReport()}
                disabled={loading}
              >
                {loading ? "Memuat..." : "Terapkan"}
              </Button>
            </div>
          </div>

          {data?.definition && (
            <p className="rounded-lg bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
              <span className="font-medium text-on-surface-variant">Definisi pesanan terjual: </span>
              {data.definition}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="rounded-lg bg-primary/10 p-2 w-fit text-primary">
                <Icon name={card.icon} size={20} />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-on-surface">{card.value}</p>
                <p className="text-sm text-on-surface-variant">{card.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isEmpty ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Icon name="bar_chart" size={40} className="mx-auto text-on-surface-variant/70" />
            <p className="mt-3 text-sm font-medium text-on-surface-variant">
              Tidak ada penjualan pada rentang tanggal ini
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              Coba ubah rentang tanggal, atau pilih preset 30 hari / Bulan ini.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Grafik Penjualan per {groupBy === "day" ? "Hari" : "Bulan"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueBarChart rows={series} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Komposisi Status Order</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusPieChart rows={statusBreakdown} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Daftar Order per Status</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {orderList.length === 0 ? (
                <p className="py-8 text-center text-sm text-on-surface-variant">Belum ada order pada periode ini</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-on-surface-variant">
                      <th className="pb-3 font-medium">Order</th>
                      <th className="pb-3 font-medium">Tanggal</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 text-right font-medium">Item</th>
                      <th className="pb-3 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderList.map((o, i) => (
                      <tr key={o.orderNumber} className={i % 2 === 0 ? "bg-surface" : "bg-surface-container-low/50"}>
                        <td className="py-2.5 font-mono text-xs font-medium text-on-surface">{o.orderNumber}</td>
                        <td className="py-2.5 text-xs text-on-surface-variant">{o.createdAt.slice(0, 10)}</td>
                        <td className="py-2.5"><OrderStatusBadge status={o.status} paymentStatus={o.paymentStatus} /></td>
                        <td className="py-2.5 text-right text-on-surface-variant">{o.items}</td>
                        <td className="py-2.5 text-right font-medium">{formatPrice(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Tabel Penjualan Lunas per {groupBy === "day" ? "Hari" : "Bulan"}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-on-surface-variant">
                    <th className="pb-3 font-medium">Periode</th>
                    <th className="pb-3 text-right font-medium">Pendapatan</th>
                    <th className="pb-3 text-right font-medium">Pesanan</th>
                    <th className="pb-3 text-right font-medium">Item</th>
                  </tr>
                </thead>
                <tbody>
                  {series.map((row, i) => (
                    <tr key={row.key} className={i % 2 === 0 ? "bg-surface" : "bg-surface-container-low/50"}>
                      <td className="py-2.5">
                        <span className="font-medium text-on-surface">{row.label}</span>
                        <span className="ml-1 text-xs text-on-surface-variant">{row.key}</span>
                      </td>
                      <td className="py-2.5 text-right font-medium">{formatPrice(row.revenue)}</td>
                      <td className="py-2.5 text-right text-on-surface-variant">{row.orders}</td>
                      <td className="py-2.5 text-right text-on-surface-variant">{row.items}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-semibold">
                    <td className="pt-3">Total</td>
                    <td className="pt-3 text-right">{formatPrice(summary?.totalRevenue ?? 0)}</td>
                    <td className="pt-3 text-right">{summary?.totalOrders ?? 0}</td>
                    <td className="pt-3 text-right">{summary?.totalItems ?? 0}</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pendapatan per Kategori (Pie)</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryPieChart rows={categoryBreakdown} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">10 Produk Terlaris (Bar)</CardTitle>
            </CardHeader>
            <CardContent>
              <TopProductsBar rows={topProducts} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Tabel 10 Produk Terlaris</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {topProducts.length === 0 ? (
                <p className="py-8 text-center text-sm text-on-surface-variant">
                  Belum ada produk terjual pada periode ini
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-on-surface-variant">
                      <th className="pb-3 font-medium">#</th>
                      <th className="pb-3 font-medium">Produk</th>
                      <th className="pb-3 text-right font-medium">Terjual</th>
                      <th className="pb-3 text-right font-medium">Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((product, i) => (
                      <tr key={product.productId} className={i % 2 === 0 ? "bg-surface" : "bg-surface-container-low/50"}>
                        <td className="py-2.5 text-on-surface-variant">{i + 1}</td>
                        <td className="py-2.5 font-medium text-on-surface">{product.name}</td>
                        <td className="py-2.5 text-right text-on-surface-variant">{product.qty} item</td>
                        <td className="py-2.5 text-right font-medium">{formatPrice(product.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* B21b: Laporan Stok */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Laporan Stok</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {!stockReport ? (
                <p className="py-8 text-center text-sm text-on-surface-variant">Data stok tidak tersedia</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl bg-surface-container-low p-3">
                      <p className="text-xs text-on-surface-variant">Total Produk</p>
                      <p className="text-xl font-bold text-on-surface">{stockReport.totalProducts}</p>
                    </div>
                    <div className="rounded-xl bg-destructive/10 p-3">
                      <p className="text-xs text-destructive">Stok Habis</p>
                      <p className="text-xl font-bold text-destructive">{stockReport.outOfStockCount}</p>
                    </div>
                    <div className="rounded-xl bg-[#fffbeb] dark:bg-[#78350f]/30 p-3">
                      <p className="text-xs text-[#b45309] dark:text-[#fbbf24]">Stok Menipis</p>
                      <p className="text-xl font-bold text-[#b45309] dark:text-[#fbbf24]">{stockReport.lowStockCount}</p>
                    </div>
                    <div className="rounded-xl bg-surface-container-low p-3">
                      <p className="text-xs text-on-surface-variant">Ambang Menipis</p>
                      <p className="text-xl font-bold text-on-surface">≤ {stockReport.threshold}</p>
                    </div>
                  </div>

                  {stockReport.outOfStock.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-destructive">Produk Habis</p>
                      <ul className="divide-y divide-outline-variant text-sm">
                        {stockReport.outOfStock.map((p) => (
                          <li key={p.id} className="flex justify-between py-2">
                            <span className="text-on-surface">{p.name}</span>
                            <span className="font-medium text-destructive">0</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {stockReport.lowStock.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-[#b45309] dark:text-[#fbbf24]">Produk Menipis</p>
                      <ul className="divide-y divide-outline-variant text-sm">
                        {stockReport.lowStock.map((p) => (
                          <li key={p.id} className="flex justify-between py-2">
                            <span className="text-on-surface">{p.name}</span>
                            <span className="font-medium text-[#b45309] dark:text-[#fbbf24]">{p.stock}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {stockReport.outOfStock.length === 0 && stockReport.lowStock.length === 0 && (
                    <p className="py-4 text-center text-sm text-primary">
                      Semua produk stoknya aman.
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* B21c: Laporan Pelanggan */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Laporan Pelanggan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {!customerReport ? (
                <p className="py-8 text-center text-sm text-on-surface-variant">Data pelanggan tidak tersedia</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-surface-container-low p-3">
                      <p className="text-xs text-on-surface-variant">Total Pelanggan</p>
                      <p className="text-xl font-bold text-on-surface">{customerReport.totalCustomers}</p>
                    </div>
                    <div className="rounded-xl bg-surface-container-low p-3">
                      <p className="text-xs text-primary">Pelanggan Baru (periode)</p>
                      <p className="text-xl font-bold text-primary">{customerReport.newCustomers}</p>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-semibold text-on-surface">Komposisi Pelanggan (Donat)</p>
                    <CustomerDonut total={customerReport.totalCustomers} baru={customerReport.newCustomers} />
                  </div>

                  <div className="overflow-x-auto">
                    <p className="mb-2 text-sm font-semibold text-on-surface">10 Pelanggan Teratas (belanja)</p>
                    {customerReport.topCustomers.length === 0 ? (
                      <p className="py-4 text-center text-sm text-on-surface-variant">
                        Belum ada pembelian pada periode ini
                      </p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-on-surface-variant">
                            <th className="pb-3 font-medium">#</th>
                            <th className="pb-3 font-medium">Pelanggan</th>
                            <th className="pb-3 text-right font-medium">Pesanan</th>
                            <th className="pb-3 text-right font-medium">Total Belanja</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerReport.topCustomers.map((c, i) => (
                            <tr key={c.userId ?? i} className={i % 2 === 0 ? "bg-surface" : "bg-surface-container-low/50"}>
                              <td className="py-2.5 text-on-surface-variant">{i + 1}</td>
                              <td className="py-2.5">
                                <span className="font-medium text-on-surface">{c.name}</span>
                                {c.email && <span className="block text-xs text-on-surface-variant">{c.email}</span>}
                              </td>
                              <td className="py-2.5 text-right text-on-surface-variant">{c.orderCount}</td>
                              <td className="py-2.5 text-right font-medium">{formatPrice(c.totalSpent)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
