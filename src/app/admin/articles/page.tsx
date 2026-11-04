"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { throwIfNotOk } from "@/lib/api-errors";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverUrl: string | null;
  published: boolean;
  createdAt: string;
}

const EMPTY = { title: "", slug: "", excerpt: "", content: "", coverUrl: "", published: false };

export default function AdminArticlesPage() {
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Dialog konfirmasi hapus: artikel yang akan dihapus (null = tertutup).
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/articles", { cache: "no-store" });
      const data = await res.json();
      setArticles(data.articles ?? []);
    } catch {
      toast({ title: "Gagal memuat artikel", description: "Coba lagi beberapa saat.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-saat-mount, bukan render loop
    void fetchData();
  }, [fetchData]);

  async function submit() {
    if (form.title.trim().length < 5 || form.content.trim().length < 20) {
      toast({ title: "Judul (5+) + isi (20+) wajib", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/articles", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(editing ? { id: editing } : {}), ...form }),
      });
      await throwIfNotOk(res, "Gagal menyimpan artikel");
      toast({ title: editing ? "Artikel diperbarui" : "Artikel dibuat", description: `Artikel "${form.title.trim()}" tersimpan.`, variant: "success" });
      setForm(EMPTY);
      setEditing(null);
      void fetchData();
    } catch (e) {
      toast({ title: "Gagal menyimpan artikel", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function remove(id: string) {
    const article = articles.find((a) => a.id === id);
    setConfirmDelete({ id, title: article?.title ?? "" });
  }

  async function handleDeleteConfirmed() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/articles?id=${confirmDelete.id}`, { method: "DELETE" });
      await throwIfNotOk(res, "Gagal menghapus artikel");
      toast({ title: "Artikel dihapus", description: `Artikel "${confirmDelete.title}" telah dihapus permanen.`, variant: "success" });
      setConfirmDelete(null);
      void fetchData();
    } catch (e) {
      toast({ title: "Gagal menghapus artikel", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Artikel / Blog</h1>
      <Card>
        <CardHeader><CardTitle>{editing ? "Ubah artikel" : "Artikel baru"}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Input placeholder="Judul" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          <div className="flex gap-2">
            <Input placeholder="Slug (kosong = otomatis)" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} />
            <Input placeholder="Cover URL (opsional)" value={form.coverUrl} onChange={(e) => setForm((p) => ({ ...p, coverUrl: e.target.value }))} />
          </div>
          <Input placeholder="Ringkasan (opsional)" value={form.excerpt} onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))} />
          <textarea
            className="w-full rounded-lg border border-outline-variant bg-surface p-3 text-sm min-h-40"
            placeholder="Isi artikel (teks biasa, baris baru = paragraf)"
            value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm((p) => ({ ...p, published: e.target.checked }))} />
            Publikasikan
          </label>
          <div className="flex gap-2">
            <Button onClick={() => void submit()} disabled={saving}>{editing ? "Simpan" : "Buat"}</Button>
            {editing && <Button variant="secondary" onClick={() => { setEditing(null); setForm(EMPTY); }}>Batal</Button>}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Daftar</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Memuat...</p> : articles.map((a) => (
            <div key={a.id} className="border-b last:border-0 py-3 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-52">
                <p className="font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">/{a.slug} · {formatDate(a.createdAt)}</p>
              </div>
              <Badge>{a.published ? "Published" : "Draft"}</Badge>
              <Button size="sm" variant="secondary" onClick={() => { setEditing(a.id); setForm({ title: a.title, slug: a.slug, excerpt: a.excerpt ?? "", content: a.content, coverUrl: a.coverUrl ?? "", published: a.published }); }}>Ubah</Button>
              <Button size="sm" variant="secondary" onClick={() => void remove(a.id)}>Hapus</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Konfirmasi hapus artikel — menggantikan confirm() browser */}
      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => { if (!open) setConfirmDelete(null) }}
        title={`Hapus artikel "${confirmDelete?.title ?? ""}"?`}
        description={"Artikel akan dihapus permanen dan tidak bisa dikembalikan."}
        confirmLabel="Ya, hapus"
        loading={deleting}
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  );
}
