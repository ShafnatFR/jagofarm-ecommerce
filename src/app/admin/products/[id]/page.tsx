"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Upload, X, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { slugify } from "@/lib/utils"
import Link from "next/link"

const categoryOptions = ["Hidroponik", "Akuaponik", "Benih Ikan", "Nutrisi", "IoT & Smart Farm", "Tambak"]

const mockProduct = {
  id: "1",
  name: "Kit Hidroponik NFT 6 Lubang",
  slug: "kit-hidroponik-nft-6",
  category: "Hidroponik",
  description: "Sistem hidroponik NFT (Nutrient Film Technique) dengan 6 lubang tanam. Cocok untuk pemula yang ingin memulai berkebun hidroponik di rumah. Terbuat dari bahan food-grade yang aman dan tahan lama.",
  shortDescription: "Sistem NFT 6 lubang untuk pemula",
  basePrice: "850000",
  discountPrice: "750000",
  sku: "JF-HID-NFT6",
  weight: "2500",
  stock: "24",
  featured: true,
  tags: ["hidroponik", "nft", "pemula"],
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    name: "",
    slug: "",
    category: "",
    description: "",
    shortDescription: "",
    basePrice: "",
    discountPrice: "",
    sku: "",
    weight: "",
    stock: "",
    featured: false,
    tags: [] as string[],
  })
  const [tagInput, setTagInput] = useState("")

  useEffect(() => {
    // TODO: Fetch product by id from API
    // const res = await fetch(`/api/admin/products/${id}`)
    setForm({
      name: mockProduct.name,
      slug: mockProduct.slug,
      category: mockProduct.category,
      description: mockProduct.description,
      shortDescription: mockProduct.shortDescription,
      basePrice: mockProduct.basePrice,
      discountPrice: mockProduct.discountPrice,
      sku: mockProduct.sku,
      weight: mockProduct.weight,
      stock: mockProduct.stock,
      featured: mockProduct.featured,
      tags: mockProduct.tags,
    })
    setLoading(false)
  }, [id])

  const updateField = useCallback((field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !form.tags.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
      setTagInput("")
    }
  }

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: PUT to /api/admin/products/${id}
    router.push("/admin/products")
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1B4D3E] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Produk</h1>
            <p className="text-sm text-gray-500">Edit informasi produk #{id}</p>
          </div>
        </div>
        <Button variant="destructive" size="sm" type="button">
          <Trash2 className="mr-2 h-4 w-4" />
          Hapus
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Produk</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Nama Produk"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  required
                />
                <Input
                  label="Slug"
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Kategori</label>
                  <Select value={form.category} onValueChange={(v) => updateField("category", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Deskripsi Singkat</label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E]"
                    value={form.shortDescription}
                    onChange={(e) => updateField("shortDescription", e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Deskripsi Lengkap</label>
                  <textarea
                    className="flex min-h-[160px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E]"
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Harga & Stok</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Harga Dasar (Rp)"
                    type="number"
                    value={form.basePrice}
                    onChange={(e) => updateField("basePrice", e.target.value)}
                    required
                  />
                  <Input
                    label="Harga Diskon (Rp)"
                    type="number"
                    value={form.discountPrice}
                    onChange={(e) => updateField("discountPrice", e.target.value)}
                  />
                  <Input label="SKU" value={form.sku} onChange={(e) => updateField("sku", e.target.value)} />
                  <Input label="Berat (gram)" type="number" value={form.weight} onChange={(e) => updateField("weight", e.target.value)} />
                  <Input label="Stok" type="number" value={form.stock} onChange={(e) => updateField("stock", e.target.value)} required />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gambar Produk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                  <Upload className="mb-2 h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-500">Seret & lepas gambar di sini</p>
                  <p className="text-xs text-gray-400">atau klik untuk memilih</p>
                  <Button variant="secondary" size="sm" className="mt-3" type="button">Pilih File</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pengaturan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex cursor-pointer items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Produk Unggulan</p>
                    <p className="text-xs text-gray-400">Tampilkan di halaman utama</p>
                  </div>
                  <div
                    className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${form.featured ? "bg-[#1B4D3E]" : "bg-gray-200"}`}
                    onClick={() => updateField("featured", !form.featured)}
                  >
                    <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.featured ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                  </div>
                </label>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Tag</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Tambah tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" variant="secondary" size="icon" onClick={addTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {form.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {form.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-[#1B4D3E]/10 px-2.5 py-0.5 text-xs font-medium text-[#1B4D3E]">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1">Simpan Perubahan</Button>
            <Link href="/admin/products" className="flex-1">
              <Button variant="secondary" className="w-full" type="button">Batal</Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
