"use client";

import { useState, useEffect, useCallback, use } from "react";
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

interface ProductImageRow { id?: string; url: string; sortOrder?: number; isPrimary?: boolean; }

interface VariantRow {
  id: string;
  name: string;
  sku: string;
  priceModifier: string;
  stock: string;
}

interface VariantApiRow {
  id?: string;
  name?: string;
  sku?: string;
  priceModifier?: number | string | null;
  stock?: number | null;
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

/** Baris varian dari data produk yang sudah ada (harga dimuat sebagai number oleh API). */
function toVariantRows(list: unknown): VariantRow[] {
  if (!Array.isArray(list)) return [];
  return (list as VariantApiRow[])
    .filter((row) => row && typeof row === "object")
    .map((row) => ({
      id: typeof row.id === "string" && row.id ? row.id : newVariantId(),
      name: typeof row.name === "string" ? row.name : "",
      sku: typeof row.sku === "string" ? row.sku : "",
      priceModifier: row.priceModifier != null && Number.isFinite(Number(row.priceModifier)) ? String(Number(row.priceModifier)) : "",
      stock: row.stock != null && Number.isFinite(Number(row.stock)) ? String(Math.trunc(Number(row.stock))) : "",
    }));
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "", slug: "", category: "", description: "", shortDescription: "",
    basePrice: "", discountPrice: "", sku: "", weight: "", length: "", width: "", height: "", stock: "", featured: false, tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [variantErrors, setVariantErrors] = useState<Record<string, string>>({});

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    setLoadingCats(true);
    setError("");
    try {
      const [data, catData] = await Promise.all([
        fetch(`/api/admin/products/${id}`).then((r) => { if (!r.ok) throw new Error("Gagal memuat produk"); return r.json(); }),
        fetch("/api/admin/categories").then((r) => r.ok ? r.json() : { categories: [] }),
      ]);
      const product = data?.product ?? data ?? {};
      setForm({
        name: product.name ?? "", slug: product.slug ?? "", category: product.category?.id ?? product.categoryId ?? "",
        description: product.description ?? "", shortDescription: product.shortDesc ?? product.shortDescription ?? "",
        basePrice: product.basePrice != null ? String(product.basePrice) : "", discountPrice: product.discountPrice ? String(product.discountPrice) : "",
        sku: product.sku ?? "", weight: product.weightGram != null ? String(product.weightGram) : "", length: product.lengthCm != null ? String(product.lengthCm) : "",
        width: product.widthCm != null ? String(product.widthCm) : "", height: product.heightCm != null ? String(product.heightCm) : "", stock: product.stock != null ? String(product.stock) : "",
        featured: product.isFeatured ?? product.featured ?? false, tags: product.tags ?? [],
      });
      setImages((Array.isArray(product.images) ? (product.images as ProductImageRow[]) : []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).map((img) => img.url).filter((url): url is string => typeof url === "string" && url.length > 0));
      // Varian yang sudah ada dimuat ke editor baris (API mengirim priceModifier sebagai number)
      setVariants(toVariantRows(product.variants));
      setVariantErrors({});
      setCategories(catData.categories ?? catData ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      setLoadingCats(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount updates the form loading state.
    void fetchProduct()
  }, [fetchProduct]);

  const updateField = useCallback((field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) { setForm((p) => ({ ...p, tags: [...p.tags, tag] })); setTagInput(""); }
  };
  const removeTag = (tag: string) => setForm((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));

  const addVariant = () => setVariants((prev) => [...prev, emptyVariantRow()]);
  const removeVariant = (rowId: string) => {
    setVariants((prev) => prev.filter((row) => row.id !== rowId));
    setVariantErrors((prev) => {
      if (!(rowId in prev)) return prev;
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
  };
  const updateVariant = useCallback((rowId: string, field: "name" | "sku" | "priceModifier" | "stock", value: string) => {
    setVariants((prev) => prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
    setVariantErrors((prev) => {
      if (!prev[rowId]) return prev;
      const next = { ...prev };
      delete next[rowId];
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
        slug: form.slug.trim() || slugify(form.name),
        categoryId: form.category,
        description: form.description.trim() || null,
        shortDesc: form.shortDescription.trim() || null,
        basePrice,
        discountPrice: Number(form.discountPrice) > 0 ? Number(form.discountPrice) : null,
        sku: form.sku.trim(),
        weightGram: Math.trunc(weightGram),
        lengthCm: Math.trunc(lengthCm),
        widthCm: Math.trunc(widthCm),
        heightCm: Math.trunc(heightCm),
        stock: Math.trunc(stock),
        isFeatured: form.featured,
        tags: form.tags,
        // Daftar ini menggantikan gambar lama; gambar pertama jadi primary
        images: images.map((url, index) => ({ url, sortOrder: index, isPrimary: index === 0 })),
        // Varian dikirim sebagai daftar pengganti penuh; daftar kosong = hapus semua varian
        variants: serializeVariants(variants),
      };

      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data?.error === "string" ? data.error : "Gagal menyimpan perubahan.");
      }

      toast({ title: "Perubahan disimpan", description: "Data produk berhasil diperbarui." });
      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Hapus produk "${form.name || id}"?`)) return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(typeof data?.error === "string" ? data.error : "Gagal menghapus produk.");
      }
      toast({ title: "Produk dihapus", description: "Produk telah dinonaktifkan dari katalog." });
      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Gagal menghapus produk.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-surface-container-low" />)}
      </div>
    );
  }

  if (error && !form.name) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-on-surface-variant">{error}</p>
        <Link href="/admin/products"><Button variant="secondary">Kembali</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products"><Button variant="ghost" size="icon"><Icon name="arrow_back" size={20} /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Edit Produk</h1>
            <p className="text-sm text-on-surface-variant">Edit informasi produk #{id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AdminRefreshButton endpointPrefixes={[`/api/admin/products/${id}`, "/api/admin/categories"]} onRefresh={fetchProduct} loading={loading} />
          <Button variant="destructive" size="sm" type="button" onClick={handleDelete} disabled={deleting}><Icon name="delete" size={16} className="mr-2" />{deleting ? "Menghapus..." : "Hapus"}</Button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader><CardTitle className="text-lg">Informasi Produk</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input label="Nama Produk" value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
                <Input label="Slug" value={form.slug} onChange={(e) => updateField("slug", e.target.value)} />
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
                  <textarea className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" value={form.shortDescription} onChange={(e) => updateField("shortDescription", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Deskripsi Lengkap</label>
                  <textarea className="flex min-h-[160px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" value={form.description} onChange={(e) => updateField("description", e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader><CardTitle className="text-lg">Harga & Stok</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input label="Harga Dasar (Rp)" type="number" value={form.basePrice} onChange={(e) => updateField("basePrice", e.target.value)} required />
                  <Input label="Harga Diskon (Rp)" type="number" value={form.discountPrice} onChange={(e) => updateField("discountPrice", e.target.value)} />
                  <Input label="SKU" value={form.sku} onChange={(e) => updateField("sku", e.target.value)} required />
                  <Input label="Berat (gram)" type="number" value={form.weight} onChange={(e) => updateField("weight", e.target.value)} required />
                  <Input label="Panjang paket (cm)" type="number" value={form.length} onChange={(e) => updateField("length", e.target.value)} required />
                  <Input label="Lebar paket (cm)" type="number" value={form.width} onChange={(e) => updateField("width", e.target.value)} required />
                  <Input label="Tinggi paket (cm)" type="number" value={form.height} onChange={(e) => updateField("height", e.target.value)} required />
                  <Input label="Stok" type="number" value={form.stock} onChange={(e) => updateField("stock", e.target.value)} required />
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
                    <Icon name="inventory_2" size={32} className="mx-auto text-on-surface-variant/70" />
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
                            className="text-destructive hover:text-destructive"
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
                {/* Batas gambar diambil dari default ImageUploader = UPLOAD.MAX_IMAGES_PER_PRODUCT. */}
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
                    <p className="text-xs text-on-surface-variant">Tampilkan di halaman utama</p>
                  </div>
                  <div className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${form.featured ? "bg-primary" : "bg-surface-container"}`} onClick={() => updateField("featured", !form.featured)}>
                    <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-transform ${form.featured ? "translate-x-[22px]" : "translate-x-0.5"}`} />
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
                        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive"><Icon name="close" size={12} /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Menyimpan..." : "Simpan Perubahan"}</Button>
            <Link href="/admin/products" className="flex-1"><Button variant="secondary" className="w-full" type="button">Batal</Button></Link>
          </div>
        </div>
      </form>
    </div>
  );
}
