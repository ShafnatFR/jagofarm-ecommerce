"use client";

/**
 * Editor Markdown gaya GitHub untuk Deskripsi Singkat & Lengkap.
 *
 * Tanpa dependensi baru: renderer ditulis sendiri untuk cakupan GitHub
 * Flavored Markdown yang dipakai toko (heading, tebal/miring, daftar, tautan,
 * kode, blok kutip, tabel, daftar tugas, garis pemisah).
 *
 * Props:
 * - value / onChange : state markdown
 * - label            : judul field
 * - placeholder      : teks petunjuk
 * - height           : tinggi textarea (default min-h-[160px])
 */
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  height?: string;
}

/* ────────── Renderer Markdown (ringan, tanpa paket eksternal) ────────── */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* Blok kode fenced ``` ... ``` ditarang pertama biar tidak terpecah oleh regex baris. */
function renderMarkdown(md: string): string {
  if (!md) return '<p class="text-on-surface-variant/60 italic">Kosong — tulis Markdown di kiri.</p>';

  let html = md;

  /* 1. Blok kode fenced */
  html = html.replace(
    /```([\s\S]*?)```/g,
    (_match: string, lang: string) => {
      // Ambil bahasa dari baris pertama dalam blok
      const firstLine = lang.match(/^(\w+)/)?.[1] ?? "";
      const body = lang.replace(/^\w+\s*/, "");
      return `<div class="bg-[#0d2118] text-[#d4d4d4] text-sm rounded-lg p-3 overflow-x-auto my-4 border border-[#33413a]"><pre><code>${
        firstLine ? `<span class="text-[#8a6a1f]">// ${firstLine}</span>\n` : ""
      }${escapeHtml(body)}</code></pre></div>`;
    }
  );

  /* 2. Tabel */
  html = html.replace(
    /^\s*\|(.+)\|\s*\n(\s*\|[\s\-:]+\|\s*\n)((?:\s*\|.*\|\s*\n?)+)/gm,
    (_match: string, headerRow: string, separatorRow: string, bodyRows: string) => {
      const headers = headerRow
        .split("|")
        .map((h) => h.trim())
        .filter(Boolean);
      const rows = bodyRows
        .trim()
        .split("\n")
        .map((row) => row.split("|").map((c) => c.trim()).filter(Boolean));
      const thead = headers.map((h) => `<th>${inline(h)}</th>`).join("");
      const tbody = rows
        .map(
          (row) => `<tr>${row.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`
        )
        .join("");
      return `<div class="overflow-x-auto my-4"><table class="w-full text-sm border-collapse border border-[#33413a] rounded-lg"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table></div>`;
    }
  );

  /* 3. Horizontal rule */
  html = html.replace(/^(---|\*\*\*|___)\s*$/gm, '<hr class="my-6 border-[#33413a]">');

  /* 4. Blockquote */
  html = html.replace(
    /^(> .*(\n> .*)*)/gm,
    (match) => {
      const lines = match.split("\n").map((l) => l.replace(/^>\s?/, ""));
      return `<blockquote class="border-l-4 border-[#8a6a1f] bg-[#33413a]/30 pl-3 py-1 my-4 italic text-on-surface-variant">${lines.join("<br>")}</blockquote>`;
    }
  );

  /* 5. Heading */
  html = html.replace(/^(#{1,6})\s+(.+)$/gm, (_match: string, hashes: string, text: string) => {
    const level = hashes.length;
    return `<h${level} class="my-3 text-on-surface font-semibold">${inline(text)}</h${level}>`;
  });

  /* 6. Daftar tugas (- [ ] / - [x]) */
  html = html.replace(
    /^[\s]*[-*+]\s+\[([ xX])\]\s+(.+)$/gm,
    (_match: string, checked: string, text: string) => {
      const cb = checked.toLowerCase() === "x" ? "checked" : "";
      return `<li class="my-1 flex items-start gap-2"><input type="checkbox" class="mt-0.5 accent-primary" disabled ${cb} /> ${inline(
        text
      )}</li>`;
    }
  );

  /* 7. Daftar berurutan / biasa */
  html = html.replace(
    /^([\s]*)([*\-+])\s+(.+)$/gm,
    (_match: string, indent: string, bullet: string, text: string) => `<li class="my-1">${inline(text)}</li>`
  );
  html = html.replace(
    /^([\s]*)(\d+)\.\s+(.+)$/gm,
    (_match: string, indent: string, num: string, text: string) => `<li class="my-1">${inline(text)}</li>`
  );
  /* Bungkus runtunan <li> ke dalam <ul>/<ol> sederhana */
  html = html.replace(
    /(<li class="my-1">[\s\S]*?<\/li>(?:\n<li class="my-1">[\s\S]*?<\/li>)*)/g,
    (match: string) => `<ul class="list-disc pl-5 my-3 space-y-1 text-on-surface">${match}</ul>`
  );

  /* 8. Tautan & gambar (harus sebelum inline teks agar tidak double-escape) */
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" class="my-3 rounded-lg border border-[#33413a] max-w-[400px]"/>'
  );
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline underline-offset-2 hover:text-primary/80" target="_blank" rel="noopener">$1</a>');

  /* 9. Kode inline */
  html = html.replace(/`([^`]+)`/g, '<code class="bg-[#33413a] text-[#d4d4d4] px-1 py-0.5 rounded text-xs">$1</code>');

  /* 10. Tebal & miring & coret */
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong class="font-bold">$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
  html = html.replace(/_(.+?)_/g, '<em class="italic">$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<span class="line-through">$1</span>');

  /* 11. Baris kosong -> paragraf, sisa -> <br> */
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map((p) => {
      p = p.trim();
      if (!p) return "";
      if (p.startsWith("<")) return p; // sudah elemen HTML
      return `<p class="my-2 text-on-surface leading-relaxed">${inline(p)}</p>`;
    })
    .join("");

  return html;
}

/* Inline-level: hanya baris yang belum dibungkus elemen blok. Dipakai untuk isi cell tabel, heading, dll. */
function inline(text: string): string {
  let t = escapeHtml(text);
  t = t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="inline-block rounded border border-[#33413a] max-h-[40px]"/>');
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline underline-offset-2 hover:text-primary/80">$1</a>');
  t = t.replace(/`([^`]+)`/g, '<code class="bg-[#33413a] text-[#d4d4d4] px-1 py-0.5 rounded text-xs">$1</code>');
  t = t.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');
  t = t.replace(/__(.+?)__/g, '<strong class="font-bold">$1</strong>');
  t = t.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
  t = t.replace(/_(.+?)_/g, '<em class="italic">$1</em>');
  t = t.replace(/~~(.+?)~~/g, '<span class="line-through">$1</span>');
  return t.replace(/\n/g, "<br>");
}

/* ────────── Komponen ────────── */

export function MarkdownEditor({
  value,
  onChange,
  label = "Deskripsi",
  placeholder = "Tulis Markdown…",
  height = "min-h-[160px]",
}: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(true);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div className="space-y-2">
      {label && (
        <label className="mb-1 block text-sm font-medium text-on-surface">{label}</label>
      )}
      <div className="flex flex-col lg:flex-row gap-3 border border-input rounded-lg bg-background">
        {/* Kolom kiri: textarea */}
        <div className="flex-1 min-w-0 flex flex-col">
          <textarea
            className={cn(
              "flex-1 min-h-[160px] w-full rounded-none border-r-0 border-input bg-transparent px-3 py-3 text-sm text-on-surface focus-visible:outline-none focus-visible:ring-0 resize-y",
              height
            )}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            spellCheck={false}
          />
          <div className="flex justify-between border-t border-input px-3 py-1 text-[10px] text-on-surface-variant/60">
            <span>Markdown (GitHub style)</span>
            <button
              type="button"
              onClick={() => setShowPreview((p) => !p)}
              className="flex items-center gap-1 cursor-pointer hover:text-primary"
            >
              {showPreview ? "Sembunyikan pratinjau" : "Tampilkan pratinjau"}
            </button>
          </div>
        </div>

        {/* Kolom kanan: pratinjau */}
        {showPreview && (
          <div className="w-full lg:w-2/5 overflow-y-auto rounded-lg border border-input bg-[#0a0a0a]/20 p-4 text-sm text-on-surface leading-relaxed max-h-[400px]">
            <div
              className="prose prose-sm invert prose-headings:text-on-surface prose-a:text-primary prose-code:bg-[#33413a] prose-code:text-[#d4d4d4] prose-pre:bg-[#0d2118] prose-pre:p-3 prose-pre:rounded-lg prose-img:rounded-lg prose-img:border prose-img:border-[#33413a] prose-blockquote:border-l-[#8a6a1f] prose-blockquote:bg-[#33413a]/30 prose-blockquote:pl-3 prose-table:border-[#33413a] prose-th:bg-[#33413a]/30 prose-td:border-[#33413a]"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
