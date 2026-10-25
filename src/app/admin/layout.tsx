"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AdminRefreshProvider } from "./admin-refresh"
import { NotificationBell } from "@/components/admin/notification-bell"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { AdminCommandPalette } from "@/components/admin/command-palette"
import { AdminShortcutHelp } from "@/components/admin/shortcut-help"
import { AltBadge } from "@/components/admin/alt-badge"
import { useAdminShortcuts, NAV_ITEMS } from "@/hooks/use-admin-shortcuts"

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/products", label: "Produk", icon: "inventory_2" },
  { href: "/admin/orders", label: "Pesanan", icon: "shopping_cart" },
  { href: "/admin/categories", label: "Kategori", icon: "account_tree" },
  { href: "/admin/customers", label: "Pelanggan", icon: "people" },
  { href: "/admin/coupons", label: "Kupon", icon: "label" },
  { href: "/admin/reviews", label: "Ulasan", icon: "star" },
  { href: "/admin/consultation", label: "Konsultasi", icon: "forum" },
  { href: "/admin/contact", label: "Pesan", icon: "mail" },
  { href: "/admin/reports", label: "Laporan", icon: "bar_chart" },
  { href: "/admin/site-settings", label: "Pengaturan", icon: "settings" },
]

type GuardState = "checking" | "authorized" | "denied"
type AdminIdentity = { name: string | null; email: string | null; role: string }

type CachedAdminResponse = { response: Response; expiresAt: number }

type AdminFetchCache = Map<string, CachedAdminResponse>

const ADMIN_CACHE_KEY = "__jagofarm_admin_cache"

/** Cache admin punya TTL supaya data tidak bisa basi selamanya walau tombol Refresh tidak dipakai. */
const ADMIN_CACHE_TTL_MS = 60_000
/** Batas jumlah entri supaya Map tidak tumbuh tanpa henti. */
const ADMIN_CACHE_MAX_ENTRIES = 40

