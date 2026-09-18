"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Mail, Phone, Eye, MoreVertical } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatPrice, formatDate } from "@/lib/utils"

const mockCustomers = [
  { id: "1", name: "Budi Santoso", email: "budi.santoso@mail.com", phone: "081234567890", ordersCount: 12, totalSpent: 8_500_000, joinedAt: "2025-03-15", lastOrder: "2026-09-18" },
  { id: "2", name: "Siti Rahma", email: "siti.rahma@mail.com", phone: "085678901234", ordersCount: 8, totalSpent: 4_200_000, joinedAt: "2025-06-20", lastOrder: "2026-09-17" },
  { id: "3", name: "Ahmad Fauzi", email: "ahmad.fauzi@mail.com", phone: "087890123456", ordersCount: 23, totalSpent: 15_750_000, joinedAt: "2024-11-10", lastOrder: "2026-09-16" },
  { id: "4", name: "Dewi Lestari", email: "dewi.lestari@mail.com", phone: "089012345678", ordersCount: 5, totalSpent: 2_100_000, joinedAt: "2026-01-05", lastOrder: "2026-09-15" },
  { id: "5", name: "Rizky Pratama", email: "rizky.p@mail.com", phone: "081123456789", ordersCount: 18, totalSpent: 22_300_000, joinedAt: "2024-08-22", lastOrder: "2026-09-14" },
  { id: "6", name: "Maya Putri", email: "maya.putri@mail.com", phone: "082345678901", ordersCount: 3, totalSpent: 1_860_000, joinedAt: "2026-05-11", lastOrder: "2026-09-13" },
  { id: "7", name: "Hendra Wijaya", email: "hendra.w@mail.com", phone: "083456789012", ordersCount: 7, totalSpent: 9_400_000, joinedAt: "2025-09-30", lastOrder: "2026-09-12" },
  { id: "8", name: "Lina Marlina", email: "lina.m@mail.com", phone: "084567890123", ordersCount: 2, totalSpent: 750_000, joinedAt: "2026-07-18", lastOrder: "2026-08-25" },
]

export default function CustomersPage() {
  const [search, setSearch] = useState("")

  const filtered = mockCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pelanggan</h1>
        <p className="text-sm text-gray-500">{mockCustomers.length} pelanggan terdaftar</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Cari nama, email, atau telepon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/80 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Pelanggan</th>
                  <th className="px-4 py-3 font-medium">Kontak</th>
                  <th className="px-4 py-3 text-center font-medium">Pesanan</th>
                  <th className="px-4 py-3 font-medium">Total Belanja</th>
                  <th className="px-4 py-3 font-medium">Bergabung</th>
                  <th className="px-4 py-3 font-medium">Terakhir Order</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer, i) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1B4D3E]/10 text-sm font-bold text-[#1B4D3E]">
                          {customer.name.charAt(0)}
                        </div>
                        <p className="font-medium">{customer.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5 text-gray-600">
                          <Mail className="h-3 w-3" /> {customer.email}
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-400">
                          <Phone className="h-3 w-3" /> {customer.phone}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="secondary">{customer.ordersCount}</Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1B4D3E]">{formatPrice(customer.totalSpent)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(customer.joinedAt)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(customer.lastOrder)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      Tidak ada pelanggan ditemukan
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
