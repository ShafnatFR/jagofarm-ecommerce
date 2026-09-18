"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FolderTree, Plus, Edit, Trash2, ChevronRight, ChevronDown, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface Category {
  id: string; name: string; slug: string; description?: string;
  parentId?: string | null; sortOrder?: number; isActive?: boolean;
  _count?: { products?: number };
  children?: Category[];
  productCount?: number;
}

function CategoryNode({ category, depth = 0, onEdit, onDelete }: {
  category: Category; depth?: number; onEdit: (c: Category) => void; onDelete: (c: Category) => void
}) {
  const [expanded, setExpanded] = useState(depth === 0)
  const hasChildren = (category.children?.length ?? 0) > 0

  return (
    <div>
      <div className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50 ${depth > 0 ? "ml-6" : ""}`}>
        <div className="flex items-center gap-2">
          {hasChildren ? (
            <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : <div className="w-4" />}
          <FolderTree className="h-4 w-4 text-[#1B4D3E]" />
          <span className="font-medium">{category.name}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{category._count?.products ?? category.productCount ?? 0} produk</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(category)} className="h-8 w-8"><Edit className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(category)} className="h-8 w-8 text-red-500 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></Button>
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

function flattenCategories(cats: Category[], prefix = ""): { value: string; label: string }[] {
  const result: { value: string; label: string }[] = []
  for (const cat of cats) {
    result.push({ value: cat.id, label: prefix + cat.name })
    result.push(...flattenCategories(cat.children ?? [], prefix + cat.name + " / "))
  }
  return result
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formName, setFormName] = useState("")
  const [formSlug, setFormSlug] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formParent, setFormParent] = useState("none")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d) => setCategories(d.categories || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const allCategories = flattenCategories(categories)

  const handleAdd = () => {
    setEditingCategory(null); setFormName(""); setFormSlug(""); setFormDesc(""); setFormParent("none")
    setDialogOpen(true)
  }
  const handleEdit = (cat: Category) => {
    setEditingCategory(cat); setFormName(cat.name); setFormSlug(cat.slug); setFormDesc(""); setFormParent("none")
    setDialogOpen(true)
  }
  const handleDelete = async (cat: Category) => {
    if (!confirm(`Hapus kategori "${cat.name}"?`)) return
    try {
      const r = await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" })
      if (!r.ok) throw new Error("Gagal menghapus")
      setCategories((prev) => prev.filter((c) => c.id !== cat.id))
    } catch (e: any) { alert(e.message) }
  }
  const handleSave = async () => {
    setSaving(true)
    try {
      const body: any = { name: formName, slug: formSlug, description: formDesc }
      if (formParent !== "none") body.parentId = formParent
      const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : "/api/admin/categories"
      const method = editingCategory ? "PATCH" : "POST"
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!r.ok) throw new Error("Gagal menyimpan")
      const fresh = await fetch("/api/admin/categories").then((r) => r.json())
      setCategories(fresh.categories || [])
      setDialogOpen(false)
    } catch (e: any) { alert(e.message) }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-40 rounded bg-gray-200" />
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded bg-gray-200" />)}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
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
        <Button onClick={handleAdd}><Plus className="mr-2 h-4 w-4" />Tambah Kategori</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Daftar Kategori</CardTitle></CardHeader>
        <CardContent className="p-0">
          {categories.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <FolderTree className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-2">Belum ada kategori</p>
            </div>
          ) : (
            <div className="divide-y">{categories.map((cat) => <CategoryNode key={cat.id} category={cat} onEdit={handleEdit} onDelete={handleDelete} />)}</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCategory ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nama Kategori</label>
              <Input placeholder="Contoh: Hidroponik" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Slug</label>
              <Input placeholder="hidroponik" value={formSlug} onChange={(e) => setFormSlug(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Deskripsi</label>
              <Input placeholder="Deskripsi singkat..." value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
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
