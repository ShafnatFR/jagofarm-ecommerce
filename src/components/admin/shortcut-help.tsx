"use client";

import { Icon } from "@/components/ui/icon";
import { ADMIN_SHORTCUT_DOCS } from "@/hooks/use-admin-shortcuts";

/** Panel bantuan kecil: daftar semua shortcut admin (Alt+/). */
export function AdminShortcutHelp({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-label="Daftar shortcut admin">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Icon name="keyboard" size={18} className="text-primary" />
            Shortcut Admin
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup daftar shortcut"
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
        <ul className="max-h-96 overflow-y-auto p-2">
          {ADMIN_SHORTCUT_DOCS.map((doc) => (
            <li
              key={doc.combo}
              className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm hover:bg-secondary"
            >
              <span className="text-muted-foreground">{doc.desc}</span>
              <kbd className="shrink-0 rounded border border-border bg-secondary px-1.5 py-0.5 text-[11px] font-bold">
                {doc.combo}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
