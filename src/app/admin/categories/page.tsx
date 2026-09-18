"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FolderTree, Plus, Edit, Trash2, ChevronRight, ChevronDown, X } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface Category {
  id: string
  name: string
  slug: string
  productCount: number
  children: Category[]
}

const mockCategories: Category[] = [
  {
    id: "1", name: "Hidroponik", slug: "hidroponik", productCount: 15,
    children: [
      { id: "1a", name: "Kit NFT", slug: "kit-nft", productCount: 5, children: [] },
      { id: "1b", name: "Kit DWC", slug: "kit-dwc", productCount: 4, children: [] },
      { id: "1c", name: "Aksesoris Hidroponik", slug: "aksesoris-hidroponik", productCount: 6, children: [] },
    ],
  },
  {
    id: "2", name: "Akuaponik", slug: "akuaponik", productCount: 8,
    children: [
      { id: "2a", name: "Set Akuaponik", slug: "set-akuaponik", productCount: 3, children: [] },
    ],
  },
  {
    id: "3", name: "Benih Ikan", slug: "benih-ikan", productCount: 12,
    children: [
      { id: "3a", name: "Lele", slug: "lele", productCount: 4, children: [] },
      { id: "3b", name: "Nila", slug: "nila", productCount: 5, children: [] },
      { id: "3c", name: "Gurame", slug: "gurame", productCount: 3, children: [] },
    ],
  },
  { id: "4", name: "Nutrisi", slug: "nutrisi", productCount: 6, children: [] },
  { id: "5", name: "IoT & Smart Farm", slug: "iot-smart-farm", productCount: 4, children: [] },
  { id: "6", name: "Tambak", slug: "tambak", productCount: 3, children: [] },
]

function CategoryNode({
  category,
  depth = 0,
  onEdit,
  onDelete,
}: {
  category: Category
  depth?: number
  onEdit: (cat: Category) => void
  onDelete: (cat: Category) => void
}) {
  const [expanded, setExpanded] = useState(depth === 0)
  const hasChildren = category.children.length > 0

  return (
    <div>
      <div
        className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50 ${depth > 0 ? "ml-6" : ""}`}
      >
        <div className="flex items-center gap-2">
          {hasChildren ? (
            <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <div className="w-4" />
          )}
          <FolderTree className="h-4 w-4 text-[#1B4D3E]" />
          <span className="font-medium">{category.name}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            {category.productCount} produk
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(category)} className="h-8 w-8">
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(category)} className="h-8 w-8 text-red-500 hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {category.children.map((child) => (
              <CategoryNode key={child.id} category={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
            ))}
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
    result.push(...flattenCategories(cat.children, prefix + cat.name + " / "))
  }
  return result
}

export default function CategoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formName, setFormName] = useState("")
  const [formParent, setFormParent] = useState("none")

  const allCategories = flattenCategories(mockCategories)

  const handleAdd = () => {
    setEditingCategory(null)
    setFormName("")
    setFormParent("none")
    setDialogOpen(true)
  }

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat)
    setFormName(cat.name)
    setFormParent("none")
    setDialogOpen(true)
  }

  const handleDelete = (cat: Category) => {
    // TODO: Confirm and delete
    alert(`Hapus kategori "${cat.name}"?`)
  }

  const handleSave = () => {
    // TODO: POST/PUT to API
    setDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kategori</h1>
          <p className="text-sm text-gray-500">Kelola kategori produk</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Kategori
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Kategori</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {mockCategories.map((cat) => (
              <CategoryNode key={cat.id} category={cat} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              label="Nama Kategori"
              placeholder="Contoh: Hidroponik"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium">Kategori Induk</label>
              <Select value={formParent} onValueChange={setFormParent}>
                <SelectTrigger>
                  <SelectValue placeholder="Tidak ada (kategori utama)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada (kategori utama)</SelectItem>
                  {allCategories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave}>{editingCategory ? "Simpan" : "Tambah"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
