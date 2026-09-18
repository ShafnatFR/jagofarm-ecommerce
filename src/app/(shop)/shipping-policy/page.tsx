import { Truck, Fish, Gift, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Kebijakan Pengiriman - JagoFarm" };

export default function ShippingPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
          <Truck className="h-4 w-4" /> Pengiriman
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Kebijakan Pengiriman</h1>
        <p className="mt-2 text-muted-foreground">Informasi lengkap tentang pengiriman produk JagoFarm</p>
      </div>

      <div className="mt-10 space-y-8">
        {/* Couriers */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" /> Kurir yang Tersedia
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                { name: "JNE", services: "REG, YES, OKE", est: "1-5 hari" },
                { name: "SiCepat", services: "REG, BEST, HALU", est: "1-4 hari" },
                { name: "AnterAja", services: "REG, NEXT DAY, SAME DAY", est: "1-3 hari" },
              ].map((c) => (
                <div key={c.name} className="rounded-xl border border-border p-4">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">Layanan: {c.services}</p>
                  <p className="text-sm text-muted-foreground">Estimasi: {c.est}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cost rules */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">Biaya Pengiriman</h2>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Biaya pengiriman dihitung berdasarkan berat barang dan tujuan pengiriman.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Ongkir aktual ditampilkan saat checkout setelah Anda memasukkan alamat.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Berat volumetrik digunakan jika lebih besar dari berat aktual (P × L × T / 6000).
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Free shipping */}
        <Card className="border-primary/30">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" /> Gratis Ongkir
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Pembelian minimal <strong>Rp500.000</strong> untuk pengiriman ke seluruh Jawa.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Pembelian minimal <strong>Rp1.000.000</strong> untuk pengiriman ke luar Jawa.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Berlaku untuk layanan REG (estimasi standar).
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Live fish */}
        <Card className="border-amber-300/50">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Fish className="h-5 w-5 text-amber-600" /> Pengiriman Anakan Ikan
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                Anakan ikan dikirim menggunakan kemasan khusus dengan oksigen dan isolasi suhu.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                Pengiriman hanya dilakukan <strong>Senin — Kamis</strong> untuk menghindari penahanan di gudang kurir saat weekend.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                Garansi ikan hidup sampai — jika ikan mati dalam perjalanan, kami ganti 100% (lihat Kebijakan Pengembalian).
              </li>
            </ul>
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              Pastikan alamat pengiriman benar dan ada orang yang menerima. Ikan harus segera dimasukkan ke air bersih setelah diterima.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
