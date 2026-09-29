"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Icon } from "@/components/ui/icon"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/products", label: "Produk", icon: "inventory_2" },
  { href: "/admin/orders", label: "Pesanan", icon: "receipt_long" },
  { href: "/admin/categories", label: "Kategori", icon: "category" },
  { href: "/admin/customers", label: "Pelanggan", icon: "people" },
  { href: "/admin/coupons", label: "Kupon & Promo", icon: "discount" },
  { href: "/admin/reviews", label: "Ulasan", icon: "star" },
  { href: "/admin/reports", label: "Laporan", icon: "bar_chart" },
]

const sectionGroups = [
  {
    title: "Utama",
    links: sidebarLinks.slice(0, 5),
  },
  {
    title: "Pemasaran & Data",
    links: sidebarLinks.slice(5),
  },
]

type GuardState = "checking" | "authorized" | "denied"
type AdminIdentity = { name: string | null; email: string | null; role: string }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [guardState, setGuardState] = useState<GuardState>("checking")
  const [admin, setAdmin] = useState<AdminIdentity | null>(null)

  useEffect(() => {
    let cancelled = false
    const nextParam = encodeURIComponent(pathname || "/admin")
    const loginUrl = `/login?next=${nextParam}&callbackUrl=${nextParam}`

    fetch("/api/user/profile", { cache: "no-store", credentials: "same-origin" })
      .then(async (res) => {
        if (res.status === 401) {
          if (!cancelled) router.replace(loginUrl)
          return null
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((payload: { user?: Record<string, unknown> } | Record<string, unknown> | null) => {
        if (cancelled || !payload) return
        const profile = ("user" in payload && payload.user ? payload.user : payload) as Record<string, unknown>
        const role = typeof profile?.role === "string" ? profile.role.toLowerCase() : ""

        if (!profile?.id || role !== "admin") {
          setGuardState("denied")
          return
        }

        setAdmin({
          name: typeof profile.name === "string" ? profile.name : null,
          email: typeof profile.email === "string" ? profile.email : null,
          role,
        })
        setGuardState("authorized")
      })
      .catch(() => {
        if (!cancelled) setGuardState("denied")
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  if (guardState === "checking") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[#F1F5F2]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1B4D3E] border-t-transparent" />
        <p className="text-sm text-slate-500">Memeriksa hak akses...</p>
      </div>
    )
  }

  if (guardState === "denied") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F1F5F2] p-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
          <Icon name="shield_alert" size={48} className="mx-auto text-red-500" />
          <h1 className="mt-4 text-xl font-bold text-slate-900">Akses ditolak</h1>
          <p className="mt-2 text-sm text-slate-500">
            Halaman admin hanya dapat diakses oleh admin atau staf. Akun Anda tidak memiliki
            wewenang untuk membuka halaman ini.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/">
              <Button variant="secondary" className="w-full sm:w-auto">Kembali ke Beranda</Button>
            </Link>
            <Link href="/login?next=%2Fadmin&callbackUrl=%2Fadmin">
              <Button className="w-full sm:w-auto">Masuk dengan akun lain</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const initials = admin?.name
    ? admin.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "AD"

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 flex flex-col justify-between border-r border-[#0d2a21] bg-[#12382c] text-slate-200 select-none transition-transform duration-300 lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Top Brand & Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-emerald-900/40">
            <Link href="/admin" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-300 flex items-center justify-center shadow-lg shadow-emerald-950/40">
                <Icon name="eco" size={20} className="text-emerald-950" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  Jago<span className="text-emerald-400">Farm</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-300/70 block -mt-1">Agri-Aquaculture</span>
              </div>
            </Link>
            <span className="bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 text-[10px] font-medium px-2 py-0.5 rounded-full">v2.4</span>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1.5">
            {sectionGroups.map((group) => (
              <div key={group.title} className={group.title !== "Utama" ? "pt-4" : ""}>
                <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-emerald-400/50 mb-2">{group.title}</p>
                {group.links.map((link) => {
                  const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href))
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition-all group",
                        isActive
                          ? "bg-emerald-500/15 text-white shadow-sm border border-emerald-500/20"
                          : "text-emerald-100/70 hover:bg-[#184738] hover:text-white"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon
                          name={link.icon}
                          size={20}
                          className={cn(
                            "transition-colors",
                            isActive ? "text-emerald-400" : "text-emerald-300/60 group-hover:text-emerald-300"
                          )}
                        />
                        <span className={cn("text-sm", isActive && "tracking-wide")}>{link.label}</span>
                      </div>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom User Profile Card */}
        <div className="p-4 border-t border-emerald-900/50 bg-[#0d2a21]/50">
          <div className="flex items-center justify-between bg-[#153f32] p-2.5 rounded-xl border border-emerald-800/40">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-sm text-white border-2 border-emerald-400/40 shadow-inner">
                  {initials}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#12382c]" />
              </div>
              <div className="truncate text-left">
                <p className="text-xs font-semibold text-white truncate">{admin?.name || "Admin"}</p>
                <p className="text-[11px] text-emerald-300/70 truncate capitalize">{admin?.role || "admin"}</p>
              </div>
            </div>
            <button
              className="p-1.5 text-emerald-400 hover:text-white hover:bg-emerald-800/50 rounded-lg transition-colors"
              title="Logout"
              onClick={async () => {
                try { await fetch("/auth/signout", { method: "POST" }) } catch { /* ignored */ }
                router.replace("/login?next=%2Fadmin&callbackUrl=%2Fadmin")
              }}
            >
              <Icon name="logout" size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-20 bg-white border-b border-slate-200/80 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md bg-white/95">
          {/* Left: mobile menu + search */}
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Icon name="menu" size={20} />
            </Button>
            <div className="relative flex-1 hidden md:block">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Icon name="search" size={16} />
              </div>
              <input
                type="text"
                placeholder="Cari pesanan, produk, atau pelanggan..."
                className="w-full pl-10 pr-12 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-700 placeholder-slate-400 transition"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-xs">/</kbd>
              </div>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center space-x-3 lg:space-x-4 pl-4">
            <div className="hidden sm:flex items-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 space-x-2">
              <Icon name="calendar_today" size={16} className="text-slate-400" />
              <span>{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
            <button className="relative p-2 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition" title="Notifikasi">
              <Icon name="notifications" size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-500/20">
                {initials}
              </div>
              <span className="text-xs font-semibold text-slate-700 hidden xl:inline">{admin?.name || "Admin"}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#F1F5F2]">
          <div className="max-w-7xl w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}