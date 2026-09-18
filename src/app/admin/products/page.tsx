"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Plus, Search, MoreVertical, Edit, Trash2, Eye, Package } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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
import { formatPrice } from "@/lib/utils"

const mockProducts = [
  { id: "1", name: "Kit Hidroponik NFT 6 Lubang", slug: "kit-hidroponik-nft-6", category: "Hidroponik", price: 850_000, discountPrice: 750_000, stock: 24, image: "/images/products/hidroponik-nft.jpg", featured: true },
  { id: "2", name: "Set Akuaponik Mini Desktop", slug: "akuaponik-mini-desktop", category: "Akuaponik", price: 1_250_000, discountPrice: null, stock: 12, image: "/images/products/akuaponik-mini.jpg", featured: false },
  { id: "3", name: "Benih Lele Sangkuriang 100 Ekor", slug: "benih-lele-sangkuriang", category: "Benih Ikan", price: 75_000, discountPrice: 65_000, stock: 200, image: "/images/products/benih-lele.jpg", featured: false },
  { id: "4", name: "Pupuk AB Mix Hidroponik 1 Liter", slug: "pupuk-ab-mix-1l", category: "Nutrisi", price: 45_000, discountPrice: null, stock: 150, image: "/images/products/ab-mix.jpg", featured: true },
  { id: "5", name: "IoT Smart Farm Controller v2", slug: "iot-smart-farm-v2", category: "IoT & Smart Farm", price: 2_500_000, discountPrice: 2_200_000, stock: 5, image: "/images/products/iot-controller.jpg", featured: true },
  { id: "6", name: "Tambak Bioflok Kit Pemula", slug: "tambak-bioflok-pemula", category: "Tambak", price: 3_500_000, discountPrice: null, stock: 8, image: "/images/products/bioflok-kit.jpg", featured: false },
]

const categories = ["Semua", "Hidroponik", "Akuaponik", "Benih Ikan", "Nutrisi", "IoT & Smart Farm", "Tambak"]

export default function ProductsPage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("Semua")
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  const filtered = mockProducts.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === "Semua" || p.category === category
    return matchSearch && matchCat
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produk</h1>
          <p className="text-sm text-gray-500">{mockProducts.length} produk terdaftar</p>
        </div>
        <Link href="/admin/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Produk
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
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
                {filtered.map((product, i) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <Package className="h-5 w-5" />
                          </div>
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
                      ) : (
                        <span className="font-medium">{formatPrice(product.price)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={product.stock <= 10 ? "font-medium text-red-500" : "text-gray-600"}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {product.featured && <Badge variant="warning">Unggulan</Badge>}
                      {product.stock === 0 && <Badge variant="destructive">Habis</Badge>}
                      {!product.featured && product.stock > 0 && <Badge variant="success">Aktif</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setActiveMenu(activeMenu === product.id ? null : product.id)}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        {activeMenu === product.id && (
                          <div className="absolute right-0 z-10 mt-1 w-40 rounded-lg border bg-white py-1 shadow-lg">
                            <Link
                              href={`/admin/products/${product.id}`}
                              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                              onClick={() => setActiveMenu(null)}
                            >
                              <Edit className="h-4 w-4" /> Edit
                            </Link>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              onClick={() => setActiveMenu(null)}
                            >
                              <Trash2 className="h-4 w-4" /> Hapus
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      Tidak ada produk ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
