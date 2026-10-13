"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "@/components/admin/image-uploader";
import { useToast } from "@/components/ui/use-toast";
import { slugify, formatPrice } from "@/lib/utils";
import Link from "next/link";
import { AdminRefreshButton } from "../../admin-refresh";

interface Category { id: string; name: string; }

interface VariantRow {
  id: string;
  name: string;
  sku: string;
  priceModifier: string;
  stock: string;
}

let variantIdSeq = 0;
function newVariantId(): string {
  variantIdSeq += 1;
  return `variant-${Date.now().toString(36)}-${variantIdSeq}`;
}

function emptyVariantRow(): VariantRow {
  return { id: newVariantId(), name: "", sku: "", priceModifier: "", stock: "" };
}

/** Serialisasi baris varian sesuai kontrak API: baris kosong diabaikan. */
function serializeVariants(rows: VariantRow[]) {
  return rows
    .filter((row) => row.name.trim() || row.sku.trim() || row.priceModifier.trim() || row.stock.trim())
    .map((row) => ({
      name: row.name.trim(),
      sku: row.sku.trim(),
      priceModifier: row.priceModifier.trim() ? Number(row.priceModifier) : 0,
      stock: row.stock.trim() ? Math.trunc(Number(row.stock)) : 0,
    }));
}

