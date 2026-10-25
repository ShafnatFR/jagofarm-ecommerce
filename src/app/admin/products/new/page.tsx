"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { NumericKeypad } from "@/components/admin/numeric-keypad";
import { registerAdminAction } from "@/hooks/use-admin-shortcuts";

interface Category { id: string; name: string; }

// ======== TIPE DATA UNTUK VARIAN MULTI-DIMENSI ========

/** Grup opsi varian (dimensi). Contoh: "Ukuran", "Warna". */
interface OptionGroup {
  id: string;
  name: string;       // "Ukuran", "Warna", dll
  options: OptionValue[];
}

/** Nilai dalam satu grup. Contoh: "S", "M", "L", "XL". */
interface OptionValue {
  id: string;
  value: string;      // "Merah", "XL", dll
}

/** Kombinasi varian yang dihasilkan dari opsi. */
interface VariantCombination {
  id: string;
  name?: string;       // untuk internal use (auto-generated)
  sku: string;
  price: string;          // harga absolut
  discountPrice: string;  // diskon spesifik varian (opsional)
  stock: string;
  weight: string;
  /** Referensi ke opsi yang dipilih: [{groupId, optionId}, ...] */
  selectedOptions: { groupId: string; optionId: string; groupLabel: string; optionLabel: string }[];
  images: string[];       // gambar spesifik varian
}

// ======== HELPER FUNCTIONS ========

/**
 * Generate SKU dari nama produk.
 * 
 * Aturan:
 * - Ambil 3-4 kata pertama (maks 12 karakter total)
 * - Uppercase + dash separator
 * - Hapus karakter non-alphanumeric
 * - Contoh: "Kaos Polos Cotton Combed 30s" → "KAOS-POL-COT-COM"
 * Contoh: "Set Tambak Lengkap" → "SET-TAM-LEN"
 */
function generateProductSKU(productName: string): string {
  if (!productName.trim()) return "";
  
  // Split kata, filter kosong, ambil maks 4 kata
  const words = productName.trim()
    .replace(/[^a-zA-Z0-9\s]/g, "") // hapus karakter khusus
    .split(/\s+/)
    .filter(w => w.length > 0)
    .slice(0, 4);
  
  if (words.length === 0) return "";
  
  // Truncate setiap kata: kata pertama max 6, lainnya max 3
  const truncated = words.map((w, i) => 
    i === 0 ? w.substring(0, 6).toUpperCase() : w.substring(0, 3).toUpperCase()
  );
  
  return truncated.join("-");
}

/**
 * Generate SKU varian dari base SKU + opsi yang dipilih.
 * Contoh: base="KAOS-POL", ops=["S", "Merah"] → "KAOS-POL-S-MER"
 */
function generateVariantSKU(baseSKU: string, optionLabels: string[]): string {
  const prefix = baseSKU || "PROD";
  // Ambil 3 karakter pertama setiap opsi, uppercase, hapus spesial
  const suffix = optionLabels
    .map(opt => opt.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase())
    .join("-");
  return `${prefix}-${suffix}`;
}

