"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { formatDate, formatPrice } from "@/lib/utils";

interface ReturnItem {
  id: string;
  reason: string;
  status: string;
  adminNote: string | null;
  refundAmount: unknown;
  createdAt: string;
  order: { id: string; orderNumber: string; status: string; total: unknown };
  user: { id: string; name: string | null; email: string | null };
}

const STATUS_LABEL: Record<string, string> = {
  requested: "Baru",
  approved: "Disetujui",
  rejected: "Ditolak",
  refunded: "Direfund",
};

export default function AdminReturnsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("requested");
  const [note, setNote] = useState<Record<string, string>>({});
  const [amount, setAmount] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/returns?status=${filter}`, { cache: "no-store" });
      const data = await res.json();
      setItems(data.returns ?? []);
    } catch {
      toast({ title: "Gagal memuat retur", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-saat-mount, bukan render loop
    void fetchData();
  }, [fetchData]);

  async function act(id: string, action: "approve" | "reject" | "refund") {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/returns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action,
          adminNote: note[id]?.trim() || undefined,
          refundAmount: amount[id] ? parseInt(amount[id], 10) : undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast({ title: "Gagal", description: data?.error ?? "", variant: "destructive" });
        return;
      }
      toast({ title: `Retur ${action === "approve" ? "disetujui" : action === "refund" ? "direfund" : "ditolak"}` });
      void fetchData();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Retur</h1>
        <div className="flex gap-2">
          {["requested", "approved", "rejected", "refunded", ""].map((s) => (
            <Button key={s} size="sm" variant={filter === s ? "primary" : "secondary"} onClick={() => setFilter(s)}>
              {s ? (STATUS_LABEL[s] ?? s) : "Semua"}
            </Button>
          ))}
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>Daftar pengajuan</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Memuat...</p> : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada pengajuan.</p>
          ) : items.map((r) => (
            <div key={r.id} className="border-b last:border-0 py-4 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge>{STATUS_LABEL[r.status] ?? r.status}</Badge>
                <span className="font-medium">{r.order.orderNumber}</span>
                <span className="text-sm text-muted-foreground">{r.user.name ?? r.user.email}</span>
                <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)} · {formatPrice(Number(r.order.total))}</span>
              </div>
              <p className="text-sm">{r.reason}</p>
              {r.adminNote && <p className="text-xs text-muted-foreground">Catatan admin: {r.adminNote}</p>}
              {r.status === "requested" && (
                <div className="flex flex-wrap gap-2 items-center">
                  <Input
                    className="max-w-64" placeholder="Catatan (wajib bila tolak)"
                    value={note[r.id] ?? ""} onChange={(e) => setNote((p) => ({ ...p, [r.id]: e.target.value }))}
                  />
                  <Input
                    className="max-w-40" placeholder="Nominal refund" inputMode="numeric"
                    value={amount[r.id] ?? ""} onChange={(e) => setAmount((p) => ({ ...p, [r.id]: e.target.value.replace(/\D/g, "") }))}
                  />
                  <Button size="sm" disabled={busy === r.id} onClick={() => void act(r.id, "approve")}>
                    <Icon name="check" size={14} className="mr-1" /> Setujui
                  </Button>
                  <Button size="sm" variant="secondary" disabled={busy === r.id} onClick={() => void act(r.id, "reject")}>
                    Tolak
                  </Button>
                </div>
              )}
              {r.status === "approved" && (
                <>
                  <Button size="sm" disabled={busy === r.id} onClick={() => void act(r.id, "refund")}>
                    <Icon name="payments" size={14} className="mr-1" /> Tandai Refunded
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Refund dana di dashboard gateway dulu (Midtrans/Mayar → transaksi → Refund), baru tandai di sini.
                  </span>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
