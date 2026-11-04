"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel as Label } from "@/components/ui/select";
import { cn } from "@/lib/utils";
interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
  description?: string | null;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  sortOrder?: number;
  isActive?: boolean;
  _count?: { products: number };
}

interface OdooCategorySelectProps {
  value: string | null; // categoryId yang sedang dipilih
  onChange: (categoryId: string | null) => void;
  label?: string;
  disabled?: boolean;
  required?: boolean;
}

export function OdooCategorySelect({
  value,
  onChange,
  label = "Kategori",
  disabled = false,
  required = false,
}: OdooCategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<Category[]>([]);
  const [creating, setCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [configOpen, setConfigOpen] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [configForm, setConfigForm] = useState({
    name: "",
    color: "#123F2D",
    parentId: "" as string | null,
    description: "",
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const selectedCategory = categories.find((c) => c.id === value);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories?search=");
      if (!res.ok) return;
      const data = await res.json();
      setCategories(data.categories ?? []);
    } catch {
      // diam — input masih bisa dipakai untuk create manual
    }
  }, []);

  // Muat kategori saat mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, bukan render loop
    fetchCategories();
  }, [fetchCategories]);

  const filterCategories = useCallback(
    (query: string) => {
      const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (terms.length === 0) return categories;
      return categories.filter((c) =>
        terms.every((t) => c.name.toLowerCase().includes(t))
      );
    },
    [categories]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setFiltered(filterCategories(val));
    if (!disabled && val.trim().length > 0) setOpen(true);
    else if (val.trim().length === 0) setOpen(false);
  };

  const handleSelect = (cat: Category) => {
    setInputValue(cat.name);
    onChange(cat.id);
    setOpen(false);
    setCreating(false);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const exact = categories.find((c) => c.name.toLowerCase() === inputValue.trim().toLowerCase());
      if (exact) {
        handleSelect(exact);
        return;
      }
      const top = filtered[0];
      if (top && top.name.toLowerCase().includes(inputValue.trim().toLowerCase())) {
        handleSelect(top);
        return;
      }
      // Tidak ada yang cocok → buat kategori baru
      setNewCategoryName(inputValue.trim());
      setConfigForm((prev) => ({ ...prev, name: inputValue.trim() }));
      setCreating(true);
      setOpen(false);
      setConfigOpen(true);
    }
    if (e.key === "Escape") {
      setOpen(false);
      setCreating(false);
    }
  };

  const handleConfigSave = async () => {
    setConfigLoading(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: configForm.name.trim(),
          slug: configForm.name.trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, ""),
          color: configForm.color || null,
          parentId: configForm.parentId || null,
          description: configForm.description || null,
          sortOrder: 0,
          isActive: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Gagal membuat kategori.");
      }
      const data = await res.json();
      const cat = data.category;
      setCategories((prev) => [...prev, cat]);
      setInputValue(cat.name);
      onChange(cat.id);
      setConfigOpen(false);
      setCreating(false);
      toast({
        title: "Kategori dibuat",
        description: `Kategori "${cat.name}" berhasil ditambahkan.`,
        variant: "success",
      });
      fetchCategories();
    } catch (err) {
      toast({
        title: "Gagal membuat kategori",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setConfigLoading(false);
    }
  };

  const handleConfigCancel = () => {
    setConfigOpen(false);
    setCreating(false);
    if (inputValue.trim()) onChange(null);
  };

  // Jika value tidak cocok kategori apa pun, kosongkan input
  useEffect(() => {
    if (value && !categories.some((c) => c.id === value)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInputValue("");
    } else if (selectedCategory) {
      setInputValue(selectedCategory.name);
    }
  }, [value, categories, selectedCategory]);

  if (disabled) {
    return (
      <div className="space-y-1">
        {label && <Label className="text-sm font-medium text-on-surface">{label}</Label>}
        <Input
          disabled
          value={selectedCategory?.name ?? ""}
          placeholder={required ? "Pilih kategori" : "Pilih kategori"}
          readOnly
        />
      </div>
    );
  }

  return (
    <div className="space-y-1 relative">
      {label && <Label className="text-sm font-medium text-on-surface">{label}</Label>}
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Jangan segera tutup dropdown saat klik item di dalamnya
            setTimeout(() => {
              if (!document.getElementById("odoo-category-dropdown")) setOpen(false);
            }, 150);
          }}
          placeholder="Ketik atau pilih kategori…"
          className="pr-10"
        />
        {inputValue.trim().length > 0 && !creating && (
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setNewCategoryName(inputValue.trim());
              setConfigForm((prev) => ({ ...prev, name: inputValue.trim() }));
              setConfigOpen(true);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-primary hover:text-primary/80"
          >
            Buat baru
          </button>
        )}
        {creating && inputValue.trim().length > 0 && (
          <p className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-destructive">
            Tekan Enter untuk membuat
          </p>
        )}
        <div
          id="odoo-category-dropdown"
          className={cn(
            "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-input bg-surface-bright text-on-surface shadow-lg",
            open ? "" : "hidden"
          )}
        >
          {filtered.length === 0 && inputValue.trim().length > 0 ? (
            <div className="px-3 py-2 text-sm text-on-surface-variant">
              Tidak ada kategori yang cocok. Tekan <kbd className="px-1.5 py-0.5 rounded bg-input">Enter</kbd> untuk membuat kategori baru.
            </div>
          ) : (
            filtered.map((cat) => (
              <div
                key={cat.id}
                onClick={() => handleSelect(cat)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm cursor-default hover:bg-surface-container-low",
                  cat.id === value ? "bg-surface-container-low font-medium" : ""
                )}
              >
                <span className="flex-shrink-0 h-2 w-2 rounded-full" style={{ backgroundColor: cat.color ?? "#123F2D" }} />
                {cat.name}
                {cat.parent && (
                  <span className="ml-auto text-xs text-on-surface-variant/60">↳ {cat.parent.name}</span>
                )}
                {cat._count?.products != null && cat._count.products > 0 && (
                  <span className="ml-auto text-xs text-on-surface-variant/60">{cat._count.products} produk</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal konfigurasi kategori baru */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {creating ? `Buat kategori "${newCategoryName}"` : "Konfigurasi Kategori"}
            </DialogTitle>
            <DialogDescription>
              Isi warna, induk, dan deskripsi kategori baru.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleConfigSave(); }} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Nama kategori</Label>
              <Input
                value={configForm.name}
                onChange={(e) => setConfigForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Warna</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={configForm.color}
                    onChange={(e) => setConfigForm((prev) => ({ ...prev, color: e.target.value }))}
                    className="h-8 w-8 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-xs text-on-surface-variant">{configForm.color}</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Induk</Label>
                <Select value={configForm.parentId ?? ""} onValueChange={(v) => setConfigForm((prev) => ({ ...prev, parentId: v || null }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tidak ada (root)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tidak ada (root)</SelectItem>
                    {categories
                      .filter((c) => c.id !== configForm.name && c.isActive !== false)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Deskripsi</Label>
              <textarea
                value={configForm.description}
                onChange={(e) => setConfigForm((prev) => ({ ...prev, description: e.target.value }))}
                className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                placeholder="Deskripsi singkat untuk kategori ini…"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={handleConfigCancel} disabled={configLoading}>
                Batal
              </Button>
              <Button type="submit" disabled={configLoading || !configForm.name.trim()}>
                {configLoading ? "Menyimpan…" : "Simpan Kategori"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