let idSeq = 0;
function newId(prefix: string = "id"): string {
  idSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${idSeq}`;
}

function emptyOptionGroup(): OptionGroup {
  return { id: newId("og"), name: "", options: [] };
}

function emptyOptionValue(): OptionValue {
  return { id: newId("ov"), value: "" };
}

function emptyCombination(): VariantCombination {
  return {
    id: newId("vc"),
    sku: "",
    price: "",
    discountPrice: "",
    stock: "",
    weight: "",
    selectedOptions: [],
    images: [],
  };
}

/**
 * Generate semua kombinasi Cartesian dari opsi-opsi yang ada.
 * Contoh: Ukuran=[S,M] × Warna=[Merah,Hitam] → 4 kombinasi.
 */
function generateCombinations(groups: OptionGroup[], baseSKU: string = ""): VariantCombination[] {
  const activeGroups = groups.filter(g => g.name.trim() && g.options.length > 0);
  if (activeGroups.length === 0) return [];

  // Build cartesian product
  const result: VariantCombination[] = [];

  function build(index: number, current: VariantCombination["selectedOptions"]) {
    if (index === activeGroups.length) {
      // Generate nama & SKU otomatis dari kombinasi
      const labels = current.map(o => o.optionLabel);
      const name = labels.join(" / ");
      
      // Gunakan base SKU produk + opsi untuk generate SKU varian
      const sku = generateVariantSKU(baseSKU, labels);
      
      result.push({
        ...emptyCombination(),
        name, // untuk internal use
        sku,
        selectedOptions: current,
      });
      return;
    }

    const group = activeGroups[index];
    for (const opt of group.options) {
      if (!opt.value.trim()) continue;
      build(index + 1, [
        ...current,
        {
          groupId: group.id,
          optionId: opt.id,
          groupLabel: group.name.trim(),
          optionLabel: opt.value.trim(),
        },
      ]);
    }
  }

  build(0, []);
  return result;
}

/**
 * Format rentang harga dari kombinasi untuk pratinjau.
 */
function formatPriceRange(combinations: VariantCombination[]): string | null {
  const prices = combinations
    .map(c => c.price.trim() ? Number(c.price) : NaN)
    .filter(v => Number.isFinite(v) && v > 0);
  
  if (prices.length === 0) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatPrice(min) : `${formatPrice(min)} - ${formatPrice(max)}`;
}

/**
 * Validasi kombinasi varian.
 */
function validateCombinations(combinations: VariantCombination[], productSku: string): {
  errors: Record<string, string>;
  message: string;
} {
  const errors: Record<string, string> = {};
  const skuCounts = new Map<string, number>();
  
  combinations.forEach(c => {
    const sku = c.sku.trim().toUpperCase();
    if (sku) skuCounts.set(sku, (skuCounts.get(sku) ?? 0) + 1);
  });

  const productKey = productSku.trim().toUpperCase();
  let message = "";

  combinations.forEach((c, idx) => {
    const label = c.selectedOptions.length > 0 
      ? c.selectedOptions.map(o => o.optionLabel).join(" / ")
      : `Kombinasi #${idx + 1}`;
    
    const price = Number(c.price);
    const stock = Number(c.stock);
    const weight = Number(c.weight);
    const discount = Number(c.discountPrice);

    let msg = "";
    
    if (!c.sku.trim()) msg = `${label}: SKU wajib diisi.`;
    else if (c.sku.trim().length < 2) msg = `${label}: SKU minimal 2 karakter.`;
    else if (!c.price.trim() || !Number.isFinite(price) || price <= 0) msg = `${label}: harga wajib > 0.`;
    else if (c.stock.trim() && (!Number.isInteger(stock) || stock < 0)) msg = `${label}: stok tidak valid.`;
    else if (c.weight.trim() && (!Number.isInteger(weight) || weight <= 0)) msg = `${label}: berat tidak valid.`;
    else if (c.discountPrice.trim() && (!Number.isFinite(discount) || discount <= 0 || discount >= price)) msg = `${label}: diskon harus > 0 dan < harga.`;
    else if (c.sku.trim().toUpperCase() === productKey) msg = `${label}: SKU tidak boleh sama dengan produk.`;
    else if ((skuCounts.get(c.sku.trim().toUpperCase()) ?? 0) > 1) msg = `${label}: SKU duplikat (${c.sku}).`;

    if (msg) {
      errors[c.id] = msg;
      if (!message) message = msg;
    }
  });

  return { errors, message };
}

/**
 * Serialisasi kombinasi untuk dikirim ke API.
 */
function serializeCombinations(combinations: VariantCombination[]) {
  return combinations
    .filter(c => c.sku.trim() || c.price.trim())
    .map((c, index) => ({
      name: c.selectedOptions.map(o => o.optionLabel).join(" / ") || `Varian ${index + 1}`,
      sku: c.sku.trim(),
      price: c.price.trim() ? Number(c.price) : 0,
      discountPrice: c.discountPrice.trim() ? Number(c.discountPrice) : null,
      stock: c.stock.trim() ? Math.trunc(Number(c.stock)) : 0,
      weightGram: c.weight.trim() ? Math.trunc(Number(c.weight)) : null,
      isActive: true,
      sortOrder: index,
      optionCombination: c.selectedOptions.map(o => ({
        groupId: o.groupId,
        optionId: o.optionId,
      })),
      images: c.images.map((url, i) => ({
        url,
        sortOrder: i,
        isPrimary: i === 0,
      })),
    }));
}

