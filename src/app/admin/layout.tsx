"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/products", label: "Produk", icon: "inventory_2" },
  { href: "/admin/orders", label: "Pesanan", icon: "shopping_cart" },
  { href: "/admin/categories", label: "Kategori", icon: "account_tree" },
  { href: "/admin/customers", label: "Pelanggan", icon: "people" },
  { href: "/admin/coupons", label: "Kupon", icon: "label" },
  { href: "/admin/reviews", label: "Ulasan", icon: "star" },
  { href: "/admin/reports", label: "Laporan", icon: "bar_chart" },
]

type GuardState = "checking" | "authorized" | "denied"
type AdminIdentity = { name: string | null; email: string | null; role: string }

type AdminFetchCache = Map<string, Promise<unknown>>;

const ADMIN_CACHE_KEY = "__jagofarm_admin_cache";

function installAdminDataCache() {
  if (typeof window === "undefined") return;
  const scope = window as Window & {
    [ADMIN_CACHE_KEY]?: AdminFetchCache;
    __jagoAdminClearCache?: () => void;
  };
  if (scope[ADMIN_CACHE_KEY]) return;

  const cache: AdminFetchCache = new Map();
  const nativeFetch = window.fetch.bind(window);
  scope[ADMIN_CACHE_KEY] = cache;
  scope.__jagoAdminClearCache = () => cache.clear();

  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const path = new URL(url, window.location.origin).pathname + new URL(url, window.location.origin).search;
    if (method !== "GET" || !path.startsWith("/api/admin/")) return nativeFetch(input, init);

    const cached = cache.get(path);
    if (cached) {
      return cached.then((payload) => new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json", "X-Jago-Admin-Cache": "hit" },
      }));
    }

    const request = nativeFetch(input, { ...init, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.clone().json().catch(() => null);
      });
    cache.set(path, request);
    return request.then((payload) => {
      if (payload === null) return new Response(JSON.stringify({ error: "Gagal memuat data" }), { status: 500 });
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json", "X-Jago-Admin-Cache": "miss" },
      });
    });
  }) as typeof window.fetch;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [guardState, setGuardState] = useState<GuardState>("checking")
  const [admin, setAdmin] = useState<AdminIdentity | null>(null)

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
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[#F8F7F4]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1B4D3E] border-t-transparent" />
        <p className="text-sm text-on-surface-variant">Memeriksa hak akses...</p>
      </div>
    )
  }

  if (guardState === "denied") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8F7F4] p-6">
        <div className="w-full max-w-md rounded-xl border bg-white p-8 text-center shadow-sm">
          <Icon name="shield" size={48} className="mx-auto text-red-500" />
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
    <div className="flex h-screen overflow-hidden bg-[#F8F7F4]">
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
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-[#1B4D3E] text-white transition-all duration-300 lg:static",
          collapsed ? "w-[72px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn("flex h-16 items-center border-b border-white/10 px-4", collapsed && "justify-center")}>
          {!collapsed && (
            <Link href="/admin" className="text-xl font-bold tracking-tight">
              🌱 JagoFarm
            </Link>
          )}
          {collapsed && (
            <Link href="/admin" className="text-xl font-bold">
              🌱
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                  collapsed && "justify-center px-0"
                )}
              >
                <Icon name={link.icon} size={20} />
                {!collapsed && <span>{link.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="hidden border-t border-white/10 p-3 lg:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex w-full items-center justify-center rounded-lg p-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white",
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
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm lg:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Icon name="menu" size={20} />
            </Button>
            <div className="hidden items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2 md:flex">
              <Icon name="search" size={16} className="text-gray-400" />
              <input
                type="text"
                placeholder="Cari..."
                className="bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              title="Refresh data admin"
              className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low"
              onClick={() => {
                const scope = window as Window & { __jagoAdminClearCache?: () => void };
                scope.__jagoAdminClearCache?.();
                window.location.reload();
              }}
            >
              <Icon name="refresh" size={20} />
            </button>
            <button className="relative rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low">
              <Icon name="notifications" size={20} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B4D3E] text-white">
                <Icon name="person" size={16} />
              </div>
              <div className="hidden leading-tight md:block">
                <p className="text-sm font-medium">{admin?.name || "Admin"}</p>
                <p className="text-xs capitalize text-gray-400">{admin?.role || "admin"}</p>
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
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
