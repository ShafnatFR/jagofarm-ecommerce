"use client"

import { useEffect, useState } from "react"
import { Icon } from "@/components/ui/icon";
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { formatPrice, formatDate } from "@/lib/utils"
import { throwIfNotOk } from "@/lib/api-errors"
import { useToast } from "@/components/ui/use-toast"
import { AdminErrorState } from "@/components/admin/error-state"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { AdminRefreshButton } from "../admin-refresh"

/** Pesan error yang aman ditampilkan di UI (unknown -> string). */
function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Bentuk mentah item dari GET /api/admin/coupons (dua penamaan field). */
interface CouponApiItem {
  id: string; code: string;
  discountType?: string; type?: string;
  discountValue?: number; value?: number;
  minOrderValue?: number | null; minOrder?: number;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usedCount?: number; usageCount?: number;
  isActive?: boolean;
  startsAt?: string; startDate?: string;
  expiresAt?: string; endDate?: string;
}

interface Coupon {
  id: string; code: string; type: string; value: number; minOrder: number
  maxDiscount: number | null; usageLimit: number; usageCount: number
  startDate: string; endDate: string; status: string; isActive: boolean
}

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  ACTIVE: { label: "Aktif", variant: "success" },
  EXPIRED: { label: "Kedaluwarsa", variant: "destructive" },
  SCHEDULED: { label: "Terjadwal", variant: "warning" },
  DISABLED: { label: "Nonaktif", variant: "secondary" },
}

const emptyForm = { code: "", type: "PERCENTAGE", value: "", minOrder: "", maxDiscount: "", usageLimit: "", startDate: "", endDate: "" }

