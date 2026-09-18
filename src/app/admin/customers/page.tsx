"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, Mail, Phone, Eye, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatPrice, formatDate } from "@/lib/utils"

interface Customer {
  id: string; name: string; email: string; phone: string
  ordersCount: number; totalSpent: number; joinedAt: string; lastOrder: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const fetchData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    fetch(`/api/admin/customers?${params}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d) => setCustomers(d.customers || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => {
    const timer = setTimeout(fetchData, 300)
    return () => clearTimeout(timer)
  }, [fetchData])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-40 rounded bg-gray-200" />
        <div className="h-16 rounded-lg bg-gray-200" />
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded bg-gray-200" />)}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
          <p className="mt-2 text-sm text-gray-600">Gagal memuat pelanggan: {error}</p>
          <button onClick={() => location.reload()} className="mt-2 text-sm text-[#1B4D3E] underline">Coba lagi</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pelanggan</h1>
        <p className="text-sm text-gray-500">{customers.length} pelanggan terdaftar</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Cari nama, email, atau telepon..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {customers.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Search className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-2">Tidak ada pelanggan ditemukan</p>
            </div>
          ) : (
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
                  {customers.map((customer, i) => (
                    <tr key={customer.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
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
                          <span className="flex items-center gap-1.5 text-gray-600"><Mail className="h-3 w-3" /> {customer.email}</span>
                          <span className="flex items-center gap-1.5 text-gray-400"><Phone className="h-3 w-3" /> {customer.phone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center"><Badge variant="secondary">{customer.ordersCount}</Badge></td>
                      <td className="px-4 py-3 font-medium text-[#1B4D3E]">{formatPrice(customer.totalSpent)}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(customer.joinedAt)}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(customer.lastOrder)}</td>
                      <td className="px-4 py-3 text-right"><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