function installAdminDataCache() {
  if (typeof window === "undefined") return;
  const scope = window as Window & {
    [ADMIN_CACHE_KEY]?: AdminFetchCache;
    __jagoAdminClearCache?: (endpointPrefixes?: string[]) => void;
  };
  if (scope[ADMIN_CACHE_KEY]) return;

  const cache: AdminFetchCache = new Map();
  const nativeFetch = window.fetch.bind(window);
  scope[ADMIN_CACHE_KEY] = cache;
  scope.__jagoAdminClearCache = (endpointPrefixes) => {
    if (!endpointPrefixes?.length) {
      cache.clear();
      return;
    }
    for (const key of cache.keys()) {
      if (endpointPrefixes.some((prefix) => key === prefix || key.startsWith(`${prefix}?`))) {
        cache.delete(key);
      }
    }
  };

  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const parsed = new URL(url, window.location.origin);
    const path = parsed.pathname + parsed.search;
    if (method !== "GET" || !path.startsWith("/api/admin/")) return nativeFetch(input, init);
    if (init?.cache === "no-store") {
      cache.delete(path);
      return nativeFetch(input, init);
    }

    const cached = cache.get(path);
    if (cached && cached.expiresAt > Date.now()) return cached.response.clone();

    try {
      const response = await nativeFetch(input, { ...init, cache: "no-store" });
      // Respons error TIDAK dicache: status 401/403 harus tetap sampai ke pemanggil
      // supaya guard admin bisa mengarahkan ke login, bukan jadi "Gagal memuat data".
      if (!response.ok) {
        cache.delete(path);
        return response;
      }

      const stored = response.clone();
      if (cache.size >= ADMIN_CACHE_MAX_ENTRIES) {
        for (const [key, entry] of cache) {
          if (entry.expiresAt <= Date.now()) cache.delete(key);
        }
        if (cache.size >= ADMIN_CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
      }
      cache.set(path, { response: stored, expiresAt: Date.now() + ADMIN_CACHE_TTL_MS });
      return response;
    } catch (error) {
      cache.delete(path);
      throw error;
    }
  }) as typeof window.fetch;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [guardState, setGuardState] = useState<GuardState>("checking")
  const [admin, setAdmin] = useState<AdminIdentity | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const { actions, paletteOpen, setPaletteOpen, helpOpen, setHelpOpen, hintOn } = useAdminShortcuts()

  // Guard nyata: hanya admin yang boleh melihat isi /admin/*.
  // Konten admin TIDAK dirender selama guardState === "checking" supaya
  // tidak ada flash konten sebelum verifikasi selesai.
  useEffect(() => {
    installAdminDataCache();
    let cancelled = false
    // Halaman login membaca `callbackUrl`; `next` dipertahankan sebagai
    // parameter eksplisit tujuan setelah login.
    const nextParam = encodeURIComponent(pathname || "/admin")
    const loginUrl = `/login?next=${nextParam}&callbackUrl=${nextParam}`

    fetch("/api/user/profile", { cache: "no-store", credentials: "same-origin" })
      .then(async (res) => {
        if (res.status === 401) {
          // Belum login -> arahkan ke halaman login.
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

  useEffect(() => {
    if (guardState !== "authorized") return;
    // Badge "pesan belum dibaca" — best-effort, hanya tampil setelah guard lolos.
    // Kegagalan fetch diabaikan supaya tidak mengganggu guard flow maupun halaman.
    let cancelled = false;
    fetch("/api/admin/contact?status=unread&limit=1", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { summary?: { unread?: number } } | null) => {
        if (!cancelled && typeof payload?.summary?.unread === "number") {
          setUnreadCount(payload.summary.unread);
        }
      })
      .catch(() => {
        // badge informatif saja
      });
    return () => {
      cancelled = true;
    };
  }, [guardState]);

  useEffect(() => {
    if (guardState !== "authorized") return;
    const endpoints = [
      "/api/admin/stats",
      "/api/admin/categories",
      "/api/admin/products?page=1&limit=20",
      "/api/admin/orders?page=1&limit=20",
      "/api/admin/customers?page=1&limit=20",
      "/api/admin/coupons",
      "/api/admin/reviews?page=1&limit=20",
      "/api/admin/reports?period=30",
    ];
    void Promise.allSettled(endpoints.map((endpoint) => fetch(endpoint)));
  }, [guardState]);

  if (guardState === "checking") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-outline-variant border-t-transparent" />
        <p className="text-sm text-on-surface-variant">Memeriksa hak akses...</p>
      </div>
    )
  }

  if (guardState === "denied") {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-xl border bg-surface p-8 text-center shadow-sm">
          <Icon name="shield" size={48} className="mx-auto text-destructive" />
          <h1 className="mt-4 text-xl font-bold text-on-surface">Akses ditolak</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
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
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-[#123f2d] dark:bg-[#0d2118] text-white transition-all duration-300 lg:static",
          collapsed ? "w-[72px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn("flex h-16 items-center border-b border-white/10 px-4", collapsed && "justify-center px-2")}>
          <Link href="/admin" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-white/10 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-serif font-bold text-white tracking-tight leading-none text-lg">JagoFarm</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-white/60">Agri &amp; Aqua Tech</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href))
            const navKey = NAV_ITEMS.find((n) => n.href === link.href)?.key
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary/60 bg-surface/15 text-white"
                    : "border-primary/20 text-white/70 hover:border-primary/40 hover:bg-on-primary/10 hover:text-white",
                  collapsed && "justify-center px-0"
                )}
              >
                <Icon name={link.icon} size={20} />
                {navKey && (
                  <AltBadge
                    combo={`g + ${navKey}`}
                    visible={hintOn}
                    className={cn("absolute -top-1.5", collapsed ? "-right-1" : "right-1")}
                  />
                )}
                {!collapsed && (
                  <>
                    <span>{link.label}</span>
                    {link.href === "/admin/contact" && unreadCount > 0 && (
                      <span className="ml-auto rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="hidden border-t border-white/10 p-3 lg:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex w-full items-center justify-center rounded-lg p-2 text-sm text-white/70 transition-colors hover:bg-on-primary/10 hover:text-white",
              collapsed ? "" : "font-medium"
            )}
            title={collapsed ? "Buka sidebar" : undefined}
          >
            {collapsed ? <Icon name="chevron_right" size={20} /> : "Tutup sidebar"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b bg-surface px-4 shadow-sm lg:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Icon name="menu" size={20} />
            </Button>
            <div className="hidden items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2 md:flex">
              <Icon name="search" size={16} className="text-on-surface-variant" />
              <input
                type="text"
                placeholder="Cari..."
                className="bg-transparent text-sm outline-none placeholder:text-on-surface-variant"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              title="Command palette (Ctrl+K)"
              onClick={() => setPaletteOpen(true)}
            >
              <Icon name="terminal" size={18} />
            </Button>
            <ThemeToggle variant="menu" />
            <NotificationBell />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#123f2d] dark:bg-[#0d2118] text-white">
                <Icon name="person" size={16} />
              </div>
              <div className="hidden leading-tight md:block">
                <p className="text-sm font-medium">{admin?.name || "Admin"}</p>
                <p className="text-xs capitalize text-on-surface-variant">{admin?.role || "admin"}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              title="Keluar"
              onClick={async () => {
                // Best-effort sign out, lalu kembali ke halaman login.
                try {
                  await fetch("/auth/signout", { method: "POST" })
                } catch {
                  // diabaikan: cookie sesi tetap dibersihkan di sisi server saat berhasil
                }
                router.replace("/login?next=%2Fadmin&callbackUrl=%2Fadmin")
              }}
            >
              <Icon name="logout" size={16} />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AdminRefreshProvider>{children}</AdminRefreshProvider>
          </motion.div>
        </main>
      </div>
      <AdminCommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} actions={actions} />
      <AdminShortcutHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}
