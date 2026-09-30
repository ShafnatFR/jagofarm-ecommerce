"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Icon } from "@/components/ui/icon";
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatPrice } from "@/lib/utils"

/** Bentuk mentah produk dari GET /api/admin/products (toleran dua penamaan field). */
interface ProductApiItem {
  id: string; name: string; slug: string;
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
}
interface Category { id: string; name: string }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (category && category !== "all") params.set("category", category)
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
      }))))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [search, category])

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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus produk "${name}"?`)) return
    try {
      const r = await fetch(`/api/admin/products/${id}`, { method: "DELETE" })
      if (!r.ok) throw new Error("Gagal menghapus")
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="h-16 rounded-lg bg-gray-200" />
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded bg-gray-200" />)}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Icon name="info" size={40} className="mx-auto text-red-400" />
          <p className="mt-2 text-sm text-gray-600">Gagal memuat produk: {error}</p>
          <button onClick={() => location.reload()} className="mt-2 text-sm text-[#1B4D3E] underline">Coba lagi</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produk</h1>
          <p className="text-sm text-gray-500">{products.length} produk terdaftar</p>
        </div>
        <Link href="/admin/products/new"><Button><Icon name="add" size={16} className="mr-2" />Tambah Produk</Button></Link>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Kategori" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Icon name="inventory_2" size={40} className="mx-auto text-gray-300" />
              <p className="mt-2">Tidak ada produk ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/80 text-left text-gray-500">
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
                    <tr key={product.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            <div className="flex h-full w-full items-center justify-center text-gray-400"><Icon name="inventory_2" size={20} /></div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-400">/{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{product.category}</td>
                      <td className="px-4 py-3">
                        {product.discountPrice ? (
                          <div>
                            <span className="font-medium text-[#1B4D3E]">{formatPrice(product.discountPrice)}</span>
                            <span className="ml-2 text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
                          </div>
                        ) : <span className="font-medium">{formatPrice(product.price)}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={product.stock <= 10 ? "font-medium text-red-500" : "text-gray-600"}>{product.stock}</span>
                      </td>
                      <td className="px-4 py-3">
                        {product.featured && <Badge variant="warning">Unggulan</Badge>}
                        {product.stock === 0 && <Badge variant="destructive">Habis</Badge>}
                        {!product.featured && product.stock > 0 && <Badge variant="success">Aktif</Badge>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block">
                          <Button variant="ghost" size="icon" onClick={() => setActiveMenu(activeMenu === product.id ? null : product.id)}>
                            <Icon name="more_vert" size={16} />
                          </Button>
                          {activeMenu === product.id && (
                            <div className="absolute right-0 z-10 mt-1 w-40 rounded-lg border bg-white py-1 shadow-lg">
                              <Link href={`/admin/products/${product.id}`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50" onClick={() => setActiveMenu(null)}>
                                <Icon name="edit" size={16} /> Edit
                              </Link>
                              <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50" onClick={() => { setActiveMenu(null); handleDelete(product.id, product.name) }}>
                                <Icon name="delete" size={16} /> Hapus
                              </button>
                            </div>
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
    </div>
  )
}
