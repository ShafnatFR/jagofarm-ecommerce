"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { createPortal } from "react-dom"
import { Icon } from "@/components/ui/icon"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { formatPrice } from "@/lib/utils"
import { throwIfNotOk } from "@/lib/api-errors"
import { AdminErrorState } from "@/components/admin/error-state"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { AdminRefreshButton } from "../admin-refresh"

/** Bentuk mentah produk dari GET /api/admin/products (toleran dua penamaan field). */
interface ProductApiItem {
  id: string; name: string; slug: string;
  isActive?: boolean | null;
  category?: { name?: string | null } | string | null;
  basePrice?: number | string | null; price?: number | string | null;
  discountPrice?: number | string | null;
  stock?: number | null;
  images?: { url?: string | null }[] | null; image?: string | null;
  isFeatured?: boolean; featured?: boolean;
}

interface Product {
  id: string; name: string; slug: string; category: string; price: number
  discountPrice: number | null; stock: number; image: string; featured: boolean
  /** false = produk pernah "dihapus" (soft-delete: isActive false). */
  active: boolean
}
interface Category { id: string; name: string; slug: string }

export default function ProductsPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  // Filter status: API mendukung status=active|inactive|all.
  const [status, setStatus] = useState("all")
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
    const [menuAnchor, setMenuAnchor] = useState<HTMLButtonElement | null>(null)
  // Dialog konfirmasi hapus: produk yang akan dinonaktifkan (null = tertutup)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

    const fetchData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (category && category !== "all") params.set("category", category)
    if (status && status !== "all") params.set("status", status)
    fetch(`/api/admin/products?${params}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d) => setProducts((d.products || []).map((p: ProductApiItem) => ({
        id: p.id, name: p.name, slug: p.slug,
        category: typeof p.category === "string" ? p.category : p.category?.name || "",
        price: Number(p.basePrice || p.price || 0),
        discountPrice: p.discountPrice != null ? Number(p.discountPrice) : null,
        stock: p.stock ?? 0,
        image: p.images?.[0]?.url || p.image || "",
        featured: p.isFeatured ?? p.featured ?? false,
        active: p.isActive ?? true,
      }))))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [search, category, status])

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setTimeout(fetchData, 300)
    return () => clearTimeout(timer)
  }, [fetchData])

  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      const r = await fetch(`/api/admin/products/${confirmDelete.id}`, { method: "DELETE" })
      await throwIfNotOk(r, "Gagal menghapus produk")
      toast({ title: "Produk dinonaktifkan", description: "Produk disembunyikan dari katalog dan bisa diaktifkan kembali.", variant: "success" })
      setConfirmDelete(null)
      // JANGAN hilangkan baris dari daftar: produk tetap ada di DB (soft-delete).
      // Muat ulang agar badge "Nonaktif" langsung terlihat — feedback jujur
      // bahwa produk berstatus nonaktif, bukan hilang.
      fetchData()
    } catch (e) {
      toast({ title: "Gagal menghapus produk", description: e instanceof Error ? e.message : String(e), variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded bg-surface-container" />
        <div className="h-16 rounded-lg bg-surface-container" />
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded bg-surface-container" />)}</div>
      </div>
    )
  }

  if (error) {
    // Pesan humanis per skenario HTTP: 401 → tombol login, 403 → akses admin,
    // lainnya → tombol coba lagi. (403 juga nonaktifkan retry — membantu tanpa
    // berguna bila akun memang bukan admin.)
    return <AdminErrorState message={error} onRetry={fetchData} />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Produk</h1>
          <p className="text-sm text-on-surface-variant">{products.length} produk terdaftar</p>
        </div>
        <div className="flex items-center gap-2">
          <AdminRefreshButton endpointPrefixes={["/api/admin/products", "/api/admin/categories"]} onRefresh={() => fetchData()} loading={loading} />
          <Link href="/admin/products/new"><Button><Icon name="add" size={16} className="mr-2" />Tambah Produk</Button></Link>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <Input placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Kategori" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant">
              <Icon name="inventory_2" size={40} className="mx-auto text-on-surface-variant/70" />
              <p className="mt-2">Tidak ada produk ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-surface-container-low/80 text-left text-on-surface-variant">
                    <th className="px-4 py-3 font-medium">Produk</th>
                    <th className="px-4 py-3 font-medium">Kategori</th>
                    <th className="px-4 py-3 font-medium">Harga</th>
                    <th className="px-4 py-3 font-medium">Stok</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, i) => (
                    <tr key={product.id} className={i % 2 === 0 ? "bg-surface" : "bg-surface-container-low/50"}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-container-low">
                            <div className="flex h-full w-full items-center justify-center text-on-surface-variant"><Icon name="inventory_2" size={20} /></div>
                          </div>
                          <div>
                            <p className="font-medium text-on-surface">{product.name}</p>
                            <p className="text-xs text-on-surface-variant">/{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">{product.category}</td>
                      <td className="px-4 py-3">
                        {product.discountPrice ? (
                          <div>
                            <span className="font-medium text-primary">{formatPrice(product.discountPrice)}</span>
                            <span className="ml-2 text-xs text-on-surface-variant line-through">{formatPrice(product.price)}</span>
                          </div>
                        ) : <span className="font-medium">{formatPrice(product.price)}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={product.stock <= 10 ? "font-medium text-destructive" : "text-on-surface-variant"}>{product.stock}</span>
                      </td>
                      <td className="px-4 py-3">
                        {!product.active ? (
                          /* Soft-delete: produk dinonaktifkan — tunjukkan jelas
                             agar tidak dikira delete "tidak jalan". */
                          <Badge variant="secondary">Nonaktif</Badge>
                        ) : (
                          <>
                            {product.featured && <Badge variant="warning">Unggulan</Badge>}
                            {product.stock === 0 && <Badge variant="destructive">Habis</Badge>}
                            {product.stock > 0 && product.stock <= 10 && <Badge variant="warning">Menipis</Badge>}
                            {!product.featured && product.stock > 10 && <Badge variant="success">Aktif</Badge>}
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                                              <div className="relative inline-block">
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={(e) => {
                                                    const btn = e.currentTarget
                                                    setMenuAnchor(btn)
                                                    setActiveMenu(activeMenu === product.id ? null : product.id)
                                                  }}
                                                >
                                                  <Icon name="more_vert" size={16} />
                                                </Button>
                                                {activeMenu === product.id && menuAnchor && createPortal(
                                                  <div className="fixed z-50 w-40 rounded-lg border bg-surface py-1 shadow-lg" style={{
                                                    top: menuAnchor.getBoundingClientRect().bottom + window.scrollY,
                                                    left: menuAnchor.getBoundingClientRect().right - 160
                                                  }}>
                                                    <Link href={`/admin/products/${product.id}`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-container-low" onClick={() => { setActiveMenu(null); setMenuAnchor(null) }}>
                                                      <Icon name="edit" size={16} /> Edit
                                                    </Link>
                                                    <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10" onClick={() => { setActiveMenu(null); setMenuAnchor(null); setConfirmDelete({ id: product.id, name: product.name }) }}>
                                                      <Icon name="delete" size={16} /> Hapus
                                                    </button>
                                                  </div>,
                                                  document.body
                                                )}
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

      {/* Konfirmasi nonaktifkan produk — menggantikan confirm() browser */}
      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => { if (!open) setConfirmDelete(null) }}
        title={`Nonaktifkan produk "${confirmDelete?.name ?? ""}"?`}
        description={"Produk tidak dihapus permanen dari database — hanya dinonaktifkan dari katalog dan bisa diaktifkan kembali."}
        confirmLabel="Ya, nonaktifkan"
        loading={deleting}
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  )
}
