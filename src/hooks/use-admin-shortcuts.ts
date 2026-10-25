"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/** Satu entri aksi di command palette / daftar shortcut. */
export interface AdminAction {
  id: string;
  label: string;
  hint?: string;
  icon: string;
  keywords?: string[];
  run: () => void;
}

/** Navigasi modul admin — sinkron dengan sidebarLinks di admin/layout.tsx. */
export const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "dashboard", key: "1" },
  { href: "/admin/products", label: "Produk", icon: "inventory_2", key: "2" },
  { href: "/admin/orders", label: "Pesanan", icon: "shopping_cart", key: "3" },
  { href: "/admin/categories", label: "Kategori", icon: "account_tree", key: "4" },
  { href: "/admin/customers", label: "Pelanggan", icon: "people", key: "5" },
  { href: "/admin/coupons", label: "Kupon", icon: "label", key: "6" },
  { href: "/admin/reviews", label: "Ulasan", icon: "star", key: "7" },
  { href: "/admin/consultation", label: "Konsultasi", icon: "forum", key: "8" },
  { href: "/admin/contact", label: "Pesan", icon: "mail", key: "9" },
  { href: "/admin/reports", label: "Laporan", icon: "bar_chart", key: "0" },
  { href: "/admin/site-settings", label: "Pengaturan", icon: "settings", key: "," },
] as const;

/**
 * Skema Gmail-style — tanpa Alt supaya tidak direbut browser/OS:
 * - Ctrl+K / Cmd+K : palette
 * - g lalu 1..0    : pindah modul (tahan g tidak perlu, tekan berurutan)
 * - / : fokus cari,  ? : bantuan,  n/s/r/f : aksi halaman,  Esc : tutup
 */
export const ADMIN_SHORTCUT_DOCS: { combo: string; desc: string }[] = [
  { combo: "Ctrl+K", desc: "Buka command palette" },
  { combo: "g lalu 1..0", desc: "Pindah modul (Dashboard..Laporan)" },
  { combo: "g lalu ,", desc: "Buka Pengaturan" },
  { combo: "n", desc: "Tambah baru (konteks halaman)" },
  { combo: "s", desc: "Simpan form (konteks halaman)" },
  { combo: "/", desc: "Fokus ke pencarian" },
  { combo: "g lalu r", desc: "Muat ulang data halaman" },
  { combo: "?", desc: "Buka/tutup daftar shortcut ini" },
  { combo: "Esc", desc: "Tutup palette / dialog" },
  { combo: "↑ ↓ + Enter", desc: "Pilih aksi di palette" },
];

/** Event bus lokal: halaman mendaftarkan aksi kontekstualnya (simpan, kirim, ubah status). */
type ActionHandler = () => void;
const pageActions = new Map<string, ActionHandler>();

export function registerAdminAction(id: string, handler: ActionHandler) {
  pageActions.set(id, handler);
  return () => {
    pageActions.delete(id);
  };
}

function triggerAction(id: string): boolean {
  const fn = pageActions.get(id);
  if (!fn) return false;
  fn();
  return true;
}

/** Fokus ke input pencarian pertama yang terlihat di halaman. */
function focusSearch(): boolean {
  const candidates = Array.from(
    document.querySelectorAll<HTMLInputElement>(
      'input[type="text"], input[type="search"], input:not([type]), textarea'
    )
  ).filter(
    (el) =>
      el.offsetParent !== null &&
      !el.disabled &&
      !el.readOnly &&
      /cari|search/i.test(el.placeholder || el.getAttribute("aria-label") || el.name || "")
  );
  const target =
    candidates[0] ??
    Array.from(
      document.querySelectorAll<HTMLInputElement>('input[type="text"], input[type="search"], input:not([type])')
    ).find((el) => el.offsetParent !== null && !el.disabled && !el.readOnly);
  if (!target) return false;
  target.focus();
  target.select?.();
  return true;
}

/** Klik tombol "Tambah baru" — cari link/button tambah di halaman. */
function clickAdd(): boolean {
  const el = Array.from(
    document.querySelectorAll<HTMLAnchorElement | HTMLButtonElement>("a[href], button")
  ).find(
    (node) =>
      node.offsetParent !== null &&
      /tambah|buat baru|baru/i.test(node.textContent || "") &&
      !node.hasAttribute("disabled")
  );
  if (!el) return false;
  el.click();
  return true;
}

/** Tombol "g" ditekan dalam 800ms terakhir → tunggu tombol kedua (g lalu 1..0). */
const G_WINDOW_MS = 800;

