"use client"

import { useCallback, useEffect, useState } from "react"
import { Icon } from "@/components/ui/icon";
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"

/** Pesan error yang aman ditampilkan di UI (unknown -> string). */
function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

type StatusFilter = "all" | "pending" | "approved"

interface AdminReview {
  id: string
  userId: string
  productId: string
  rating: number
  comment: string | null
  imageUrl: string | null
  isApproved: boolean
  createdAt: string
  userName: string
  userEmail: string | null
  user: { id: string; name: string | null; email: string | null; image: string | null } | null
  product: { id: string; name: string; slug: string; image: string | null } | null
}

interface Summary {
  total: number
  pending: number
  approved: number
  averageRating: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const LIMIT = 20

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" title={`${rating} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name="star" size={12} />
      ))}
      <span className="ml-1 text-xs text-gray-500">{rating}/5</span>
    </div>
  )
}

export default function AdminReviewsPage() {
  const { toast } = useToast()

  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: LIMIT, total: 0, totalPages: 1 })

  const [status, setStatus] = useState<StatusFilter>("all")
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [page, setPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    params.set("status", status)
    params.set("page", String(page))
    params.set("limit", String(LIMIT))
    if (search.trim()) params.set("search", search.trim())

    try {
      const r = await fetch(`/api/admin/reviews?${params.toString()}`, { cache: "no-store" })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`)
      setReviews(Array.isArray(data.reviews) ? data.reviews : [])
      setSummary(data.summary ?? null)
      setPagination(
        data.pagination ?? { page, limit: LIMIT, total: 0, totalPages: 1 }
      )
    } catch (e) {
      const message = toMessage(e)
      setError(message)
      setReviews([])
      toast({
        title: "Gagal memuat ulasan",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [status, page, search, toast])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pola fetch-saat-mount daftar ulasan; setState ada di dalam fetchData()
    fetchData()
  }, [fetchData])

  // Debounce kolom pencarian supaya tidak memanggil API tiap ketikan.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const moderate = async (review: AdminReview, isApproved: boolean) => {
    setBusyId(review.id)
    try {
      const r = await fetch(`/api/admin/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`)
      toast({
        title: isApproved ? "Ulasan disetujui" : "Ulasan disembunyikan",
        description: isApproved
          ? `Ulasan dari ${review.userName} kini tayang di halaman produk.`
          : `Ulasan dari ${review.userName} disembunyikan dari toko.`,
      })
      await fetchData()
    } catch (e) {
      toast({
        title: "Gagal memperbarui ulasan",
        description: toMessage(e),
        variant: "destructive",
      })
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (review: AdminReview) => {
    if (
      !confirm(
        `Hapus ulasan dari ${review.userName} untuk produk "${review.product?.name ?? "-"}"? Tindakan ini tidak bisa dibatalkan.`
      )
    ) {
      return
    }
    setBusyId(review.id)
    try {
      const r = await fetch(`/api/admin/reviews/${review.id}`, { method: "DELETE" })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`)
      toast({
        title: "Ulasan dihapus",
        description: `Ulasan dari ${review.userName} telah dihapus permanen.`,
      })
      // Kalau baris terakhir di halaman ini terhapus, mundur satu halaman.
      if (reviews.length === 1 && page > 1) {
        setPage((p) => Math.max(1, p - 1))
      } else {
        await fetchData()
      }
    } catch (e) {
      toast({
        title: "Gagal menghapus ulasan",
        description: toMessage(e),
        variant: "destructive",
      })
    } finally {
      setBusyId(null)
    }
  }

  if (loading && reviews.length === 0 && !error) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-40 rounded bg-gray-200" />
        <div className="h-14 rounded-lg bg-gray-200" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded bg-gray-200" />
          ))}
        </div>
      </div>
    )
  }

  if (error && reviews.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Icon name="info" size={40} className="mx-auto text-red-400" />
          <p className="mt-2 text-sm text-gray-600">Gagal memuat ulasan: {error}</p>
          <button
            onClick={() => fetchData()}
            className="mt-2 text-sm text-[#1B4D3E] underline"
          >
            Coba lagi
          </button>
        </div>
      </div>
    )
  }

  const total = summary?.total ?? pagination.total ?? 0
  const pending = summary?.pending ?? 0
  const approved = summary?.approved ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moderasi Ulasan</h1>
          <p className="text-sm text-gray-500">
            {total} ulasan{summary ? ` · rata-rata ${summary.averageRating.toFixed(1)} bintang` : ""}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            value={status}
            onValueChange={(value) => {
              setStatus(value as StatusFilter)
              setPage(1)
            }}
          >
            <TabsList>
              <TabsTrigger value="all">Semua ({total})</TabsTrigger>
              <TabsTrigger value="pending">Menunggu ({pending})</TabsTrigger>
              <TabsTrigger value="approved">Disetujui ({approved})</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full lg:max-w-xs">
            <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Cari komentar atau produk..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {reviews.length === 0 ? (
            <div className="py-16 text-center">
              <Icon name="forum" size={40} className="mx-auto text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-500">
                {search.trim()
                  ? "Tidak ada ulasan yang cocok dengan pencarian"
                  : status === "pending"
                    ? "Tidak ada ulasan yang menunggu moderasi"
                    : status === "approved"
                      ? "Belum ada ulasan yang disetujui"
                      : "Belum ada ulasan dari pelanggan"}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Ulasan muncul di sini setelah pelanggan mengulas produk yang dibelinya.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/80 text-left text-gray-500">
                    <th className="px-4 py-3 font-medium">Ulasan</th>
                    <th className="px-4 py-3 font-medium">Produk</th>
                    <th className="px-4 py-3 font-medium">Pengguna</th>
                    <th className="px-4 py-3 font-medium">Tanggal</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review, i) => (
                    <tr
                      key={review.id}
                      className={i % 2 === 0 ? "bg-white align-top" : "bg-gray-50/50 align-top"}
                    >
                      <td className="max-w-md px-4 py-3">
                        <Stars rating={review.rating} />
                        <p className="mt-1.5 text-gray-700">
                          {review.comment?.trim() || (
                            <span className="text-gray-400 italic">Tanpa komentar</span>
                          )}
                        </p>
                        {review.imageUrl && (
                          <a
                            href={review.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-xs text-[#1B4D3E] underline"
                          >
                            Lihat foto ulasan
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {review.product ? (
                          <a
                            href={`/products/${review.product.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-[#1B4D3E] hover:underline"
                          >
                            {review.product.name}
                          </a>
                        ) : (
                          <span className="text-gray-400">Produk dihapus</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{review.userName}</p>
                        <p className="text-xs text-gray-500">{review.userEmail || "-"}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatDate(review.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {review.isApproved ? (
                          <Badge variant="success">Disetujui</Badge>
                        ) : (
                          <Badge variant="warning">Menunggu</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {review.isApproved ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              disabled={busyId === review.id}
                              onClick={() => moderate(review, false)}
                            >
                              <Icon name="visibility_off" size={12} className="mr-1" />
                              Sembunyikan
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-green-700 hover:text-green-800"
                              disabled={busyId === review.id}
                              onClick={() => moderate(review, true)}
                            >
                              <Icon name="check" size={12} className="mr-1" />
                              Setujui
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            title="Hapus ulasan"
                            disabled={busyId === review.id}
                            onClick={() => remove(review)}
                          >
                            <Icon name="delete" size={12} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Menampilkan {reviews.length} dari {pagination.total} ulasan
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <Icon name="chevron_left" size={16} className="mr-1" /> Sebelumnya
            </Button>
            <span className="text-sm text-gray-500">
              Halaman {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= pagination.totalPages || loading}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            >
              Berikutnya <Icon name="chevron_right" size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