/** Validasi baris varian: nama wajib, SKU unik per produk, angka harga & stok valid. */
function validateVariants(rows: VariantRow[], productSku: string): { rowErrors: Record<string, string>; message: string } {
  const rowErrors: Record<string, string> = {};
  const skuCounts = new Map<string, number>();
  rows.forEach((row) => {
    const sku = row.sku.trim().toUpperCase();
    if (sku) skuCounts.set(sku, (skuCounts.get(sku) ?? 0) + 1);
  });

  const productKey = productSku.trim().toUpperCase();
  let message = "";
  rows.forEach((row, index) => {
    const label = `Varian #${index + 1}`;
    const name = row.name.trim();
    const sku = row.sku.trim();
    const price = Number(row.priceModifier);
    const stock = Number(row.stock);

    // Baris yang belum diisi sama sekali diabaikan (bukan error).
    if (!name && !sku && !row.priceModifier.trim() && !row.stock.trim()) return;

    let rowMessage = "";
    if (!name) rowMessage = `${label}: nama varian wajib diisi.`;
    else if (sku.length < 2) rowMessage = `${label}: SKU varian wajib diisi minimal 2 karakter.`;
    else if (row.priceModifier.trim() && !Number.isFinite(price)) rowMessage = `${label}: selisih harga harus berupa angka.`;
    else if (row.stock.trim() && (!Number.isInteger(stock) || stock < 0)) rowMessage = `${label}: stok harus bilangan bulat dan tidak boleh negatif.`;
    else if (sku.toUpperCase() === productKey) rowMessage = `${label}: SKU varian tidak boleh sama dengan SKU produk.`;
    else if ((skuCounts.get(sku.toUpperCase()) ?? 0) > 1) rowMessage = `${label}: SKU varian duplikat (${sku}). Setiap varian membutuhkan SKU unik.`;

    if (rowMessage) {
      rowErrors[row.id] = rowMessage;
      if (!message) message = rowMessage;
    }
  });

  return { rowErrors, message };
}

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
    basePrice: "", discountPrice: "", sku: "", weight: "", length: "", width: "", height: "", stock: "", featured: false, tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [variantErrors, setVariantErrors] = useState<Record<string, string>>({});

  const fetchCategories = useCallback(async () => {
    setLoadingCats(true);
    try {
      const r = await fetch("/api/admin/categories");
      if (!r.ok) throw new Error("Gagal memuat kategori");
      const d = await r.json();
      setCategories(d.categories ?? d ?? []);
    } catch {
      setCategories([]);
    } finally {
      setLoadingCats(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount updates the category loading state.
    void fetchCategories();
  }, [fetchCategories]);

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

  const addVariant = () => setVariants((prev) => [...prev, emptyVariantRow()]);
  const removeVariant = (id: string) => {
    setVariants((prev) => prev.filter((row) => row.id !== id));
    setVariantErrors((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };
  const updateVariant = useCallback((id: string, field: "name" | "sku" | "priceModifier" | "stock", value: string) => {
    setVariants((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
    setVariantErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const basePriceNumber = Number(form.basePrice);
  const hasValidBasePrice = Number.isFinite(basePriceNumber) && basePriceNumber > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const basePrice = Number(form.basePrice);
    const weightGram = Number(form.weight);
    const stock = Number(form.stock);
    const lengthCm = Number(form.length);
    const widthCm = Number(form.width);
    const heightCm = Number(form.height);

    if (!form.category) { setError("Pilih kategori produk terlebih dahulu."); return; }
    if (!Number.isFinite(basePrice) || basePrice <= 0) { setError("Harga dasar wajib diisi dan harus lebih dari 0."); return; }
    if (!Number.isFinite(weightGram) || weightGram <= 0) { setError("Berat produk wajib diisi dan harus lebih dari 0 gram."); return; }
    if (!Number.isFinite(stock) || stock < 0) { setError("Stok wajib diisi dan tidak boleh negatif."); return; }
    if (![lengthCm, widthCm, heightCm].every((value) => Number.isFinite(value) && value > 0)) { setError("Dimensi paket wajib diisi dalam cm."); return; }
    if (form.sku.trim().length < 2) { setError("SKU wajib diisi minimal 2 karakter."); return; }

    const variantCheck = validateVariants(variants, form.sku);
    if (variantCheck.message) { setVariantErrors(variantCheck.rowErrors); setError(variantCheck.message); return; }
    setVariantErrors({});

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
        lengthCm: Math.trunc(lengthCm),
        widthCm: Math.trunc(widthCm),
        heightCm: Math.trunc(heightCm),
        stock: Math.trunc(stock),
        isActive: true,
        isFeatured: form.featured,
        tags: form.tags,
        // Gambar pertama otomatis jadi primary (diproses ulang di API juga)
        images: images.map((url, index) => ({ url, sortOrder: index, isPrimary: index === 0 })),
        // Varian tersimpan bersama produk; daftar kosong = produk tanpa varian
        variants: serializeVariants(variants),
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/products"><Button variant="ghost" size="icon"><Icon name="arrow_back" size={20} /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Tambah Produk</h1>
            <p className="text-sm text-on-surface-variant">Buat produk baru untuk toko Anda</p>
          </div>
        </div>
        <AdminRefreshButton endpointPrefixes={["/api/admin/categories"]} onRefresh={fetchCategories} loading={loadingCats} />
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
                    <div className="h-10 animate-pulse rounded-lg bg-surface-container-low" />
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
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium">Dimensi Paket (cm)</p>
                  <div className="grid grid-cols-3 gap-3">
                    <Input label="Panjang" type="number" placeholder="30" value={form.length} onChange={(e) => updateField("length", e.target.value)} required />
                    <Input label="Lebar" type="number" placeholder="20" value={form.width} onChange={(e) => updateField("width", e.target.value)} required />
                    <Input label="Tinggi" type="number" placeholder="15" value={form.height} onChange={(e) => updateField("height", e.target.value)} required />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Dipakai untuk menghitung berat volumetrik ongkir.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">Varian Produk</CardTitle>
                  <p className="text-sm text-on-surface-variant">Opsional — untuk produk dengan beberapa pilihan (ukuran, warna, kemasan).</p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={addVariant} disabled={saving}>
                  <Icon name="add" size={16} className="mr-1" /> Tambah Varian
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {variants.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <Icon name="inventory_2" size={32} className="mx-auto text-gray-300" />
                    <p className="mt-2 text-sm text-on-surface-variant">Belum ada varian. Produk akan dijual dalam satu versi saja.</p>
                  </div>
                ) : (
                  variants.map((row, index) => {
                    const rowError = variantErrors[row.id];
                    const modifier = row.priceModifier.trim() ? Number(row.priceModifier) : 0;
                    const finalPrice = hasValidBasePrice && Number.isFinite(modifier) ? basePriceNumber + modifier : null;
                    return (
                      <div key={row.id} className={`rounded-lg border p-3 ${rowError ? "border-destructive" : "border-input"}`}>
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-medium">Varian {index + 1}</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => removeVariant(row.id)}
                            disabled={saving}
                            title="Hapus varian"
                          >
                            <Icon name="delete" size={16} />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <Input label="Nama Varian" placeholder="Contoh: Ukuran L" value={row.name} onChange={(e) => updateVariant(row.id, "name", e.target.value)} disabled={saving} />
                          <Input label="SKU Varian" placeholder="JF-HID-NFT6-L" value={row.sku} onChange={(e) => updateVariant(row.id, "sku", e.target.value)} disabled={saving} />
                          <Input label="Selisih Harga (Rp)" type="number" placeholder="0" value={row.priceModifier} onChange={(e) => updateVariant(row.id, "priceModifier", e.target.value)} disabled={saving} />
                          <Input label="Stok" type="number" placeholder="0" value={row.stock} onChange={(e) => updateVariant(row.id, "stock", e.target.value)} disabled={saving} />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs text-muted-foreground">Selisih harga menambah/mengurangi harga dasar varian. Kosongkan = 0.</p>
                          {finalPrice !== null && (
                            <p className="text-xs font-medium text-on-surface-variant">Harga akhir: {formatPrice(finalPrice)}</p>
                          )}
                        </div>
                        {rowError && <p className="mt-1 text-xs text-destructive">{rowError}</p>}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader><CardTitle className="text-lg">Gambar Produk</CardTitle></CardHeader>
              <CardContent>
                <ImageUploader value={images} onChange={setImages} disabled={saving} folder="products" />
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
                  <div className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${form.featured ? "bg-[#1B4D3E]" : "bg-surface-container"}`} onClick={() => updateField("featured", !form.featured)}>
                    <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.featured ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                  </div>
                </label>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Tag</label>
                  <div className="flex gap-2">
                    <Input placeholder="Tambah tag..." value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} />
                    <Button type="button" variant="secondary" size="icon" onClick={addTag}><Icon name="add" size={16} /></Button>
                  </div>
                  {form.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {form.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-[#1B4D3E]/10 px-2.5 py-0.5 text-xs font-medium text-[#1B4D3E]">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500"><Icon name="close" size={12} /></button>
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