export function useAdminShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [hintOn, setHintOn] = useState(false);
  const paletteOpenRef = useRef(false);
  paletteOpenRef.current = paletteOpen;
  const gAtRef = useRef(0);
  const gTimerRef = useRef<number | null>(null);

  /** Matikan mode tunggu-tombol-kedua + sembunyikan badge seketika. */
  function cancelG() {
    gAtRef.current = 0;
    setHintOn(false);
    if (gTimerRef.current !== null) {
      window.clearTimeout(gTimerRef.current);
      gTimerRef.current = null;
    }
  }

  const gotoModule = useCallback(
    (href: string) => {
      cancelG();
      setPaletteOpen(false);
      setHelpOpen(false);
      if (pathname !== href) router.push(href);
    },
    [pathname, router]
  );

  const actions: AdminAction[] = useMemo(
    () => [
      ...NAV_ITEMS.map((item) => ({
        id: `nav-${item.href}`,
        label: `Buka ${item.label}`,
        hint: `g ${item.key}`,
        icon: item.icon,
        keywords: [item.label.toLowerCase(), "buka", "modul", "navigasi"],
        run: () => gotoModule(item.href),
      })),
      {
        id: "page-add",
        label: "Tambah baru (halaman ini)",
        hint: "n",
        icon: "add",
        keywords: ["tambah", "baru", "buat"],
        run: () => {
          if (!triggerAction("page-add")) clickAdd();
        },
      },
      {
        id: "page-save",
        label: "Simpan form (halaman ini)",
        hint: "s",
        icon: "save",
        keywords: ["simpan", "save", "submit"],
        run: () => {
          if (!triggerAction("page-save")) {
            const form = document.querySelector("form");
            if (form) {
              form.requestSubmit();
            }
          }
        },
      },
      {
        id: "page-search",
        label: "Fokus ke pencarian",
        hint: "/",
        icon: "search",
        keywords: ["cari", "search", "fokus", "filter"],
        run: () => {
          focusSearch();
        },
      },
      {
        id: "page-refresh",
        label: "Muat ulang data",
        hint: "g r",
        icon: "refresh",
        keywords: ["refresh", "reload", "muat ulang", "segarkan"],
        run: () => {
          if (!triggerAction("page-refresh")) window.location.reload();
        },
      },
    ],
    [gotoModule]
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const inField =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      // Esc selalu menutup palette/bantuan + membatalkan tunggu-tombol-kedua.
      if (e.key === "Escape") {
        cancelG();
        if (paletteOpenRef.current) {
          setPaletteOpen(false);
          e.preventDefault();
          return;
        }
        setHelpOpen((v) => {
          if (v) {
            e.preventDefault();
            return false;
          }
          return v;
        });
        return;
      }

      // Ctrl+K / Cmd+K → palette (standar VS Code, Linear, GitHub). Jalan di mana saja.
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }

      // ? → bantuan. Shift+/ menghasilkan "?" — tangani sebelum cek inField
      // supaya bisa dibuka dari mana saja, kecuali sedang mengetik di field.
      if (e.key === "?" && !inField && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setHelpOpen((v) => !v);
        return;
      }

      // Sisa shortcut single-key: hanya di luar field ketik.
      if (inField || e.ctrlKey || e.metaKey || e.altKey) return;

      // / → fokus cari (boleh juga dari luar field saja; di dalam field "/" mengetik biasa).
      if (e.key === "/") {
        e.preventDefault();
        focusSearch();
        return;
      }

      // g lalu <tombol>: tekan g, lepas, lalu tekan tombol kedua dalam 800ms.
      // Timer disimpan di ref supaya bisa dibatalkan — tidak ada timer ganda.
      if (e.key.toLowerCase() === "g") {
        cancelG();
        gAtRef.current = Date.now();
        setHintOn(true);
        gTimerRef.current = window.setTimeout(cancelG, G_WINDOW_MS);
        return;
      }
      if (gAtRef.current !== 0 && Date.now() - gAtRef.current < G_WINDOW_MS) {
        const nav = NAV_ITEMS.find((item) => item.key === e.key);
        if (nav) {
          e.preventDefault();
          gotoModule(nav.href);
          return;
        }
        // g lalu r → muat ulang data halaman (aman saat mengetik: butuh awalan g).
        if (e.key.toLowerCase() === "r") {
          e.preventDefault();
          cancelG();
          if (!triggerAction("page-refresh")) window.location.reload();
          return;
        }
        // Tombol kedua bukan target navigasi → batalkan seketika,
        // lalu lanjut ke shortcut biasa di bawah (n/s/f tetap jalan).
        cancelG();
      }

      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (!triggerAction("page-add")) clickAdd();
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!triggerAction("page-save")) {
          const form = document.querySelector("form");
          if (form) form.requestSubmit();
        }
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        focusSearch();
      }
    }
    function onBlur() {
      setPaletteOpen(false);
      setHintOn(false);
      gAtRef.current = 0;
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", onBlur);
      if (gTimerRef.current !== null) window.clearTimeout(gTimerRef.current);
    };
  }, [gotoModule]);

  return { actions, paletteOpen, setPaletteOpen, helpOpen, setHelpOpen, hintOn, gotoModule };
}
