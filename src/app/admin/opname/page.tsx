"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { throwIfNotOk } from "@/lib/api-errors";

interface OpnameRow {
  id: string;
  systemStock: number;
  physicalStock: number;
  difference: number;
  note: string | null;
  createdAt: string;
  product: { id: string; name: string; sku: string };
}

export default function AdminOpnamePage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<OpnameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState("");
  const [physical, setPhysical] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/opname", { cache: "no-store" });
      const data = await res.json();
      setRows(data.opnames ?? []);
    } catch {
      toast({ title: "Gagal memuat riwayat", description: "Coba lagi beberapa saat.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-saat-mount, bukan render loop
    void fetchData();
  }, [fetchData]);

  async function submit() {
    if (!productId.trim() || physical === "") {
      toast({ title: "Produk + stok fisik wajib diisi", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/opname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: productId.trim(),
          physicalStock: parseInt(physical, 10),
          note: note.trim() || undefined,
        }),
      });
      await throwIfNotOk(res, "Gagal menyimpan opname");
      const data = (await res.json()) as { opname?: { difference?: number } };
      toast({ title: "Opname tersimpan", description: `Selisih: ${data.opname?.difference ?? 0}`, variant: "success" });
      setProductId("");
      setPhysical("");
      setNote("");
      void fetchData();
    } catch (e) {
      toast({ title: "Gagal menyimpan opname", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Stok Opname</h1>
      <Card>
        <CardHeader><CardTitle>Catat opname</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Input className="max-w-80" placeholder="ID produk (lihat URL edit produk)" value={productId} onChange={(e) => setProductId(e.target.value)} />
          <Input className="max-w-40" placeholder="Stok fisik" inputMode="numeric" value={physical} onChange={(e) => setPhysical(e.target.value.replace(/\D/g, ""))} />
          <Input className="max-w-80" placeholder="Catatan (opsional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <Button onClick={() => void submit()} disabled={saving}>Simpan</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Riwayat</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Memuat...</p> : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada opname.</p>
          ) : rows.map((r) => (
            <div key={r.id} className="border-b last:border-0 py-3 text-sm">
              <p className="font-medium">{r.product.name} <span className="text-muted-foreground">({r.product.sku})</span></p>
              <p className="text-muted-foreground">
                Sistem {r.systemStock} → Fisik {r.physicalStock} ·
                Selisih <span className={r.difference < 0 ? "text-destructive font-medium" : "font-medium"}>{r.difference >= 0 ? "+" : ""}{r.difference}</span> ·
                {" "}{formatDate(r.createdAt)}{r.note ? ` · ${r.note}` : ""}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
