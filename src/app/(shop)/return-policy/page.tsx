import { RotateCcw, AlertTriangle, Fish, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Kebijakan Pengembalian - JagoFarm" };

export default function ReturnPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
          <RotateCcw className="h-4 w-4" /> Pengembalian
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Kebijakan Pengembalian & Refund</h1>
        <p className="mt-2 text-muted-foreground">Kepuasan Anda adalah prioritas kami</p>
      </div>

      <div className="mt-10 space-y-8">
        {/* Return conditions */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-primary" /> Syarat Pengembalian
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Produk dapat dikembalikan dalam waktu <strong>7 hari</strong> setelah diterima.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Produk harus dalam kondisi asli, belum digunakan, dan kemasan masih utuh.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Produk cacat atau rusak saat pengiriman (wajib sertakan foto unboxing sebagai bukti).
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Produk yang dikirim tidak sesuai dengan pesanan.
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Non-returnable */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" /> Barang yang Tidak Dapat Dikembalikan
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                Benih yang sudah dibuka segelnya.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                Anakan ikan yang sudah dimasukkan ke kolam/akuarium pembeli.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                Produk custom atau pre-order.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                Kerusakan akibat kesalahan penggunaan atau kelalaian pembeli.
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Dead fish */}
        <Card className="border-amber-300/50">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Fish className="h-5 w-5 text-amber-600" /> Garansi Anakan Ikan Hidup
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Kami memberikan garansi 100% ikan hidup sampai tujuan. Jika anakan ikan mati saat pengiriman:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                Foto/video ikan yang mati dalam kemasan asli (belum dibuka) dalam waktu <strong>2 jam</strong> setelah diterima.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                Kirim bukti ke WhatsApp kami dengan menyertakan nomor pesanan.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                Kami akan mengirimkan pengganti atau refund 100% sesuai permintaan Anda.
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Refund process */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" /> Proses Refund
            </h2>
            <ol className="mt-4 space-y-3 text-sm text-muted-foreground list-decimal list-inside">
              <li>Hubungi customer service via WhatsApp atau email dengan menyertakan foto/video bukti dan nomor pesanan.</li>
              <li>Tim kami akan memverifikasi dalam 1×24 jam.</li>
              <li>Jika disetujui, refund diproses ke rekening/e-wallet yang Anda gunakan saat pembayaran.</li>
              <li>Refund masuk dalam 3-5 hari kerja (tergantung metode pembayaran).</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
