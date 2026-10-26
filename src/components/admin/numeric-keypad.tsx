"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "000"] as const;

/** Kata kunci penanda field angka (label/nama/placeholder/id). */
const NUMERIC_HINTS = [
  "harga", "price", "diskon", "discount", "berat", "weight", "stok", "stock",
  "jumlah", "qty", "quantity", "panjang", "lebar", "tinggi", "length", "width", "height",
  "dimensi", "dimension", "gram", "kg", "cm", "rp", "rupiah", "nominal", "total",
  "ongkir", "poin", "point", "persen", "percent", "min", "max", "minimal", "maksimal",
];

function isNumericInput(el: HTMLElement | null): el is HTMLInputElement {
  if (!el || el.tagName !== "INPUT") return false;
  const input = el as HTMLInputElement;
  if (input.readOnly || input.disabled) return false;
  if (input.type === "number" || input.type === "tel") return true;
  if (input.type !== "text") return false;
  // type=text: hanya jika inputMode numeric ATAU identitas bertema angka.
  if (input.inputMode === "numeric" || input.inputMode === "decimal") return true;
  const hay = [
    input.name,
    input.id,
    input.placeholder,
    input.getAttribute("aria-label") || "",
    document.querySelector(`label[for="${input.id}"]`)?.textContent || "",
  ]
    .join(" ")
    .toLowerCase();
  return NUMERIC_HINTS.some((hint) => hay.includes(hint));
}

function labelOf(input: HTMLInputElement): string {
  return (
    input.getAttribute("aria-label") ||
    (input.id
      ? document.querySelector(`label[for="${input.id}"]`)?.textContent?.trim() || ""
      : "") ||
    input.placeholder ||
    input.name ||
    "input angka"
  );
}

function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto =
    el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

/** Keypad kalkulator melayang: muncul di kanan-tengah saat field angka fokus. */
export function NumericKeypad() {
  const [pressed, setPressed] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [targetLabel, setTargetLabel] = useState<string | null>(null);
  const lastInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function onFocusIn(e: FocusEvent) {
      const el = e.target as HTMLElement | null;
      if (isNumericInput(el)) {
        lastInputRef.current = el;
        setTargetLabel(labelOf(el));
        setVisible(true);
      }
    }
    function onFocusOut() {
      // Tunda: klik tombol keypad memicu focusout dulu — biarkan panel tetap
      // tampil, input terakhir tersimpan di ref.
      window.setTimeout(() => {
        const active = document.activeElement as HTMLElement | null;
        if (active && active.closest?.("[data-keypad]")) return;
        if (!isNumericInput(active)) {
          setVisible(false);
          setTargetLabel(null);
        }
      }, 120);
    }
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  // Sinkron efek klik: ketik angka di keyboard fisik → tombol keypad ikut berdenyut.
  useEffect(() => {
    if (!visible) return;
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) {
        const k = e.key;
        setPressed(k);
        window.setTimeout(() => setPressed((p) => (p === k ? null : p)), 150);
      } else if (e.key === "Backspace") {
        setPressed("back");
        window.setTimeout(() => setPressed((p) => (p === "back" ? null : p)), 150);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  const press = useCallback((key: string) => {
    setPressed(key);
    window.setTimeout(() => setPressed((p) => (p === key ? null : p)), 150);
    const el = lastInputRef.current;
    if (!el || !document.contains(el)) return;
    el.focus({ preventScroll: true });
    if (key === "clear") {
      setNativeValue(el, "");
      return;
    }
    if (key === "back") {
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const next =
        start !== end
          ? el.value.slice(0, start) + el.value.slice(end)
          : el.value.slice(0, Math.max(0, start - 1)) + el.value.slice(end);
      setNativeValue(el, next);
      const pos = start !== end ? start : Math.max(0, start - 1);
      requestAnimationFrame(() => {
        try {
          el.setSelectionRange(pos, pos);
        } catch {
          /* abaikan */
        }
      });
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    setNativeValue(el, el.value.slice(0, start) + key + el.value.slice(end));
    const pos = start + key.length;
    requestAnimationFrame(() => {
      try {
        el.setSelectionRange(pos, pos);
      } catch {
        /* input number kadang menolak selection — abaikan */
      }
    });
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <div className="pointer-events-none fixed right-4 top-1/2 z-[70] hidden -translate-y-1/2 lg:block">
          <motion.aside
            data-keypad
            initial={{ x: 96, opacity: 0, scale: 0.95 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 96, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="pointer-events-auto w-60 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon name="calculate" size={18} className="text-primary" />
                Keypad
              </CardTitle>
              <p className="truncate text-[11px] text-on-surface-variant" title={targetLabel ?? ""}>
                {targetLabel ? (
                  <>
                    Ke: <span className="font-semibold text-primary">{targetLabel}</span>
                  </>
                ) : (
                  "Ketuk tombol angka"
                )}
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-1.5">
                {KEYS.map((k) => (
                  <motion.button
                    key={k}
                    type="button"
                    whileTap={{ scale: 0.85 }}
                    animate={pressed === k ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                    transition={{ duration: 0.15 }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => press(k)}
                    className={cn(
                      "rounded-xl border border-border bg-surface-container-low py-2.5 text-base font-bold text-on-surface",
                      "transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary",
                      "active:border-primary active:bg-primary active:text-white",
                      pressed === k && "border-primary bg-primary text-white"
                    )}
                  >
                    {k}
                  </motion.button>
                ))}
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => press("back")}
                  className="flex items-center justify-center gap-1 rounded-xl border border-border bg-surface-container-low py-2 text-xs font-semibold text-on-surface-variant transition-colors hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive active:bg-destructive active:text-white"
                >
                  <Icon name="backspace" size={16} />
                  Hapus
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => press("clear")}
                  className="flex items-center justify-center gap-1 rounded-xl border border-border bg-surface-container-low py-2 text-xs font-semibold text-on-surface-variant transition-colors hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive active:bg-destructive active:text-white"
                >
                  <Icon name="delete" size={16} />
                  Bersih
                </motion.button>
              </div>
            </CardContent>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
