"use client"

import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Copy, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { formatPrice, formatDate } from "@/lib/utils"

interface Coupon {
  id: string; code: string; type: string; value: number; minOrder: number
  maxDiscount: number | null; usageLimit: number; usageCount: number
  startDate: string; endDate: string; status: string
}

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  ACTIVE: { label: "Aktif", variant: "success" },
  EXPIRED: { label: "Kedaluwarsa", variant: "destructive" },
  SCHEDULED: { label: "Terjadwal", variant: "warning" },
  DISABLED: { label: "Nonaktif", variant: "secondary" },
}

const emptyForm = { code: "", type: "PERCENTAGE", value: "", minOrder: "", maxDiscount: "", usageLimit: "", startDate: "", endDate: "" }

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/admin/coupons")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d) => setCoupons(d.coupons || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = coupons.filter((c) => c.code.toLowerCase().includes(search.toLowerCase()))

  const handleCopy = (code: string) => { navigator.clipboard.writeText(code) }

  const openCreate = () => { setEditingCoupon(null); setForm(emptyForm); setDialogOpen(true) }

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setForm({
      code: coupon.code, type: coupon.type, value: String(coupon.value),
      minOrder: String(coupon.minOrder), maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : "",
      usageLimit: String(coupon.usageLimit), startDate: coupon.startDate, endDate: coupon.endDate,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus kupon ini?")) return
    try {
      const r = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" })
      if (!r.ok) throw new Error("Gagal menghapus")
      setCoupons((prev) => prev.filter((c) => c.id !== id))
    } catch (e: any) { alert(e.message) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body = {
        code: form.code, type: form.type, value: Number(form.value),
        minOrder: Number(form.minOrder), maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: Number(form.usageLimit), startDate: form.startDate, endDate: form.endDate,
      }
      const url = editingCoupon ? `/api/admin/coupons/${editingCoupon.id}` : "/api/admin/coupons"
      const method = editingCoupon ? "PATCH" : "POST"
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!r.ok) throw new Error("Gagal menyimpan")
      const fresh = await fetch("/api/admin/coupons").then((r) => r.json())
      setCoupons(fresh.coupons || [])
      setDialogOpen(false)
    } catch (e: any) { alert(e.message) }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-40 rounded bg-gray-200" />
        <div className="h-16 rounded-lg bg-gray-200" />
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded bg-gray-200" />)}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
          <p className="mt-2 text-sm text-gray-600">Gagal memuat kupon: {error}</p>
          <button onClick={() => location.reload()} className="mt-2 text-sm text-[#1B4D3E] underline">Coba lagi</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kupon</h1>
          <p className="text-sm text-gray-500">{coupons.length} kupon terdaftar</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Buat Kupon</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Input placeholder="Cari kode kupon..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-400">Tidak ada kupon ditemukan</div>
          ) : (
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
                    <tr key={coupon.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-[#1B4D3E]/5 px-2 py-0.5 font-mono text-sm font-bold text-[#1B4D3E]">{coupon.code}</code>
                          <button onClick={() => handleCopy(coupon.code)} className="text-gray-400 hover:text-gray-600"><Copy className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge variant="secondary">{coupon.type === "PERCENTAGE" ? "Persentase" : "Nominal"}</Badge></td>
                      <td className="px-4 py-3 font-medium">{coupon.type === "PERCENTAGE" ? `${coupon.value}%` : formatPrice(coupon.value)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatPrice(coupon.minOrder)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={coupon.usageCount >= coupon.usageLimit ? "text-red-500 font-medium" : ""}>{coupon.usageCount}</span>
                        <span className="text-gray-400">/{coupon.usageLimit}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(coupon.startDate)} — {formatDate(coupon.endDate)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusConfig[coupon.status]?.variant || "default"}>{statusConfig[coupon.status]?.label || coupon.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(coupon)}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(coupon.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingCoupon ? "Edit Kupon" : "Buat Kupon Baru"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="mb-1.5 block text-sm font-medium">Kode Kupon</label>
              <Input placeholder="HEMAT20" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
            <div><label className="mb-1.5 block text-sm font-medium">Tipe Diskon</label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                  <SelectItem value="FIXED">Nominal (Rp)</SelectItem>
                </SelectContent>
              </Select></div>
            <div><label className="mb-1.5 block text-sm font-medium">{form.type === "PERCENTAGE" ? "Diskon (%)" : "Diskon (Rp)"}</label>
              <Input type="number" placeholder={form.type === "PERCENTAGE" ? "10" : "50000"} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
            <div><label className="mb-1.5 block text-sm font-medium">Minimum Order (Rp)</label>
              <Input type="number" placeholder="100000" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} /></div>
            {form.type === "PERCENTAGE" && (
              <div><label className="mb-1.5 block text-sm font-medium">Maksimum Diskon (Rp)</label>
                <Input type="number" placeholder="50000" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} /></div>
            )}
            <div><label className="mb-1.5 block text-sm font-medium">Batas Penggunaan</label>
              <Input type="number" placeholder="100" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="mb-1.5 block text-sm font-medium">Mulai</label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div><label className="mb-1.5 block text-sm font-medium">Berakhir</label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : editingCoupon ? "Simpan" : "Buat Kupon"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
