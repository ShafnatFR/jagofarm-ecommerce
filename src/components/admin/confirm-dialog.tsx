"use client";

/**
 * Dialog konfirmasi aksi destruktif untuk halaman admin.
 * Menggantikan `confirm()` bawaan browser yang tampilan & bahasanya tidak
 * pernah konsisten. Semua konfirmasi admin (hapus produk, kupon, artikel,
 * kategori, ulasan, pesan, dst.) lewat komponen ini.
 */
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Teks penjelasan. Baris baru (\n) dihormati sebagai paragraf. */
  description?: string;
  /** Label tombol konfirmasi. Default "Ya, lanjutkan". */
  confirmLabel?: string;
  /** "destructive" untuk aksi berbahaya; "secondary" untuk aksi netral. */
  confirmVariant?: "secondary" | "destructive";
  /** True saat permintaan sedang diproses → tombol menampilkan spinner-teks. */
  loading?: boolean;
  /** Wajib: aksi yang dijalankan bila admin menekan tombol konfirmasi. */
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Ya, lanjutkan",
  confirmVariant = "destructive",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {confirmVariant === "destructive" && (
              <Icon name="warning" size={18} className="shrink-0 text-destructive" />
            )}
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="whitespace-pre-line text-sm">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="mt-2 flex gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            Batal
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Memproses..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