// ======== KOMPONEN UTAMA ========

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
  
  // State varian multi-dimensi
  const [hasVariants, setHasVariants] = useState(false);
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [combinations, setCombinations] = useState<VariantCombination[]>([]);
  const [combinationErrors, setCombinationErrors] = useState<Record<string, string>>({});

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
    void fetchCategories();
  }, [fetchCategories]);

  // Alt+S: submit form tambah produk (ditangani global via requestSubmit fallback).
  useEffect(() => {
    return registerAdminAction("page-save", () => {
      document.querySelector<HTMLFormElement>('form')?.requestSubmit();
    });
  }, []);

  const updateField = useCallback((field: string, value: string | boolean) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === "name" && typeof value === "string") {
        next.slug = slugify(value);
        // Auto-generate SKU dari nama produk (hanya jika SKU masih kosong atau belum di-edit manual)
        if (!prev.sku || prev.sku === generateProductSKU(prev.name)) {
          next.sku = generateProductSKU(value);
        }
      }
      return next;
    });
  }, []);

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) { setForm(p => ({ ...p, tags: [...p.tags, tag] })); setTagInput(""); }
  };
  const removeTag = (tag: string) => setForm(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }));

  // ======== MANAJEMEN Opsi GRUP ========
  
  const addOptionGroup = () => {
    if (optionGroups.length >= 3) {
      setError("Maksimal 3 grup opsi varian (standar Shopify).");
      return;
    }
    setOptionGroups(prev => [...prev, emptyOptionGroup()]);
    setError("");
  };

  const removeOptionGroup = (groupId: string) => {
    setOptionGroups(prev => prev.filter(g => g.id !== groupId));
    // Regenerate kombinasi jika ada
    if (combinations.length > 0) {
      const remaining = optionGroups.filter(g => g.id !== groupId);
      setCombinations(generateCombinations(remaining));
    }
  };

  const updateOptionGroupName = (groupId: string, name: string) => {
    setOptionGroups(prev => prev.map(g => g.id === groupId ? { ...g, name } : g));
  };

  const addOptionValue = (groupId: string) => {
    setOptionGroups(prev => prev.map(g => 
      g.id === groupId ? { ...g, options: [...g.options, emptyOptionValue()] } : g
    ));
  };

  const removeOptionValue = (groupId: string, optionId: string) => {
    setOptionGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, options: g.options.filter(o => o.id !== optionId) } : g
    ));
  };

  const updateOptionValue = (groupId: string, optionId: string, value: string) => {
    setOptionGroups(prev => prev.map(g =>
      g.id === groupId 
        ? { ...g, options: g.options.map(o => o.id === optionId ? { ...o, value } : o) }
        : g
    ));
  };

  // ======== GENERATE KOMBINASI ========

  const handleGenerateCombinations = () => {
    // Validasi: minimal 1 grup dengan minimal 1 opsi
    const validGroups = optionGroups.filter(g => g.name.trim() && g.options.some(o => o.value.trim()));
    
    if (validGroups.length === 0) {
      setError("Tambahkan minimal 1 grup opsi dengan minimal 1 nilai.");
      return;
    }

    const newCombinations = generateCombinations(optionGroups, form.sku);
    
    if (newCombinations.length === 0) {
      setError("Tidak bisa membuat kombinasi. Pastikan setiap grup punya nilai.");
      return;
    }

    // Preservasi data existing jika mungkin (match by selectedOptions)
    const existingMap = new Map<string, VariantCombination>();
    combinations.forEach(c => {
      const key = c.selectedOptions.map(o => `${o.groupId}:${o.optionId}`).sort().join("|");
      existingMap.set(key, c);
    });

    const merged = newCombinations.map(nc => {
      const key = nc.selectedOptions.map(o => `${o.groupId}:${o.optionId}`).sort().join("|");
      const existing = existingMap.get(key);
      if (existing) {
        return { ...nc, sku: existing.sku, price: existing.price, discountPrice: existing.discountPrice, stock: existing.stock, weight: existing.weight, images: existing.images };
      }
      return nc;
    });

    setCombinations(merged);
    setCombinationErrors({});
    setError("");
  };

  // ======== MANAJEMEN KOMBINASI ========

  const updateCombination = (combId: string, field: keyof VariantCombination, value: string | string[]) => {
    setCombinations(prev => prev.map(c => 
      c.id === combId ? { ...c, [field]: value } : c
    ));
    setCombinationErrors(prev => {
      if (!(combId in prev)) return prev;
      const next = { ...prev };
      delete next[combId];
      return next;
    });
  };

  const removeCombination = (combId: string) => {
    setCombinations(prev => prev.filter(c => c.id !== combId));
    setCombinationErrors(prev => {
      if (!(combId in prev)) return prev;
      const next = { ...prev };
      delete next[combId];
      return next;
    });
  };

  // ======== SUBMIT ========

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
    if (!Number.isFinite(weightGram) || weightGram <= 0) { setError("Berat produk wajib diisi dan harus lebih dari 0 gram."); return; }
    if (![lengthCm, widthCm, heightCm].every(v => Number.isFinite(v) && v > 0)) { setError("Dimensi paket wajib diisi dalam cm."); return; }
    if (form.sku.trim().length < 2) { setError("SKU wajib diisi minimal 2 karakter."); return; }

    if (hasVariants) {
      // Validasi opsi & kombinasi
      if (optionGroups.length === 0) { setError("Tambahkan minimal 1 grup opsi varian."); return; }
      if (combinations.length === 0) { setError("Generate kombinasi varian terlebih dahulu."); return; }
      
      const comboCheck = validateCombinations(combinations, form.sku);
      if (comboCheck.message) { setCombinationErrors(comboCheck.errors); setError(comboCheck.message); return; }
      setCombinationErrors({});
    } else {
      if (!Number.isFinite(basePrice) || basePrice <= 0) { setError("Harga dasar wajib diisi dan harus lebih dari 0."); return; }
      if (!Number.isFinite(stock) || stock < 0) { setError("Stok wajib diisi dan tidak boleh negatif."); return; }
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        categoryId: form.category,
        description: form.description.trim() || undefined,
        shortDesc: form.shortDescription.trim() || undefined,
        basePrice: hasVariants 
          ? (combinations.length > 0 ? (Number(combinations[0].price) || 1) : 1)
          : basePrice,
        discountPrice: !hasVariants && Number(form.discountPrice) > 0 ? Number(form.discountPrice) : null,
        sku: form.sku.trim(),
        weightGram: Math.trunc(weightGram),
        lengthCm: Math.trunc(lengthCm),
        widthCm: Math.trunc(widthCm),
        heightCm: Math.trunc(heightCm),
        stock: hasVariants ? 0 : Math.trunc(stock),
        isActive: true,
        isFeatured: form.featured,
        tags: form.tags,
        hasVariants,
        images: images.map((url, index) => ({ url, sortOrder: index, isPrimary: index === 0 })),
      };

      // Tambahkan data varian multi-dimensi
      if (hasVariants) {
        payload.optionGroups = optionGroups
          .filter(g => g.name.trim())
          .map((g, gi) => ({
            name: g.name.trim(),
            sortOrder: gi,
            options: g.options
              .filter(o => o.value.trim())
              .map((opt, optIdx) => ({ value: opt.value.trim(), sortOrder: optIdx })),
          }));

        payload.variants = serializeCombinations(combinations);
      }

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

  // Hitung jumlah kombinasi yang akan di-generate (untuk preview)
  const expectedComboCount = useMemo(() => {
    const counts = optionGroups
      .map(g => g.options.filter(o => o.value.trim()).length)
      .filter(c => c > 0);
    if (counts.length === 0) return 0;
    return counts.reduce((a, b) => a * b, 1);
  }, [optionGroups]);

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

      {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* KOLOM KIRI (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Card Informasi Produk */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader><CardTitle className="text-lg">Informasi Produk</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input label="Nama Produk" placeholder="Contoh: Kaos Polos Cotton Combed" value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
                <Input label="Slug" placeholder="otomatis-dari-nama" value={form.slug} onChange={(e) => updateField("slug", e.target.value)} />
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Kategori</label>
                  {loadingCats ? (
                    <div className="h-10 animate-pulse rounded-lg bg-surface-container-low" />
                  ) : (
                    <Select value={form.category} onValueChange={(v) => updateField("category", v)}>
                      <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Deskripsi Singkat</label>
                  <textarea className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" placeholder="Deskripsi pendek untuk kartu produk..." value={form.shortDescription} onChange={(e) => updateField("shortDescription", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Deskripsi Lengkap</label>
                  <textarea className="flex min-h-[160px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" placeholder="Deskripsi lengkap produk..." value={form.description} onChange={(e) => updateField("description", e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card Harga & Stok */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">{hasVariants ? "Harga & Stok Produk" : "Harga & Stok"}</CardTitle>
                  <p className="text-sm text-on-surface-variant">
                    {hasVariants
                      ? "Harga, stok, dan gambar diatur per kombinasi varian."
                      : "Berlaku untuk seluruh produk karena tidak ada varian."}
                  </p>
                </div>
                <label className="flex shrink-0 cursor-pointer items-center gap-2.5 rounded-lg border border-input px-3 py-2">
                  <span className="text-xs font-medium text-on-surface">Ada varian</span>
                  <div
                    role="switch"
                    tabIndex={0}
                    aria-checked={hasVariants}
                    aria-label="Produk ini punya varian"
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setHasVariants(v => !v); }}}
                    onClick={() => setHasVariants(v => !v)}
                    className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${hasVariants ? "bg-primary" : "bg-surface-container"}`}
                  >
                    <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-transform ${hasVariants ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                  </div>
                </label>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {!hasVariants && (
                    <>
                      <Input label="Harga Dasar (Rp)" type="number" placeholder="850000" value={form.basePrice} onChange={(e) => updateField("basePrice", e.target.value)} required />
                      <Input label="Harga Diskon (Rp)" type="number" placeholder="750000" value={form.discountPrice} onChange={(e) => updateField("discountPrice", e.target.value)} />
                    </>
                  )}
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input label="SKU" placeholder="JF-KAOS-POL01" value={form.sku} onChange={(e) => updateField("sku", e.target.value)} required />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const autoSKU = generateProductSKU(form.name);
                        if (autoSKU) setForm(p => ({ ...p, sku: autoSKU }));
                      }}
                      disabled={!form.name.trim()}
                      className="mb-0.5 whitespace-nowrap"
                    >
                      <Icon name="auto_awesome" size={16} className="mr-1.5" />
                      Auto
                    </Button>
                  </div>
                  <Input label="Berat (gram)" type="number" placeholder="2500" value={form.weight} onChange={(e) => updateField("weight", e.target.value)} required />
                  {!hasVariants && (
                    <Input label="Stok" type="number" placeholder="24" value={form.stock} onChange={(e) => updateField("stock", e.target.value)} required />
                  )}
                </div>

                {hasVariants && (
                  <p className="mt-3 rounded-lg bg-surface-container-low p-3 text-xs text-on-surface-variant">
                    Harga, stok, diskon, dan gambar diatur di card <strong>Kombinasi Varian</strong> di bawah.
                    Harga dasar produk otomatis mengikuti kombinasi termurah.
                  </p>
                )}

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

          {/* ======== CARD VARIAN MULTI-DIMENSI ======== */}
          {hasVariants && (
            <>
              {/* Card Opsi Varian (Definisi Grup) */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-lg">Opsi Varian</CardTitle>
                      <p className="text-sm text-on-surface-variant">
                        Definisikan dimensi varian (maksimal 3). Contoh: Ukuran, Warna, Material.
                      </p>
                    </div>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="sm" 
                      onClick={addOptionGroup} 
                      disabled={saving || optionGroups.length >= 3}
                    >
                      <Icon name="add" size={16} className="mr-1" /> Tambah Grup Opsi
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {optionGroups.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-6 text-center">
                        <Icon name="category" size={32} className="mx-auto text-on-surface-variant/70" />
                        <p className="mt-2 text-sm text-on-surface-variant">
                          Belum ada grup opsi. Klik "Tambah Grup Opsi" untuk memulai.
                        </p>
                      </div>
                    ) : (
                      optionGroups.map((group, gIdx) => (
                        <div key={group.id} className="rounded-lg border border-input p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {gIdx + 1}
                              </span>
                              <Input
                                label=""
                                placeholder="Nama opsi: Ukuran, Warna, dll"
                                value={group.name}
                                onChange={(e) => updateOptionGroupName(group.id, e.target.value)}
                                disabled={saving}
                                className="max-w-[200px]"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => removeOptionGroup(group.id)}
                              disabled={saving}
                              title="Hapus grup opsi"
                            >
                              <Icon name="delete" size={16} />
                            </Button>
                          </div>

                          {/* Daftar nilai opsi */}
                          <div className="ml-9 space-y-2">
                            {group.options.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Belum ada nilai. Tambahkan di bawah.</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {group.options.map(opt => (
                                  <div
                                    key={opt.id}
                                    className="flex items-center gap-1.5 rounded-full border border-input bg-background px-3 py-1.5"
                                  >
                                    <input
                                      type="text"
                                      value={opt.value}
                                      onChange={(e) => updateOptionValue(group.id, opt.id, e.target.value)}
                                      disabled={saving}
                                      className="w-16 border-0 bg-transparent text-sm focus:outline-none focus:ring-0"
                                      placeholder="Nilai"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeOptionValue(group.id, opt.id)}
                                      disabled={saving}
                                      className="text-muted-foreground hover:text-destructive"
                                    >
                                      <Icon name="close" size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => addOptionValue(group.id)}
                              disabled={saving}
                            >
                              <Icon name="add" size={14} className="mr-1" /> Tambah Nilai
                            </Button>
                          </div>
                        </div>
                      ))
                    )}

                    {/* Preview jumlah kombinasi */}
                    {expectedComboCount > 0 && (
                      <div className="rounded-lg bg-primary/5 p-3">
                        <p className="text-xs text-on-surface-variant">
                          Akan menghasilkan <strong className="text-primary">{expectedComboCount} kombinasi</strong> varian.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Tombol Generate Kombinasi */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  onClick={handleGenerateCombinations}
                  disabled={saving || expectedComboCount === 0}
                  size="lg"
                  className="gap-2"
                >
                  <Icon name="auto_awesome" size={20} />
                  Generate Kombinasi Varian ({expectedComboCount})
                </Button>
              </div>

              {/* Card Kombinasi Varian (Hasil Generate) */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-lg">Kombinasi Varian</CardTitle>
                      <p className="text-sm text-on-surface-variant">
                        Setiap kombinasi punya harga, stok, diskon, SKU, dan gambar sendiri.
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {combinations.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-8 text-center">
                        <Icon name="inventory_2" size={40} className="mx-auto text-on-surface-variant/70" />
                        <p className="mt-3 text-sm text-on-surface-variant">
                          Belum ada kombinasi. Definisikan opsi varian di atas, lalu klik "Generate Kombinasi".
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Header tabel */}
                        <div className="hidden grid-cols-12 gap-2 rounded-lg bg-surface-container-low p-2 text-xs font-medium text-on-surface-variant sm:grid">
                          <div className="col-span-3">Kombinasi</div>
                          <div className="col-span-2">SKU</div>
                          <div className="col-span-1">Harga</div>
                          <div className="col-span-1">Diskon</div>
                          <div className="col-span-1">Stok</div>
                          <div className="col-span-1">Berat</div>
                          <div className="col-span-2">Gambar</div>
                          <div className="col-span-1"></div>
                        </div>

                        {combinations.map((comb) => {
                          const err = combinationErrors[comb.id];
                          return (
                            <div
                              key={comb.id}
                              className={`rounded-lg border p-3 ${err ? "border-destructive" : "border-input"}`}
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <div className="flex flex-wrap gap-1.5">
                                  {comb.selectedOptions.map(so => (
                                    <span
                                      key={`${so.groupId}:${so.optionId}`}
                                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                                    >
                                      <span className="text-on-surface-variant/70">{so.groupLabel}:</span>
                                      {so.optionLabel}
                                    </span>
                                  ))}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => removeCombination(comb.id)}
                                  disabled={saving}
                                  title="Hapus kombinasi"
                                >
                                  <Icon name="delete" size={16} />
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-6 lg:grid-cols-7">
                                <div className="sm:col-span-1 flex gap-1.5 items-end">
                                  <div className="flex-1 min-w-0">
                                    <Input
                                      label="SKU"
                                      placeholder="JF-S-MERAH"
                                      value={comb.sku}
                                      onChange={(e) => updateCombination(comb.id, "sku", e.target.value)}
                                      disabled={saving}
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const labels = comb.selectedOptions.map(o => o.optionLabel);
                                      const autoSKU = generateVariantSKU(form.sku, labels);
                                      if (autoSKU) updateCombination(comb.id, "sku", autoSKU);
                                    }}
                                    disabled={saving || !form.sku.trim()}
                                    title="Auto-generate dari nama produk + opsi"
                                    className="mb-0.5 flex-shrink-0"
                                  >
                                    <Icon name="auto_awesome" size={14} />
                                  </Button>
                                </div>
                                <Input
                                  label="Harga (Rp)"
                                  type="number"
                                  placeholder="150000"
                                  value={comb.price}
                                  onChange={(e) => updateCombination(comb.id, "price", e.target.value)}
                                  disabled={saving}
                                />
                                <Input
                                  label="Diskon (Rp)"
                                  type="number"
                                  placeholder="Opsional"
                                  value={comb.discountPrice}
                                  onChange={(e) => updateCombination(comb.id, "discountPrice", e.target.value)}
                                  disabled={saving}
                                />
                                <Input
                                  label="Stok"
                                  type="number"
                                  placeholder="10"
                                  value={comb.stock}
                                  onChange={(e) => updateCombination(comb.id, "stock", e.target.value)}
                                  disabled={saving}
                                />
                                <Input
                                  label="Berat (g)"
                                  type="number"
                                  placeholder="Ikut produk"
                                  value={comb.weight}
                                  onChange={(e) => updateCombination(comb.id, "weight", e.target.value)}
                                  disabled={saving}
                                />
                                
                                {/* Gambar per varian */}
                                <div className="sm:col-span-2 lg:col-span-2">
                                  <label className="mb-1.5 block text-xs font-medium text-on-surface-variant">
                                    Gambar Varian
                                  </label>
                                  <ImageUploader
                                    value={comb.images}
                                    onChange={(urls) => updateCombination(comb.id, "images", urls)}
                                    disabled={saving}
                                    folder="variants"
                                    max={5}
                                  />
                                </div>
                              </div>

                              {err && <p className="mt-1 text-xs text-destructive">{err}</p>}
                            </div>
                          );
                        })}

                        {/* Pratinjau rentang harga */}
                        {formatPriceRange(combinations) && (
                          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                            <p className="text-xs text-on-surface-variant">Harga tampil di kartu produk:</p>
                            <p className="mt-0.5 font-serif text-base font-bold text-primary">
                              {formatPriceRange(combinations)}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </div>

        {/* KOLOM KANAN (1/3) */}
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
                      {form.tags.map(tag => (
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
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Menyimpan..." : "Simpan Produk"}</Button>
            <Link href="/admin/products" className="flex-1"><Button variant="secondary" className="w-full" type="button">Batal</Button></Link>
          </div>
        </div>
      </form>
      {/* Keypad melayang kanan-tengah: muncul saat field angka fokus. */}
      <NumericKeypad />
    </div>
  );
}
