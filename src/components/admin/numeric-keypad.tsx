"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "000"] as const;

/** Sisipkan digit ke input number/text yang sedang fokus, di posisi kursor. */
function insertIntoFocused(digits: string) {
  const el = document.activeElement as HTMLInputElement | null;
  if (!el || (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA")) return false;
  if (el.type !== "number" && el.type !== "text" && el.type !== "tel") return false;
  if (el.readOnly || el.disabled) return false;
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const next = el.value.slice(0, start) + digits + el.value.slice(end);
  const nativeSetter = Object.getOwnPropertyDescriptor(
    el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
    "value"
  )?.set;
  if (nativeSetter) {
    nativeSetter.call(el, next);
  } else {
    el.value = next;
  }
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  const pos = start + digits.length;
  requestAnimationFrame(() => {
    try {
      el.setSelectionRange(pos, pos);
    } catch {
      /* input number kadang menolak selection — abaikan */
    }
  });
  return true;
}

function backspaceFocused() {
  const el = document.activeElement as HTMLInputElement | null;
  if (!el || (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA")) return false;
  if (el.readOnly || el.disabled) return false;
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const next =
    start !== end
      ? el.value.slice(0, start) + el.value.slice(end)
      : el.value.slice(0, Math.max(0, start - 1)) + el.value.slice(end);
  const nativeSetter = Object.getOwnPropertyDescriptor(
    el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
    "value"
  )?.set;
  if (nativeSetter) {
    nativeSetter.call(el, next);
  } else {
    el.value = next;
  }
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

/** Keypad kalkulator untuk form angka: ketuk tombol → masuk ke field yang fokus. */
export function NumericKeypad() {
  const [pressed, setPressed] = useState<string | null>(null);
  const [targetLabel, setTargetLabel] = useState<string | null>(null);

  // Ikuti label field angka yang sedang fokus (aria-label / label / name / placeholder).
  useEffect(() => {
    function sync() {
      const el = document.activeElement as HTMLElement | null;
      if (
        el &&
        el.tagName === "INPUT" &&
        ["number", "text", "tel"].includes((el as HTMLInputElement).type)
      ) {
        const input = el as HTMLInputElement;
        const label =
          input.getAttribute("aria-label") ||
          document.querySelector(`label[for="${input.id}"]`)?.textContent?.trim() ||
          input.placeholder ||
          input.name ||
          "input angka";
        setTargetLabel(label);
      } else {
        setTargetLabel(null);
      }
    }
    document.addEventListener("focusin", sync);
    document.addEventListener("focusout", sync);
    return () => {
      document.removeEventListener("focusin", sync);
      document.removeEventListener("focusout", sync);
    };
  }, []);

  const press = useCallback((key: string) => {
    setPressed(key);
    window.setTimeout(() => setPressed((p) => (p === key ? null : p)), 150);
    if (key === "back") {
      backspaceFocused();
    } else if (key === "clear") {
      const el = document.activeElement as HTMLInputElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
        el.value = "";
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
    } else {
      insertIntoFocused(key);
    }
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon name="calculate" size={20} className="text-primary" />
          Keypad Angka
        </CardTitle>
        <p className="text-xs text-on-surface-variant">
          {targetLabel ? (
            <>
              Mengetik ke: <span className="font-semibold text-primary">{targetLabel}</span>
            </>
          ) : (
            "Klik dulu field angka, lalu ketuk tombol."
          )}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {KEYS.map((k) => (
            <motion.button
              key={k}
              type="button"
              whileTap={{ scale: 0.88 }}
              animate={pressed === k ? { scale: [1, 1.12, 1] } : { scale: 1 }}
              transition={{ duration: 0.15 }}
              onClick={() => press(k)}
              className={cn(
                "rounded-xl border border-border bg-surface-container-low py-3 text-lg font-bold text-on-surface",
                "transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary",
                "active:border-primary active:bg-primary active:text-white",
                pressed === k && "border-primary bg-primary text-white"
              )}
            >
              {k}
            </motion.button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => press("back")}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-container-low py-2.5 text-sm font-semibold text-on-surface-variant transition-colors hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive active:bg-destructive active:text-white"
          >
            <Icon name="backspace" size={18} />
            Hapus
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => press("clear")}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-container-low py-2.5 text-sm font-semibold text-on-surface-variant transition-colors hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive active:bg-destructive active:text-white"
          >
            <Icon name="delete" size={18} />
            Bersih
          </motion.button>
        </div>
      </CardContent>
    </Card>
  );
}
