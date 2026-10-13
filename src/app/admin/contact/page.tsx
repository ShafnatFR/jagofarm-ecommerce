"use client"

import { useCallback, useEffect, useState } from "react"
import { Icon } from "@/components/ui/icon";
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { formatDateTime } from "@/lib/utils"
import { AdminRefreshButton } from "../admin-refresh"

/** Pesan error yang aman ditampilkan di UI (unknown -> string). */
function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

type StatusFilter = "all" | "unread" | "read"

interface AdminContactMessage {
  id: string
  name: string
  email: string
  phone: string | null
  topic: string
  subject: string
  message: string
  status: string
  isRead: boolean
  emailSent: boolean
  emailError: string | null
  ipAddress: string | null
  createdAt: string
  readAt: string | null
}

interface Summary {
  total: number
  unread: number
  read: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const LIMIT = 20

/** Label ramah pengguna untuk topik contact form. */
const TOPIC_LABELS: Record<string, string> = {
  pemesanan: "Pemesanan",
  teknis: "Teknis",
  iot: "IoT",
  kemitraan: "Kemitraan",
}

export default function AdminContactPage() {
  const { toast } = useToast()

  const [messages, setMessages] = useState<AdminContactMessage[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: LIMIT, total: 0, totalPages: 1 })

  const [status, setStatus] = useState<StatusFilter>("all")
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [page, setPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [selected, setSelected] = useState<AdminContactMessage | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    params.set("status", status)
    params.set("page", String(page))
    params.set("limit", String(LIMIT))
    if (search.trim()) params.set("search", search.trim())

    try {
      const r = await fetch(`/api/admin/contact?${params.toString()}`, { cache: "no-store" })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`)
      setMessages(Array.isArray(data.messages) ? data.messages : [])
      setSummary(data.summary ?? null)
      setPagination(
        data.pagination ?? { page, limit: LIMIT, total: 0, totalPages: 1 }
      )
    } catch (e) {
      const message = toMessage(e)
      setError(message)
      setMessages([])
      toast({
        title: "Gagal memuat pesan",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [status, page, search, toast])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pola fetch-saat-mount daftar pesan; setState ada di dalam fetchData()
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

  const markRead = async (message: AdminContactMessage, isRead: boolean) => {
    setBusyId(message.id)
    try {
      const r = await fetch(`/api/admin/contact/${message.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: isRead ? "read" : "unread" }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`)
      // Sinkronkan dialog detail (kalau sedang terbuka untuk pesan ini).
      setSelected((current) =>
        current && current.id === message.id
          ? {
              ...current,
              isRead,
              status: isRead ? "read" : "unread",
              readAt: isRead ? new Date().toISOString() : null,
            }
          : current
      )
      toast({
        title: isRead ? "Pesan ditandai sudah dibaca" : "Pesan ditandai belum dibaca",
        description: `Pesan dari ${message.name}.`,
      })
      await fetchData()
    } catch (e) {
      toast({
        title: "Gagal memperbarui pesan",
        description: toMessage(e),
        variant: "destructive",
      })
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (message: AdminContactMessage) => {
    if (
      !confirm(
        `Hapus pesan dari ${message.name} ("${message.subject}")? Tindakan ini tidak bisa dibatalkan.`
      )
    ) {
      return false
    }
    setBusyId(message.id)
    try {
      const r = await fetch(`/api/admin/contact/${message.id}`, { method: "DELETE" })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`)
      toast({
        title: "Pesan dihapus",
        description: `Pesan dari ${message.name} telah dihapus permanen.`,
      })
      // Kalau baris terakhir di halaman ini terhapus, mundur satu halaman.
      if (messages.length === 1 && page > 1) {
        setPage((p) => Math.max(1, p - 1))
      } else {
        await fetchData()
      }
      return true
    } catch (e) {
      toast({
        title: "Gagal menghapus pesan",
        description: toMessage(e),
        variant: "destructive",
      })
      return false
    } finally {
      setBusyId(null)
    }
  }

  /** Buka detail pesan di dialog; pesan yang belum dibaca langsung ditandai dibaca. */
  const openDetail = async (message: AdminContactMessage) => {
    setSelected(message)
    if (!message.isRead) {
      await markRead(message, true)
    }
  }

  if (loading && messages.length === 0 && !error) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-40 rounded bg-surface-container" />
        <div className="h-14 rounded-lg bg-surface-container" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded bg-surface-container" />
          ))}
        </div>
      </div>
    )
  }

  if (error && messages.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Icon name="info" size={40} className="mx-auto text-red-400" />
          <p className="mt-2 text-sm text-on-surface-variant">Gagal memuat pesan: {error}</p>
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
  const unread = summary?.unread ?? 0
  const read = summary?.read ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-on-surface">
            Kotak Masuk
            {unread > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                {unread} baru
              </span>
            )}
          </h1>
          <p className="text-sm text-on-surface-variant">
            {total} pesan · {unread} belum dibaca
          </p>
        </div>
        <AdminRefreshButton endpointPrefixes={["/api/admin/contact"]} onRefresh={fetchData} loading={loading} />
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
              <TabsTrigger value="unread">Belum dibaca ({unread})</TabsTrigger>
              <TabsTrigger value="read">Sudah dibaca ({read})</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full lg:max-w-xs">
            <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Cari nama, email, subjek, pesan..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {messages.length === 0 ? (
            <div className="py-16 text-center">
              <Icon name="mail" size={40} className="mx-auto text-gray-300" />
              <p className="mt-3 text-sm font-medium text-on-surface-variant">
                {search.trim()
                  ? "Tidak ada pesan yang cocok dengan pencarian"
                  : status === "unread"
                    ? "Tidak ada pesan yang belum dibaca"
                    : status === "read"
                      ? "Belum ada pesan yang sudah dibaca"
                      : "Belum ada pesan masuk"}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Pesan muncul di sini setelah pengunjung mengirim contact form di halaman /contact.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-surface-container-low/80 text-left text-on-surface-variant">
                    <th className="px-4 py-3 font-medium">Pengirim</th>
                    <th className="px-4 py-3 font-medium">Subjek</th>
                    <th className="px-4 py-3 font-medium">Pesan</th>
                    <th className="px-4 py-3 font-medium">Tanggal</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((message, i) => (
                    <tr
                      key={message.id}
                      className={`${i % 2 === 0 ? "bg-white" : "bg-surface-container-low/50"} align-top`}
                    >
                      <td className="px-4 py-3">
                        <p className={`text-on-surface ${message.isRead ? "" : "font-bold"}`}>
                          {message.name}
                        </p>
                        <a href={`mailto:${message.email}`} className="text-xs text-[#1B4D3E] hover:underline">
                          {message.email}
                        </a>
                        {message.phone && (
                          <p className="text-xs text-on-surface-variant">{message.phone}</p>
                        )}
                      </td>
                      <td className="max-w-[180px] px-4 py-3">
                        <Badge variant="outline" className="mb-1">
                          {TOPIC_LABELS[message.topic] || message.topic}
                        </Badge>
                        <p className={`truncate ${message.isRead ? "text-on-surface" : "font-semibold text-on-surface"}`} title={message.subject}>
                          {message.subject}
                        </p>
                      </td>
                      <td className="max-w-md px-4 py-3">
                        <p className="line-clamp-2 text-on-surface-variant">
                          {message.message.trim() || (
                            <span className="text-gray-400 italic">Tanpa pesan</span>
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">
                        {formatDateTime(message.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {message.isRead ? (
                          <Badge variant="secondary">Sudah dibaca</Badge>
                        ) : (
                          <Badge variant="warning">Belum dibaca</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            disabled={busyId === message.id}
                            onClick={() => openDetail(message)}
                          >
                            <Icon name="visibility" size={12} className="mr-1" />
                            Lihat
                          </Button>
                          {message.isRead ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Tandai belum dibaca"
                              disabled={busyId === message.id}
                              onClick={() => markRead(message, false)}
                            >
                              <Icon name="mark_email_unread" size={12} />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-700 hover:text-green-800"
                              title="Tandai sudah dibaca"
                              disabled={busyId === message.id}
                              onClick={() => markRead(message, true)}
                            >
                              <Icon name="mark_email_read" size={12} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            title="Hapus pesan"
                            disabled={busyId === message.id}
                            onClick={() => remove(message)}
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
          <p className="text-sm text-on-surface-variant">
            Menampilkan {messages.length} dari {pagination.total} pesan
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
            <span className="text-sm text-on-surface-variant">
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

      {/* Dialog detail pesan */}
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      >
        <DialogContent className="max-w-xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6">{selected.subject}</DialogTitle>
                <DialogDescription>
                  Dikirim {formatDateTime(selected.createdAt)} via contact form
                  {selected.ipAddress ? ` · IP ${selected.ipAddress}` : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-2 rounded-lg border bg-surface-container-low/50 p-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-on-surface-variant">Nama</p>
                  <p className="font-medium text-on-surface">{selected.name}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Topik</p>
                  <p className="font-medium text-on-surface">
                    {TOPIC_LABELS[selected.topic] || selected.topic}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Email</p>
                  <a href={`mailto:${selected.email}`} className="font-medium text-[#1B4D3E] hover:underline">
                    {selected.email}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Telepon</p>
                  <p className="font-medium text-on-surface">
                    {selected.phone ? (
                      <a href={`tel:${selected.phone}`} className="hover:underline">
                        {selected.phone}
                      </a>
                    ) : (
                      "-"
                    )}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-on-surface-variant">Notifikasi email ke tim</p>
                  <p className="text-on-surface">
                    {selected.emailSent
                      ? "Terkirim"
                      : selected.emailError
                        ? `Gagal: ${selected.emailError}`
                        : "Tidak terkirim (RESEND_API_KEY belum dikonfigurasi)"}
                  </p>
                </div>
              </div>

              <div className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-lg border p-3 text-sm text-on-surface">
                {selected.message}
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <div className="flex gap-2">
                  <a
                    href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}
                  >
                    <Button variant="secondary" size="sm">
                      <Icon name="reply" size={16} className="mr-2" />
                      Balas via email
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busyId === selected.id}
                    onClick={() => markRead(selected, !selected.isRead)}
                  >
                    <Icon name={selected.isRead ? "mark_email_unread" : "mark_email_read"} size={16} className="mr-2" />
                    {selected.isRead ? "Tandai belum dibaca" : "Tandai sudah dibaca"}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600"
                  disabled={busyId === selected.id}
                  onClick={async () => {
                    const deleted = await remove(selected)
                    if (deleted) setSelected(null)
                  }}
                >
                  <Icon name="delete" size={16} className="mr-2" />
                  Hapus
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
