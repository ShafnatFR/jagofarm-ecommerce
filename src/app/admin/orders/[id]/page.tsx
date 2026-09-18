"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, CreditCard, Truck, CheckCircle2, Clock, Package, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice, formatDateTime } from "@/lib/utils";

interface OrderItem { id: string; name: string; price: number; quantity: number; image?: string; }
interface OrderData {
  id: string; orderNumber: string; date: string; status: string;
  customer: { name: string; email: string; phone: string };
  shippingAddress: { label: string; address: string; city: string; province: string; postalCode: string };
  items: OrderItem[];
  payment: { method: string; paidAt?: string };
  shipping: { courier: string; service: string; trackingNumber: string; cost: number };
  subtotal: number; shippingCost: number; total: number; notes?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive"; icon: typeof Clock }> = {
  PENDING: { label: "Menunggu Pembayaran", variant: "warning", icon: Clock },
  PAID: { label: "Sudah Dibayar", variant: "success", icon: CreditCard },
  PROCESSING: { label: "Diproses", variant: "default", icon: Package },
  SHIPPED: { label: "Dikirim", variant: "default", icon: Truck },
  DELIVERED: { label: "Selesai", variant: "success", icon: CheckCircle2 },
  CANCELLED: { label: "Dibatalkan", variant: "destructive", icon: XCircle },
};

function buildTimeline(status: string, date: string, paidAt?: string) {
  const tl = [{ status: "PENDING", date, label: "Pesanan dibuat" }];
  if (["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(status) && paidAt) tl.push({ status: "PAID", date: paidAt, label: "Pembayaran dikonfirmasi" });
  if (["PROCESSING", "SHIPPED", "DELIVERED"].includes(status)) tl.push({ status: "PROCESSING", date: "", label: "Pesanan diproses" });
  if (["SHIPPED", "DELIVERED"].includes(status)) tl.push({ status: "SHIPPED", date: "", label: "Barang dikirim" });
  if (status === "DELIVERED") tl.push({ status: "DELIVERED", date: "", label: "Barang diterima" });
  if (status === "CANCELLED") tl.push({ status: "CANCELLED", date: "", label: "Pesanan dibatalkan" });
  return tl;
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchOrder(); }, [id]);

  async function fetchOrder() {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      if (!res.ok) throw new Error("Gagal memuat pesanan");
      const data = await res.json();
      setOrder(data);
      setOrderStatus(data.status);
      setTrackingNumber(data.shipping?.trackingNumber ?? "");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: orderStatus, trackingNumber }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      await fetchOrder();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100" />)}
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-gray-500">{error || "Pesanan tidak ditemukan"}</p>
        <Link href="/admin/orders"><Button variant="secondary">Kembali</Button></Link>
      </div>
    );
  }

  const sc = statusConfig[orderStatus] || statusConfig.PENDING;
  const timeline = buildTimeline(orderStatus, order.date, order.payment.paidAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pesanan #{order.orderNumber || id}</h1>
            <p className="text-sm text-gray-500">{formatDateTime(order.date)}</p>
          </div>
        </div>
        <Badge variant={sc.variant} className="text-sm">{sc.label}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-lg">Item Pesanan</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-gray-500">
                    <th className="pb-3 font-medium">Produk</th>
                    <th className="pb-3 text-right font-medium">Harga</th>
                    <th className="pb-3 text-center font-medium">Qty</th>
                    <th className="pb-3 text-right font-medium">Subtotal</th>
                  </tr></thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{item.name}</td>
                        <td className="py-3 text-right text-gray-600">{formatPrice(item.price)}</td>
                        <td className="py-3 text-center">{item.quantity}</td>
                        <td className="py-3 text-right font-medium">{formatPrice(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t">
                      <td colSpan={3} className="py-2 text-gray-500">Subtotal</td>
                      <td className="py-2 text-right font-medium">{formatPrice(order.subtotal)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="py-2 text-gray-500">Ongkir ({order.shipping.courier} {order.shipping.service})</td>
                      <td className="py-2 text-right font-medium">{formatPrice(order.shippingCost)}</td>
                    </tr>
                    <tr className="border-t">
                      <td colSpan={3} className="py-3 text-lg font-bold">Total</td>
                      <td className="py-3 text-right text-lg font-bold text-[#1B4D3E]">{formatPrice(order.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Status Pesanan</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-0">
                {timeline.map((step, i) => {
                  const isLast = i === timeline.length - 1;
                  const Icon = statusConfig[step.status]?.icon || Clock;
                  return (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isLast ? "bg-[#1B4D3E] text-white" : "bg-gray-200 text-gray-500"}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        {!isLast && <div className="h-full w-px bg-gray-200" />}
                      </div>
                      <div className="pb-6">
                        <p className="font-medium">{step.label}</p>
                        {step.date && <p className="text-xs text-gray-400">{formatDateTime(step.date)}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Update Status</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Status</label>
                <Select value={orderStatus} onValueChange={setOrderStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input label="No. Resi" placeholder="Masukkan nomor resi..." value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
              <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan Perubahan"}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Pelanggan</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              <p className="font-medium">{order.customer.name}</p>
              <p className="text-sm text-gray-500">{order.customer.email}</p>
              <p className="text-sm text-gray-500">{order.customer.phone}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><MapPin className="h-4 w-4" />Alamat Pengiriman</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm">{order.shippingAddress.label}</p>
              <p className="text-sm text-gray-600">{order.shippingAddress.address}</p>
              <p className="text-sm text-gray-600">{order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><CreditCard className="h-4 w-4" />Pembayaran</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-gray-400">Metode</p>
                <p className="text-sm font-medium">{order.payment.method}</p>
              </div>
              {order.payment.paidAt && (
                <div>
                  <p className="text-xs text-gray-400">Dibayar pada</p>
                  <p className="text-sm">{formatDateTime(order.payment.paidAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Catatan</CardTitle></CardHeader>
              <CardContent><p className="text-sm italic text-gray-600">&ldquo;{order.notes}&rdquo;</p></CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
