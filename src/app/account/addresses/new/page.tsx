"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, ArrowLeft, Save } from "lucide-react";

export default function NewAddressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    label: "",
    recipientName: "",
    phone: "",
    province: "",
    city: "",
    district: "",
    postalCode: "",
    detail: "",
    isDefault: false,
  });

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(typeof data.error === "string" ? data.error : "Gagal menyimpan alamat");
      }
      router.push("/account/addresses");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Link href="/account/addresses" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Alamat
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> Tambah Alamat Baru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Label Alamat *</label>
                <Input value={form.label} onChange={(e) => update("label", e.target.value)} placeholder="Rumah, Kantor, dll" required maxLength={50} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Nama Penerima *</label>
                <Input value={form.recipientName} onChange={(e) => update("recipientName", e.target.value)} placeholder="Nama lengkap" required maxLength={100} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Nomor Telepon *</label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="08xxxxxxxxxx" required maxLength={20} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Provinsi *</label>
                <Input value={form.province} onChange={(e) => update("province", e.target.value)} placeholder="Jawa Timur" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Kota/Kabupaten *</label>
                <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Surabaya" required />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Kecamatan *</label>
                <Input value={form.district} onChange={(e) => update("district", e.target.value)} placeholder="Sukolilo" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Kode Pos *</label>
                <Input value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} placeholder="60111" required maxLength={10} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Alamat Lengkap</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={form.detail}
                onChange={(e) => update("detail", e.target.value)}
                placeholder="Nama jalan, nomor rumah, RT/RW, patokan..."
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => update("isDefault", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm">Jadikan alamat utama</span>
            </label>

            <div className="flex gap-2 pt-2">
              <Link href="/account/addresses">
                <Button type="button" variant="secondary">Batal</Button>
              </Link>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Menyimpan..." : "Simpan Alamat"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
