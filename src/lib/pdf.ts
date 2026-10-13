/**
 * Penulis PDF minimalis tanpa dependensi (A2 — Invoice PDF).
 *
 * Menghasilkan PDF 1.4 valid berisi teks (font standar Helvetica) dengan
 * dukungan: beberapa halaman, ukuran font, perataan kiri/kanan/tengah, garis
 * horizontal, dan warna teks. Cukup untuk invoice sederhana — tanpa perlu
 * menambah paket (pdfkit/puppeteer) yang berat untuk lingkungan serverless.
 *
 * Catatan: hanya karakter ASCII/Latin-1 yang aman; teks di-escape otomatis.
 */

export type PdfAlign = "left" | "right" | "center";

export interface PdfTextOptions {
  size?: number;
  align?: PdfAlign;
  /** Warna teks 0–255 (default hitam). */
  color?: [number, number, number];
  /** Cetak tebal (memakai font Helvetica-Bold). */
  bold?: boolean;
}

interface DrawOp {
  kind: "text" | "line";
  x: number;
  y: number;
  text?: string;
  size: number;
  font: "F1" | "F2";
  color: [number, number, number];
  x2?: number;
}

const PAGE_W = 595.28; // A4 dalam pt
const PAGE_H = 841.89;
const MARGIN = 48;

/** Escape karakter khusus string PDF. */
function esc(s: string): string {
  // Buang karakter di luar Latin-1 agar tidak merusak stream.
  const safe = s.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
  return safe.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Konversi teks UTF-8 umum (mis. tanda hubung, bintang) ke ASCII. */
function toAscii(s: string): string {
  return s
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00B7/g, "-")
    .replace(/[\u00A0\u202F]/g, " ");
}

/** Perkiraan lebar teks (Helvetica rata-rata ~0.5em per karakter). */
function textWidth(s: string, size: number): number {
  return s.length * size * 0.5;
}

export class PdfBuilder {
  private pages: DrawOp[][] = [[]];
  private cursorY = PAGE_H - MARGIN;

  /** Y kursor saat ini (dari atas halaman, dalam pt). */
  get y(): number {
    return PAGE_H - this.cursorY;
  }

  private ensureSpace(height: number): void {
    if (this.cursorY - height < MARGIN) {
      this.pages.push([]);
      this.cursorY = PAGE_H - MARGIN;
    }
  }

  /** Tulis satu baris teks; kursor turun sebesar lineHeight. */
  text(
    value: string,
    opts: PdfTextOptions & { lineHeight?: number; indent?: number } = {}
  ): this {
    const size = opts.size ?? 11;
    const lineHeight = opts.lineHeight ?? size + 6;
    this.ensureSpace(lineHeight);
    const raw = toAscii(value);
    const align = opts.align ?? "left";
    const indent = opts.indent ?? 0;
    const width = textWidth(raw, size);
    let x = MARGIN + indent;
    if (align === "right") x = PAGE_W - MARGIN - width;
    else if (align === "center") x = (PAGE_W - width) / 2;

    this.pages[this.pages.length - 1].push({
      kind: "text",
      x,
      y: this.cursorY,
      text: raw,
      size,
      font: opts.bold ? "F2" : "F1",
      color: opts.color ?? [0, 0, 0],
    });
    this.cursorY -= lineHeight;
    return this;
  }

  /** Garis horizontal tipis. */
  line(): this {
    this.ensureSpace(12);
    this.pages[this.pages.length - 1].push({
      kind: "line",
      x: MARGIN,
      y: this.cursorY,
      x2: PAGE_W - MARGIN,
      size: 0.5,
      font: "F1",
      color: [200, 200, 200],
    });
    this.cursorY -= 10;
    return this;
  }

  /** Beri jarak vertikal kosong. */
  space(height: number): this {
    this.ensureSpace(height);
    this.cursorY -= height;
    return this;
  }

  /** Tulis teks kiri & kanan pada satu baris (mis. "Total" ... "Rp 100.000"). */
  row(
    left: string,
    right: string,
    opts: PdfTextOptions = {}
  ): this {
    const size = opts.size ?? 11;
    const lineHeight = size + 6;
    this.ensureSpace(lineHeight);
    const l = toAscii(left);
    const r = toAscii(right);
    const page = this.pages[this.pages.length - 1];
    const font: "F1" | "F2" = opts.bold ? "F2" : "F1";
    const color = opts.color ?? [0, 0, 0];
    page.push({
      kind: "text",
      x: MARGIN,
      y: this.cursorY,
      text: l,
      size,
      font,
      color,
    });
    page.push({
      kind: "text",
      x: PAGE_W - MARGIN - textWidth(r, size),
      y: this.cursorY,
      text: r,
      size,
      font,
      color,
    });
    this.cursorY -= lineHeight;
    return this;
  }

  /** Bangun string PDF lengkap. */
  build(): string {
    const objects: string[] = [];
    const contentObjNums: number[] = [];
    const pageObjNums: number[] = [];

    // Nomor objek: 1 catalog, 2 pages, 3 font F1, 4 font F2,
    // lalu per halaman: content + page object.
    const firstContentNum = 5;

    this.pages.forEach((ops, i) => {
      contentObjNums.push(firstContentNum + i * 2);
      pageObjNums.push(firstContentNum + i * 2 + 1);
    });

    const kids = pageObjNums.map((n) => `${n} 0 R`).join(" ");

    objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[2] = `<< /Type /Pages /Kids [${kids}] /Count ${this.pages.length} >>`;
    objects[3] =
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
    objects[4] =
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

    this.pages.forEach((ops, i) => {
      const stream = this.renderStream(ops);
      objects[contentObjNums[i]] =
        `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`;
      objects[pageObjNums[i]] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjNums[i]} 0 R >>`;
    });

    // Serialisasi + tabel xref.
    let pdf = "%PDF-1.4\n";
    const offsets: number[] = [];
    for (let n = 1; n < objects.length; n++) {
      if (!objects[n]) continue;
      offsets[n] = Buffer.byteLength(pdf, "latin1");
      pdf += `${n} 0 obj\n${objects[n]}\nendobj\n`;
    }

    const xrefOffset = Buffer.byteLength(pdf, "latin1");
    const count = objects.length; // termasuk objek 0
    pdf += `xref\n0 ${count}\n`;
    pdf += "0000000000 65535 f \n";
    for (let n = 1; n < count; n++) {
      const off = offsets[n] ?? 0;
      pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return pdf;
  }

  private renderStream(ops: DrawOp[]): string {
    let s = "";
    for (const op of ops) {
      if (op.kind === "line") {
        const [r, g, b] = op.color;
        s += `${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} RG\n`;
        s += `${op.size} w\n`;
        s += `${op.x.toFixed(2)} ${op.y.toFixed(2)} m ${op.x2!.toFixed(2)} ${op.y.toFixed(2)} l S\n`;
      } else {
        const [r, g, b] = op.color;
        s += `BT\n`;
        s += `${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} rg\n`;
        s += `/${op.font} ${op.size} Tf\n`;
        s += `${op.x.toFixed(2)} ${op.y.toFixed(2)} Td\n`;
        s += `(${esc(op.text!)}) Tj\n`;
        s += `ET\n`;
      }
    }
    return s;
  }
}

export { PAGE_W, PAGE_H, MARGIN };
