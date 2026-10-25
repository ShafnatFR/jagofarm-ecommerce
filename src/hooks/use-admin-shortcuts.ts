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

export const ADMIN_SHORTCUT_DOCS: { combo: string; desc: string }[] = [
  { combo: "Alt+1..0", desc: "Pindah modul (Dashboard..Laporan)" },
  { combo: "Alt+,", desc: "Buka Pengaturan" },
  { combo: "Alt+N", desc: "Tambah baru (konteks halaman)" },
  { combo: "Alt+S", desc: "Simpan form (konteks halaman)" },
  { combo: "Alt+F", desc: "Fokus ke pencarian" },
  { combo: "Alt+R", desc: "Muat ulang data halaman" },
  { combo: "Alt+/", desc: "Buka/tutup daftar shortcut ini" },
  { combo: "Alt+Spasi", desc: "Buka command palette" },
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

export function useAdminShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [altHeld, setAltHeld] = useState(false);
  const paletteOpenRef = useRef(false);
  paletteOpenRef.current = paletteOpen;

  const gotoModule = useCallback(
    (href: string) => {
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
        hint: `Alt+${item.key}`,
        icon: item.icon,
        keywords: [item.label.toLowerCase(), "buka", "modul", "navigasi"],
        run: () => gotoModule(item.href),
      })),
      {
        id: "page-add",
        label: "Tambah baru (halaman ini)",
        hint: "Alt+N",
        icon: "add",
        keywords: ["tambah", "baru", "buat"],
        run: () => {
          if (!triggerAction("page-add")) clickAdd();
        },
      },
      {
        id: "page-save",
        label: "Simpan form (halaman ini)",
        hint: "Alt+S",
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
        hint: "Alt+F",
        icon: "search",
        keywords: ["cari", "search", "fokus", "filter"],
        run: () => {
          focusSearch();
        },
      },
      {
        id: "page-refresh",
        label: "Muat ulang data",
        hint: "Alt+R",
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
      // Tandai Alt sedang ditahan (tanpa modifier lain) → tampilkan badge hint.
      if (e.key === "Alt" && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        setAltHeld(true);
      }
      const target = e.target as HTMLElement | null;
      const inField =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      // Esc selalu menutup palette/bantuan.
      if (e.key === "Escape") {
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

      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const key = e.key.toLowerCase();

      // Alt+Spasi → palette (cegah menu window).
      if (key === " " || e.code === "Space") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      // Alt+/ → bantuan.
      if (key === "/" || key === "?") {
        e.preventDefault();
        setHelpOpen((v) => !v);
        return;
      }
      // Jangan rebut Alt+huruf saat mengetik (kecuali Spasi dan /).
      if (inField) return;

      const nav = NAV_ITEMS.find((item) => item.key === key || item.key === e.key);
      if (nav) {
        e.preventDefault();
        gotoModule(nav.href);
        return;
      }
      if (key === "n") {
        e.preventDefault();
        if (!triggerAction("page-add")) clickAdd();
      } else if (key === "s") {
        e.preventDefault();
        if (!triggerAction("page-save")) {
          const form = document.querySelector("form");
          if (form) form.requestSubmit();
        }
      } else if (key === "f") {
        e.preventDefault();
        focusSearch();
      } else if (key === "r") {
        e.preventDefault();
        if (!triggerAction("page-refresh")) window.location.reload();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "Alt") setAltHeld(false);
    }
    function onBlur() {
      setAltHeld(false);
      setPaletteOpen(false);
    }
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [gotoModule]);

  return { actions, paletteOpen, setPaletteOpen, helpOpen, setHelpOpen, altHeld, gotoModule };
}
