"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Search, Eye, Filter } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatPrice, formatDate } from "@/lib/utils"

const mockOrders = [
  { id: "JF260918ABC123", date: "2026-09-18", customer: "Budi Santoso", email: "budi@mail.com", items: 3, total: 1_250_000, status: "PAID" },
  { id: "JF260917DEF456", date: "2026-09-17", customer: "Siti Rahma", email: "siti@mail.com", items: 1, total: 850_000, status: "PENDING" },
  { id: "JF260916GHI789", date: "2026-09-16", customer: "Ahmad Fauzi", email: "ahmad@mail.com", items: 5, total: 2_100_000, status: "SHIPPED" },
  { id: "JF260915JKL012", date: "2026-09-15", customer: "Dewi Lestari", email: "dewi@mail.com", items: 2, total: 475_000, status: "DELIVERED" },
  { id: "JF260914MNO345", date: "2026-09-14", customer: "Rizky Pratama", email: "rizky@mail.com", items: 4, total: 3_500_000, status: "CANCELLED" },
  { id: "JF260913PQR678", date: "2026-09-13", customer: "Maya Putri", email: "maya@mail.com", items: 2, total: 620_000, status: "DELIVERED" },
  { id: "JF260912STU901", date: "2026-09-12", customer: "Hendra Wijaya", email: "hendra@mail.com", items: 1, total: 2_500_000, status: "SHIPPED" },
]

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  PAID: { label: "Dibayar", variant: "success" },
  PENDING: { label: "Menunggu", variant: "warning" },
  SHIPPED: { label: "Dikirim", variant: "default" },
  DELIVERED: { label: "Selesai", variant: "success" },
  CANCELLED: { label: "Dibatalkan", variant: "destructive" },
}

export default function OrdersPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const filtered = mockOrders.filter((o) => {
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pesanan</h1>
        <p className="text-sm text-gray-500">{mockOrders.length} pesanan total</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Cari no. pesanan atau pelanggan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="PENDING">Menunggu</SelectItem>
              <SelectItem value="PAID">Dibayar</SelectItem>
              <SelectItem value="SHIPPED">Dikirim</SelectItem>
              <SelectItem value="DELIVERED">Selesai</SelectItem>
              <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/80 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">No. Pesanan</th>
                  <th className="px-4 py-3 font-medium">Tanggal</th>
                  <th className="px-4 py-3 font-medium">Pelanggan</th>
                  <th className="px-4 py-3 font-medium text-center">Item</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium">{order.id}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(order.date)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{order.customer}</p>
                      <p className="text-xs text-gray-400">{order.email}</p>
                    </td>
                    <td className="px-4 py-3 text-center">{order.items}</td>
                    <td className="px-4 py-3 font-medium">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusConfig[order.status]?.variant || "default"}>
                        {statusConfig[order.status]?.label || order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      Tidak ada pesanan ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
