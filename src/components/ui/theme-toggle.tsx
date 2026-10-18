"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/icon";

/** Mode yang bisa dipilih pengguna. "system" mengikuti preferensi OS. */
export type ThemeMode = "light" | "dark" | "system";
type Resolved = "light" | "dark";

const STORAGE_KEY = "theme";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): Resolved {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): Resolved {
  return "light";
}

function readMode(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* localStorage bisa diblokir */
  }
  return "system";
}

/**
 * Langganan perubahan pilihan mode. Perubahan dari tab lain tertangkap lewat
 * event `storage`; perubahan dari komponen ini memicu event kustom karena
 * `storage` tidak terpicu di tab yang sama.
 */
const MODE_EVENT = "jagofarm:theme-mode";

function subscribeMode(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(MODE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(MODE_EVENT, callback);
  };
}

/**
 * Terapkan mode ke <html> dan simpan pilihannya.
 * "system" menghapus pilihan tersimpan agar skrip anti-kedip di root layout
 * kembali memakai preferensi OS pada kunjungan berikutnya.
 */
export function applyThemeMode(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = mode === "dark" || (mode === "system" && prefersDark);
  root.classList.toggle("dark", dark);
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* abaikan */
  }
  // Beri tahu komponen lain di tab yang sama (event `storage` tidak terpicu).
  window.dispatchEvent(new Event(MODE_EVENT));
}

/**
 * Tombol pengalih mode terang/gelap (A15).
 * Status dibaca langsung dari kelas `.dark` di <html> via useSyncExternalStore
 * (tidak ada setState di dalam effect). Preferensi disimpan di localStorage;
 * script anti-kedip ada di layout dan dijalankan sebelum paint.
 *
 * Varian `menu` menampilkan tiga pilihan (Terang / Gelap / Sistem) — dipakai di
 * header admin supaya admin bisa memaksa mode tanpa mengikuti preferensi situs.
 */
export function ThemeToggle({
  className = "",
  variant = "icon",
}: {
  className?: string;
  variant?: "icon" | "menu";
}) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [open, setOpen] = useState(false);
  // Pilihan tersimpan dibaca lewat external store juga, supaya tidak ada
  // setState di dalam effect (aturan react-hooks/set-state-in-effect).
  const mode = useSyncExternalStore(subscribeMode, readMode, () => "system" as ThemeMode);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Ikuti perubahan OS saat mode = "system".
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyThemeMode("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  // Tutup menu saat klik di luar atau tekan Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (variant === "icon") {
    function toggle() {
      applyThemeMode(theme === "dark" ? "light" : "dark");
    }
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
        title={theme === "dark" ? "Mode terang" : "Mode gelap"}
        className={`rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low ${className}`}
      >
        <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} size={20} />
      </button>
    );
  }

  const options: { value: ThemeMode; label: string; icon: string }[] = [
    { value: "light", label: "Terang", icon: "light_mode" },
    { value: "dark", label: "Gelap", icon: "dark_mode" },
    { value: "system", label: "Ikuti Sistem", icon: "brightness_auto" },
  ];

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Pilih mode tampilan"
        title="Mode tampilan"
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
      >
        <Icon name={theme === "dark" ? "dark_mode" : "light_mode"} size={20} />
        <span className="hidden xl:inline">{theme === "dark" ? "Gelap" : "Terang"}</span>
        <Icon name="expand_more" size={16} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-lg"
        >
          {options.map((opt) => {
            const active = mode === opt.value;
            return (
              <button
                key={opt.value}
                role="menuitemradio"
                aria-checked={active}
                type="button"
                onClick={() => {
                  applyThemeMode(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-on-surface hover:bg-surface-container-low"
                }`}
              >
                <Icon name={opt.icon} size={18} />
                {opt.label}
                {active && <Icon name="check" size={16} className="ml-auto" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
