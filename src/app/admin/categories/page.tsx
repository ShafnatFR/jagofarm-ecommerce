"use client"

import { useCallback, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Icon } from "@/components/ui/icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

/** Pesan error yang aman ditampilkan di UI (unknown -> string). */
function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

interface Category {
  id: string; name: string; slug: string; description?: string | null;
  parentId?: string | null; sortOrder?: number; isActive?: boolean;
  _count?: { products?: number; children?: number };
  children?: Category[];
  productCount?: number;
}

function CategoryNode({ category, depth = 0, onEdit, onDelete }: {
  category: Category; depth?: number; onEdit: (c: Category) => void; onDelete: (c: Category) => void
}) {
  const [expanded, setExpanded] = useState(depth === 0)
  const hasChildren = (category.children?.length ?? 0) > 0
  const productCount = category._count?.products ?? category.productCount ?? 0

  return (
    <div>
      <div className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50 ${depth > 0 ? "ml-6" : ""}`}>
        <div className="flex items-center gap-2">
          {hasChildren ? (
            <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
              {expanded ? <Icon name="expand_more" size={16} /> : <Icon name="chevron_right" size={16} />}
            </button>
          ) : <div className="w-4" />}
          <Icon name="account_tree" size={16} className="text-[#1B4D3E]" />
          <span className="font-medium">{category.name}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{productCount} produk</span>
          {category.isActive === false && <Badge variant="secondary">Nonaktif</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(category)} className="h-8 w-8" title="Edit kategori"><Icon name="edit" size={12} /></Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(category)} className="h-8 w-8 text-red-500 hover:text-red-600" title="Hapus kategori"><Icon name="delete" size={12} /></Button>
        </div>
      </div>
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            {category.children?.map((child) => <CategoryNode key={child.id} category={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function flattenCategories(
  cats: Category[],
  prefix = "",
  excludeId: string | null = null
): { value: string; label: string }[] {
  const result: { value: string; label: string }[] = []
  for (const cat of cats) {
    // Kategori yang sedang diedit tidak boleh jadi induk bagi dirinya/turunannya.
    if (excludeId && cat.id === excludeId) continue
    result.push({ value: cat.id, label: prefix + cat.name })
    result.push(...flattenCategories(cat.children ?? [], prefix + cat.name + " / ", excludeId))
  }
  return result
}

export default function CategoriesPage() {
  const { toast } = useToast()

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formName, setFormName] = useState("")
  const [formSlug, setFormSlug] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formParent, setFormParent] = useState("none")
  const [formSortOrder, setFormSortOrder] = useState("0")
  const [formIsActive, setFormIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/admin/categories", { cache: "no-store" })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const d = await r.json()
      setCategories(d.categories || [])
      setError(null)
    } catch (e) {
      setError(toMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pola fetch-saat-mount daftar kategori; setState ada di dalam fetchData()
    fetchData()
  }, [fetchData])

  const allCategories = flattenCategories(categories, "", editingCategory?.id ?? null)

  const handleAdd = () => {
    setEditingCategory(null)
    setFormName(""); setFormSlug(""); setFormDesc(""); setFormParent("none")
    setFormSortOrder("0"); setFormIsActive(true)
    setDialogOpen(true)
  }

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat)
    setFormName(cat.name)
    setFormSlug(cat.slug)
    setFormDesc(cat.description ?? "")
    setFormParent(cat.parentId ?? "none")
    setFormSortOrder(String(cat.sortOrder ?? 0))
    setFormIsActive(cat.isActive ?? true)
    setDialogOpen(true)
  }

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Hapus kategori "${cat.name}"? Tindakan ini tidak dapat dibatalkan.`)) return

    setDeleting(cat.id)
    try {
      const r = await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data?.error || `Gagal menghapus kategori (HTTP ${r.status})`)

      toast({
        title: "Kategori dihapus",
        description: data?.message || `Kategori "${cat.name}" berhasil dihapus.`,
      })
      await fetchData()
    } catch (e) {
      toast({ title: "Gagal menghapus kategori", description: toMessage(e), variant: "destructive" })
    } finally {
      setDeleting(null)
    }
  }

  const handleSave = async () => {
    if (!formName.trim()) {
      toast({
        title: "Nama kategori wajib diisi",
        description: "Isi nama kategori sebelum menyimpan.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: formName.trim(),
        description: formDesc,
        parentId: formParent === "none" ? null : formParent,
        sortOrder: Number(formSortOrder) || 0,
        isActive: formIsActive,
      }
      if (formSlug.trim()) body.slug = formSlug.trim()

      const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : "/api/admin/categories"
      const method = editingCategory ? "PATCH" : "POST"

      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data?.error || `Gagal menyimpan kategori (HTTP ${r.status})`)

      toast({
        title: editingCategory ? "Kategori diperbarui" : "Kategori ditambahkan",
        description: data?.message || `Kategori "${body.name}" tersimpan.`,
      })
      setDialogOpen(false)
      setEditingCategory(null)
      await fetchData()
    } catch (e) {
      toast({ title: "Gagal menyimpan kategori", description: toMessage(e), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading && categories.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-40 rounded bg-gray-200" />
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded bg-gray-200" />)}</div>
      </div>
    )
  }

  if (error && categories.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Icon name="info" size={40} className="mx-auto text-red-400" />
          <p className="mt-2 text-sm text-gray-600">Gagal memuat kategori: {error}</p>
          <button onClick={() => location.reload()} className="mt-2 text-sm text-[#1B4D3E] underline">Coba lagi</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kategori</h1>
          <p className="text-sm text-gray-500">Kelola kategori produk</p>
        </div>
        <Button onClick={handleAdd}><Icon name="add" size={16} className="mr-2" />Tambah Kategori</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Daftar Kategori</CardTitle></CardHeader>
        <CardContent className="p-0">
          {categories.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Icon name="account_tree" size={40} className="mx-auto text-gray-300" />
              <p className="mt-2">Belum ada kategori</p>
            </div>
          ) : (
            <div className="divide-y">
              {categories.map((cat) => (
                <CategoryNode key={cat.id} category={cat} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}
          {deleting && (
            <div className="border-t bg-gray-50 px-4 py-2 text-xs text-gray-500">Menghapus kategori...</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingCategory(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCategory ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nama Kategori</label>
              <Input placeholder="Contoh: Hidroponik" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Slug</label>
              <Input
                placeholder="otomatis dari nama bila dikosongkan"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Deskripsi</label>
              <textarea
                className="flex min-h-[70px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E]"
                placeholder="Deskripsi singkat..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Kategori Induk</label>
              <Select value={formParent} onValueChange={setFormParent}>
                <SelectTrigger><SelectValue placeholder="Tidak ada (kategori utama)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada (kategori utama)</SelectItem>
                  {allCategories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Urutan</label>
                <Input
                  type="number"
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Status</label>
                <Select value={formIsActive ? "active" : "inactive"} onValueChange={(v) => setFormIsActive(v === "active")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : editingCategory ? "Simpan" : "Tambah"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