export default function CouponsPage() {
  const { toast } = useToast()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  // Dialog konfirmasi hapus: kupon yang akan dihapus (null = tertutup).
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; code: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const normalizeCoupons = (items: CouponApiItem[]): Coupon[] => items.map((c) => ({
    id: c.id, code: c.code, type: (c.discountType || c.type || "percentage").toLowerCase(),
    value: c.discountValue ?? c.value ?? 0, minOrder: c.minOrderValue ?? c.minOrder ?? 0,
    maxDiscount: c.maxDiscount ?? null, usageLimit: c.usageLimit ?? 0,
    usageCount: c.usedCount ?? c.usageCount ?? 0, startDate: c.startsAt || c.startDate || "",
    endDate: c.expiresAt || c.endDate || "", status: !c.isActive ? "DISABLED" : new Date(c.expiresAt || c.endDate || "") < new Date() ? "EXPIRED" : "ACTIVE",
    isActive: c.isActive ?? false,
  }))

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch("/api/admin/coupons")
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const d = await r.json()
      setCoupons(normalizeCoupons(d.coupons || []))
    } catch (e) { setError(toMessage(e)) } finally { setLoading(false) }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount updates the page loading state.
    void fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchData dibuat ulang tiap render; sengaja fetch sekali saat mount.
  }, [])

  const filtered = coupons.filter((c) => c.code.toLowerCase().includes(search.toLowerCase()))

  const handleCopy = (code: string) => { navigator.clipboard.writeText(code) }

  const openCreate = () => { setEditingCoupon(null); setForm(emptyForm); setDialogOpen(true) }

  const toDateInput = (value: string) => value ? value.slice(0, 10) : ""

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setForm({
      code: coupon.code, type: coupon.type.toLowerCase() === "fixed" ? "FIXED" : "PERCENTAGE", value: String(coupon.value),
      minOrder: String(coupon.minOrder), maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : "",
      usageLimit: String(coupon.usageLimit), startDate: toDateInput(coupon.startDate), endDate: toDateInput(coupon.endDate),
    })
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    const coupon = coupons.find((c) => c.id === id)
    setConfirmDelete({ id, code: coupon?.code ?? "" })
  }

  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      const r = await fetch(`/api/admin/coupons/${confirmDelete.id}`, { method: "DELETE" })
      await throwIfNotOk(r, "Gagal menghapus kupon")
      const scope = window as Window & { __jagoAdminClearCache?: (prefixes?: string[]) => void }
      scope.__jagoAdminClearCache?.(["/api/admin/coupons"])
      setCoupons((prev) => prev.filter((c) => c.id !== confirmDelete.id))
      toast({
        title: "Kupon dihapus",
        description: `Kupon "${confirmDelete.code}" tidak bisa dipakai lagi.`,
        variant: "success",
      })
      setConfirmDelete(null)
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal menghapus kupon", description: e instanceof Error ? e.message : String(e) })
    } finally {
      setDeleting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (!form.code.trim() || !form.value || !form.usageLimit || !form.startDate || !form.endDate) {
        throw new Error("Lengkapi kode, nilai diskon, batas penggunaan, tanggal mulai, dan tanggal berakhir")
      }
      const body = {
        code: form.code.trim(),
        discountType: form.type === "PERCENTAGE" ? "percentage" : "fixed",
        discountValue: Number(form.value),
        minOrderValue: form.minOrder ? Number(form.minOrder) : 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: Number(form.usageLimit),
        startsAt: new Date(`${form.startDate}T00:00:00`).toISOString(),
        expiresAt: new Date(`${form.endDate}T23:59:59`).toISOString(),
        // Pertahankan status aktif saat mengedit; kupon baru default aktif.
        isActive: editingCoupon ? editingCoupon.isActive : true,
      }
      const url = editingCoupon ? `/api/admin/coupons/${editingCoupon.id}` : "/api/admin/coupons"
      const method = editingCoupon ? "PATCH" : "POST"
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      await throwIfNotOk(r, "Gagal menyimpan kupon")
      const scope = window as Window & { __jagoAdminClearCache?: (prefixes?: string[]) => void }
      scope.__jagoAdminClearCache?.(["/api/admin/coupons"])
      const fresh = await fetch("/api/admin/coupons").then((r) => r.json())
      setCoupons(normalizeCoupons(fresh.coupons || []))
      setDialogOpen(false)
      toast({
        title: editingCoupon ? "Kupon diperbarui" : "Kupon dibuat",
        description: `Kupon "${form.code.trim()}" tersimpan.`,
        variant: "success",
      })
    } catch (e) { toast({ variant: "destructive", title: "Gagal menyimpan kupon", description: toMessage(e) }) }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-40 rounded bg-surface-container" />
        <div className="h-16 rounded-lg bg-surface-container" />
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded bg-surface-container" />)}</div>
      </div>
    )
  }

  if (error) {
    return <AdminErrorState message={`Gagal memuat kupon: ${error}`} onRetry={() => void fetchData()} />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Kupon</h1>
          <p className="text-sm text-on-surface-variant">{coupons.length} kupon terdaftar</p>
        </div>
        <div className="flex items-center gap-2">
          <AdminRefreshButton endpointPrefixes={["/api/admin/coupons"]} onRefresh={fetchData} loading={loading} />
          <Button onClick={openCreate}><Icon name="add" size={16} className="mr-2" />Buat Kupon</Button>
        </div>
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
            <div className="py-12 text-center text-on-surface-variant">Tidak ada kupon ditemukan</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-surface-container-low/80 text-left text-on-surface-variant">
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
                    <tr key={coupon.id} className={i % 2 === 0 ? "bg-surface" : "bg-surface-container-low/50"}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-primary/10 px-2 py-0.5 font-mono text-sm font-bold text-primary">{coupon.code}</code>
                          <button onClick={() => handleCopy(coupon.code)} className="text-on-surface-variant hover:text-on-surface-variant"><Icon name="content_copy" size={12} /></button>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge variant="secondary">{coupon.type === "percentage" ? "Persentase" : "Nominal"}</Badge></td>
                      <td className="px-4 py-3 font-medium">{coupon.type === "percentage" ? `${coupon.value}%` : formatPrice(coupon.value)}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{formatPrice(coupon.minOrder)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={coupon.usageCount >= coupon.usageLimit ? "text-destructive font-medium" : ""}>{coupon.usageCount}</span>
                        <span className="text-on-surface-variant">/{coupon.usageLimit}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{formatDate(coupon.startDate)} — {formatDate(coupon.endDate)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusConfig[coupon.status]?.variant || "default"}>{statusConfig[coupon.status]?.label || coupon.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(coupon)}><Icon name="edit" size={12} /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(coupon.id)}><Icon name="delete" size={12} /></Button>
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

      {/* Konfirmasi hapus kupon — menggantikan confirm() browser */}
      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => { if (!open) setConfirmDelete(null) }}
        title={`Hapus kupon "${confirmDelete?.code ?? ""}"?`}
        description={"Kupon tidak bisa dipakai pelanggan lagi. Tindakan ini tidak dapat dibatalkan."}
        confirmLabel="Ya, hapus"
        loading={deleting}
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  )
}
