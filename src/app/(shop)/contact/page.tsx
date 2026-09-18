"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Phone, MapPin, MessageCircle, Send } from "lucide-react";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Static form — just show success for now
    await new Promise((r) => setTimeout(r, 1000));
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
          <MessageCircle className="h-4 w-4" /> Hubungi Kami
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Kontak</h1>
        <p className="mt-2 text-muted-foreground">
          Ada pertanyaan? Kami senang bisa membantu Anda.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-5">
        {/* Contact info */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-5 space-y-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Alamat</p>
                  <p className="text-sm text-muted-foreground">Jl. Pertanian No. 123, Surabaya, Jawa Timur 60111</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Telepon</p>
                  <p className="text-sm text-muted-foreground">+62 812-3456-7890</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Email</p>
                  <p className="text-sm text-muted-foreground">hello@jagofarm.id</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">WhatsApp</p>
                  <p className="text-sm text-muted-foreground">+62 812-3456-7890</p>
                  <p className="text-xs text-muted-foreground">Setiap hari 08.00 - 20.00 WIB</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map placeholder */}
          <div className="rounded-xl border border-border bg-secondary h-48 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Peta lokasi</p>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Kirim Pesan</CardTitle>
            </CardHeader>
            <CardContent>
              {sent ? (
                <div className="text-center py-8">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <Send className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">Pesan Terkirim!</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Terima kasih telah menghubungi kami. Tim kami akan merespons dalam 1×24 jam.
                  </p>
                  <Button variant="secondary" className="mt-4" onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}>
                    Kirim Pesan Lagi
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Nama</label>
                      <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Nama Anda" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Email</label>
                      <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@anda.com" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Subjek</label>
                    <Input value={form.subject} onChange={(e) => update("subject", e.target.value)} placeholder="Perihal pesan Anda" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Pesan</label>
                    <textarea
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={form.message}
                      onChange={(e) => update("message", e.target.value)}
                      placeholder="Tuliskan pesan Anda di sini..."
                      required
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                    <Send className="h-4 w-4 mr-2" />
                    {loading ? "Mengirim..." : "Kirim Pesan"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
