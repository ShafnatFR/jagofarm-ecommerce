"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { Package, Truck, CheckCircle, Clock, XCircle, ArrowLeft } from "lucide-react";

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  trackingNumber: string | null;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  notes: string | null;
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  shippingAddress: {
    recipientName: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    postalCode: string;
    detail: string | null;
  };
  items: {
    id: string;
    quantity: number;
    price: number;
    total: number;
    product: { name: string; slug: string };
    variant: { name: string } | null;
  }[];
}

const statusSteps = [
  { key: "pending", label: "Menunggu Pembayaran", icon: Clock },
  { key: "paid", label: "Dibayar", icon: CheckCircle },
  { key: "processing", label: "Diproses", icon: Package },
  { key: "shipped", label: "Dikirim", icon: Truck },
  { key: "delivered", label: "Selesai", icon: CheckCircle },
];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-800",
};

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${params.orderNumber}`)
      .then((r) => r.json())
      .then((data) => { setOrder(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.orderNumber]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Order tidak ditemukan</h1>
        <Link href="/orders">
          <Button>Kembali ke Orders</Button>
        </Link>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex((s) => s.key === order.status);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/orders" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Badge className={statusColors[order.status]}>{order.status}</Badge>
      </div>

      {/* Status Timeline */}
      {order.status !== "cancelled" && order.status !== "expired" && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex justify-between">
              {statusSteps.map((step, i) => {
                const Icon = step.icon;
                const isActive = i <= currentStepIndex;
                return (
                  <div key={step.key} className="flex flex-col items-center text-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${isActive ? "bg-primary text-white" : "bg-gray-200 text-gray-400"}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}>{step.label}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Items */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Item Pesanan</CardTitle>
            </CardHeader>
            <CardContent>
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    {item.variant && <p className="text-sm text-muted-foreground">{item.variant.name}</p>}
                    <p className="text-sm text-muted-foreground">{item.quantity} x {formatPrice(item.price)}</p>
                  </div>
                  <p className="font-semibold">{formatPrice(item.total)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alamat Pengiriman</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{order.shippingAddress.recipientName}</p>
              <p className="text-sm text-muted-foreground">{order.shippingAddress.phone}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {order.shippingAddress.detail && `${order.shippingAddress.detail}, `}
                {order.shippingAddress.district}, {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ongkir</span>
                <span>{formatPrice(order.shippingCost)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Diskon</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Metode</span>
                <span>{order.paymentMethod || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={order.paymentStatus === "paid" ? "default" : "secondary"}>
                  {order.paymentStatus}
                </Badge>
              </div>
              {order.trackingNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resi</span>
                  <span className="font-mono">{order.trackingNumber}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {order.status === "pending" && (
            <Button className="w-full" variant="destructive">
              Batalkan Pesanan
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
