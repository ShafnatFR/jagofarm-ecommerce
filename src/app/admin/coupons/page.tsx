"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Search, Edit, Trash2, Copy, Tag, X } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { formatPrice, formatDate } from "@/lib/utils"

const mockCoupons = [
  { id: "1", code: "HEMAT10", type: "PERCENTAGE", value: 10, minOrder: 100_000, maxDiscount: 50_000, usageLimit: 100, usageCount: 45, startDate: "2026-09-01", endDate: "2026-09-30", status: "ACTIVE" },
  { id: "2", code: "GRATIS50K", type: "FIXED", value: 50_000, minOrder: 200_000, maxDiscount: null, usageLimit: 50, usageCount: 50, startDate: "2026-08-01", endDate: "2026-08-31", status: "EXPIRED" },
  { id: "3", code: "NEWUSER15", type: "PERCENTAGE", value: 15, minOrder: 50_000, maxDiscount: 100_000, usageLimit: 500, usageCount: 123, startDate: "2026-09-01", endDate: "2026-12-31", status: "ACTIVE" },
  { id: "4", code: "FLASHSALE", type: "FIXED", value: 25_000, minOrder: 75_000, maxDiscount: null, usageLimit: 200, usageCount: 0, startDate: "2026-10-01", endDate: "2026-10-07", status: "SCHEDULED" },
  { id: "5", code: "JAGOFARM20", type: "PERCENTAGE", value: 20, minOrder: 150_000, maxDiscount: 75_000, usageLimit: 30, usageCount: 28, startDate: "2026-09-10", endDate: "2026-09-20", status: "ACTIVE" },
]

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  ACTIVE: { label: "Aktif", variant: "success" },
  EXPIRED: { label: "Kedaluwarsa", variant: "destructive" },
  SCHEDULED: { label: "Terjadwal", variant: "warning" },
  DISABLED: { label: "Nonaktif", variant: "secondary" },
}

export default function CouponsPage() {
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    code: "",
    type: "PERCENTAGE",
    value: "",
    minOrder: "",
    maxDiscount: "",
    usageLimit: "",
    startDate: "",
    endDate: "",
  })

  const filtered = mockCoupons.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = () => {
    // TODO: POST to API
    setDialogOpen(false)
    setForm({ code: "", type: "PERCENTAGE", value: "", minOrder: "", maxDiscount: "", usageLimit: "", startDate: "", endDate: "" })
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kupon</h1>
          <p className="text-sm text-gray-500">{mockCoupons.length} kupon terdaftar</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Kupon
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Cari kode kupon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/80 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Kode</th>
                  <th className="px-4 py-3 font-medium">Tipe</th>
                  <th className="px-4 py-3 font-medium">Nilai</th>
                  <th className="px-4 py-3 font-medium">Min. Order</th>
                  <th className="px-4 py-3 text-center font-medium">Penggunaan</th>
                  <th className="px-4 py-3 font-medium">Berlaku</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((coupon, i) => (
                  <motion.tr
                    key={coupon.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-[#1B4D3E]/5 px-2 py-0.5 font-mono text-sm font-bold text-[#1B4D3E]">
                          {coupon.code}
                        </code>
                        <button onClick={() => handleCopy(coupon.code)} className="text-gray-400 hover:text-gray-600">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">
                        {coupon.type === "PERCENTAGE" ? "Persentase" : "Nominal"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {coupon.type === "PERCENTAGE" ? `${coupon.value}%` : formatPrice(coupon.value)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatPrice(coupon.minOrder)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={coupon.usageCount >= coupon.usageLimit ? "text-red-500 font-medium" : ""}>
                        {coupon.usageCount}
                      </span>
                      <span className="text-gray-400">/{coupon.usageLimit}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDate(coupon.startDate)} — {formatDate(coupon.endDate)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusConfig[coupon.status]?.variant || "default"}>
                        {statusConfig[coupon.status]?.label || coupon.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                      Tidak ada kupon ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Coupon Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Buat Kupon Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              label="Kode Kupon"
              placeholder="CONTOH: HEMAT20"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tipe Diskon</label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                  <SelectItem value="FIXED">Nominal (Rp)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              label={form.type === "PERCENTAGE" ? "Diskon (%)" : "Diskon (Rp)"}
              type="number"
              placeholder={form.type === "PERCENTAGE" ? "10" : "50000"}
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
            <Input
              label="Minimum Order (Rp)"
              type="number"
              placeholder="100000"
              value={form.minOrder}
              onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
            />
            {form.type === "PERCENTAGE" && (
              <Input
                label="Maksimum Diskon (Rp)"
                type="number"
                placeholder="50000"
                value={form.maxDiscount}
                onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
              />
            )}
            <Input
              label="Batas Penggunaan"
              type="number"
              placeholder="100"
              value={form.usageLimit}
              onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Tanggal Mulai"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
              <Input
                label="Tanggal Berakhir"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave}>Buat Kupon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
