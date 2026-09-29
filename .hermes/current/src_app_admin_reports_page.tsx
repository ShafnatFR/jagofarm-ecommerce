"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  BarChart3,
  Download,
  Package,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { formatPrice } from "@/lib/format"

type GroupBy = "day" | "month"
type Preset = "today" | "7d" | "30d" | "month"

interface ReportPeriod {
  key: string
  label: string
  revenue: number
  orders: number
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
    totalItems: number
    averageOrderValue: number
  }
  series: ReportPeriod[]
  categoryBreakdown: CategoryRow[]
  topProducts: TopProductRow[]
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

  const exportCsv = () => {
    if (!from || !to) return
    const params = new URLSearchParams({ from, to, groupBy, format: "csv" })
    const link = document.createElement("a")
    link.href = `/api/admin/reports?${params.toString()}`
    link.download = `laporan-penjualan_${from}_${to}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    toast({
      title: "Export CSV dimulai",
      description: `Laporan ${from} s/d ${to} sedang diunduh.`,
    })
  }

  if (loading && !data && !error) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-56 rounded bg-gray-200" />
        <div className="h-20 rounded-lg bg-gray-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-gray-200" />
          ))}
        </div>
        <div className="h-64 rounded-lg bg-gray-200" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
          <p className="mt-2 text-sm text-gray-600">Gagal memuat laporan: {error}</p>
          <button onClick={() => fetchReport()} className="mt-2 text-sm text-[#1B4D3E] underline">
            Coba lagi
          </button>
        </div>
      </div>
    )
  }

  const summary = data?.summary
  const series = data?.series ?? []
  const categoryBreakdown = data?.categoryBreakdown ?? []
  const topProducts = data?.topProducts ?? []
  const categoryMax = categoryBreakdown.reduce((max, row) => Math.max(max, row.revenue), 0)

  const cards = [
    { title: "Total Pendapatan", value: formatPrice(summary?.totalRevenue ?? 0), icon: Wallet },
    { title: "Jumlah Pesanan", value: (summary?.totalOrders ?? 0).toLocaleString("id-ID"), icon: ShoppingCart },
    { title: "Item Terjual", value: (summary?.totalItems ?? 0).toLocaleString("id-ID"), icon: Package },
    { title: "Rata-rata Pesanan", value: formatPrice(summary?.averageOrderValue ?? 0), icon: TrendingUp },
  ]

  const isEmpty = (summary?.totalOrders ?? 0) === 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Penjualan</h1>
          <p className="text-sm text-gray-500">
            Periode {from} s/d {to} ({groupBy === "day" ? "per hari" : "per bulan"})
          </p>
        </div>
        <Button onClick={exportCsv} disabled={!from || !to}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
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
                    ? "border-[#1B4D3E] bg-[#1B4D3E]/10 text-[#1B4D3E]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800"
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
              <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
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
                        ? "bg-white text-[#1B4D3E] shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
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
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
              <span className="font-medium text-gray-600">Definisi pesanan terjual: </span>
              {data.definition}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="rounded-lg bg-[#1B4D3E]/10 p-2 w-fit">
                <card.icon className="h-5 w-5 text-[#1B4D3E]" />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-500">{card.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isEmpty ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BarChart3 className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">
              Tidak ada penjualan pada rentang tanggal ini
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Coba ubah rentang tanggal, atau pilih preset 30 hari / Bulan ini.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Penjualan per {groupBy === "day" ? "Hari" : "Bulan"}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 font-medium">Periode</th>
                    <th className="pb-3 text-right font-medium">Pendapatan</th>
                    <th className="pb-3 text-right font-medium">Pesanan</th>
                    <th className="pb-3 text-right font-medium">Item</th>
                  </tr>
                </thead>
                <tbody>
                  {series.map((row, i) => (
                    <tr key={row.key} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="py-2.5">
                        <span className="font-medium text-gray-800">{row.label}</span>
                        <span className="ml-1 text-xs text-gray-400">{row.key}</span>
                      </td>
                      <td className="py-2.5 text-right font-medium">{formatPrice(row.revenue)}</td>
                      <td className="py-2.5 text-right text-gray-600">{row.orders}</td>
                      <td className="py-2.5 text-right text-gray-600">{row.items}</td>
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
              <CardTitle className="text-lg">Penjualan per Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryBreakdown.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">
                  Belum ada data kategori pada periode ini
                </p>
              ) : (
                <div className="space-y-4">
                  {categoryBreakdown.map((row) => {
                    const pct = categoryMax > 0 ? Math.round((row.revenue / categoryMax) * 100) : 0
                    return (
                      <div key={row.categoryId} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{row.categoryName}</span>
                          <span className="text-gray-500">
                            {formatPrice(row.revenue)} · {row.items} item
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-[#1B4D3E]/80"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">10 Produk Terlaris</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {topProducts.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">
                  Belum ada produk terjual pada periode ini
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-3 font-medium">#</th>
                      <th className="pb-3 font-medium">Produk</th>
                      <th className="pb-3 text-right font-medium">Terjual</th>
                      <th className="pb-3 text-right font-medium">Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((product, i) => (
                      <tr key={product.productId} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                        <td className="py-2.5 text-gray-400">{i + 1}</td>
                        <td className="py-2.5 font-medium text-gray-800">{product.name}</td>
                        <td className="py-2.5 text-right text-gray-600">{product.qty} item</td>
                        <td className="py-2.5 text-right font-medium">{formatPrice(product.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
