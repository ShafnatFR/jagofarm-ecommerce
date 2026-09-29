"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, X, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "@/components/admin/image-uploader";
import { useToast } from "@/components/ui/use-toast";
import { slugify } from "@/lib/utils";
import Link from "next/link";

interface Category { id: string; name: string; }

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", slug: "", category: "", description: "", shortDescription: "",
    basePrice: "", discountPrice: "", sku: "", weight: "", stock: "", featured: false, tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.ok ? r.json() : Promise.reject(r))
      .then((d) => setCategories(d.categories ?? d ?? []))
      .catch(() => {})
      .finally(() => setLoadingCats(false));
  }, []);

  const updateField = useCallback((field: string, value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "name" && typeof value === "string") next.slug = slugify(value);
      return next;
    });
  }, []);

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) { setForm((p) => ({ ...p, tags: [...p.tags, tag] })); setTagInput(""); }
  };
  const removeTag = (tag: string) => setForm((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const basePrice = Number(form.basePrice);
    const weightGram = Number(form.weight);
    const stock = Number(form.stock);

    if (!form.category) { setError("Pilih kategori produk terlebih dahulu."); return; }
    if (!Number.isFinite(basePrice) || basePrice <= 0) { setError("Harga dasar wajib diisi dan harus lebih dari 0."); return; }
    if (!Number.isFinite(weightGram) || weightGram <= 0) { setError("Berat produk wajib diisi dan harus lebih dari 0 gram."); return; }
    if (!Number.isFinite(stock) || stock < 0) { setError("Stok wajib diisi dan tidak boleh negatif."); return; }
    if (form.sku.trim().length < 2) { setError("SKU wajib diisi minimal 2 karakter."); return; }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        categoryId: form.category,
        description: form.description.trim() || undefined,
        shortDesc: form.shortDescription.trim() || undefined,
        basePrice,
        discountPrice: Number(form.discountPrice) > 0 ? Number(form.discountPrice) : null,
        sku: form.sku.trim(),
        weightGram: Math.trunc(weightGram),
        stock: Math.trunc(stock),
        isActive: true,
        isFeatured: form.featured,
        tags: form.tags,
        // Gambar pertama otomatis jadi primary (diproses ulang di API juga)
        images: images.map((url, index) => ({ url, sortOrder: index, isPrimary: index === 0 })),
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data?.error === "string" ? data.error : "Gagal menyimpan produk.");
      }

      toast({ title: "Produk dibuat", description: "Produk baru berhasil disimpan." });
      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Gagal menyimpan produk.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Produk</h1>
          <p className="text-sm text-gray-500">Buat produk baru untuk toko Anda</p>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader><CardTitle className="text-lg">Informasi Produk</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input label="Nama Produk" placeholder="Contoh: Kit Hidroponik NFT 6 Lubang" value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
                <Input label="Slug" placeholder="otomatis-dari-nama" value={form.slug} onChange={(e) => updateField("slug", e.target.value)} />
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Kategori</label>
                  {loadingCats ? (
                    <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
                  ) : (
                    <Select value={form.category} onValueChange={(v) => updateField("category", v)}>
                      <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Deskripsi Singkat</label>
                  <textarea className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E]" placeholder="Deskripsi pendek untuk kartu produk..." value={form.shortDescription} onChange={(e) => updateField("shortDescription", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Deskripsi Lengkap</label>
                  <textarea className="flex min-h-[160px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E]" placeholder="Deskripsi lengkap produk..." value={form.description} onChange={(e) => updateField("description", e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader><CardTitle className="text-lg">Harga & Stok</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input label="Harga Dasar (Rp)" type="number" placeholder="850000" value={form.basePrice} onChange={(e) => updateField("basePrice", e.target.value)} required />
                  <Input label="Harga Diskon (Rp)" type="number" placeholder="750000" value={form.discountPrice} onChange={(e) => updateField("discountPrice", e.target.value)} />
                  <Input label="SKU" placeholder="JF-HID-NFT6" value={form.sku} onChange={(e) => updateField("sku", e.target.value)} required />
                  <Input label="Berat (gram)" type="number" placeholder="2500" value={form.weight} onChange={(e) => updateField("weight", e.target.value)} required />
                  <Input label="Stok" type="number" placeholder="24" value={form.stock} onChange={(e) => updateField("stock", e.target.value)} required />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader><CardTitle className="text-lg">Gambar Produk</CardTitle></CardHeader>
              <CardContent>
                <ImageUploader value={images} onChange={setImages} max={6} disabled={saving} folder="products" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader><CardTitle className="text-lg">Pengaturan</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <label className="flex cursor-pointer items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Produk Unggulan</p>
                    <p className="text-xs text-gray-400">Tampilkan di halaman utama</p>
                  </div>
                  <div className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${form.featured ? "bg-[#1B4D3E]" : "bg-gray-200"}`} onClick={() => updateField("featured", !form.featured)}>
                    <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.featured ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                  </div>
                </label>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Tag</label>
                  <div className="flex gap-2">
                    <Input placeholder="Tambah tag..." value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} />
                    <Button type="button" variant="secondary" size="icon" onClick={addTag}><Plus className="h-4 w-4" /></Button>
                  </div>
                  {form.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {form.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-[#1B4D3E]/10 px-2.5 py-0.5 text-xs font-medium text-[#1B4D3E]">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Menyimpan..." : "Simpan Produk"}</Button>
            <Link href="/admin/products" className="flex-1"><Button variant="secondary" className="w-full" type="button">Batal</Button></Link>
          </div>
        </div>
      </form>
    </div>
  );
}
