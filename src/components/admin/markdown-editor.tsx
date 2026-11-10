"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  height?: string;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inlineMd(text: string): string {
  let t = esc(text);
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  t = t.replace(/__(.+?)__/g, '<strong class="font-semibold">$1</strong>');
  t = t.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
  t = t.replace(/_(.+?)_/g, '<em class="italic">$1</em>');
  t = t.replace(/`([^`]+)`/g, '<code class="rounded bg-surface-container px-1 py-0.5 text-xs">$1</code>');
  return t;
}

function mdToHtml(md: string): string {
  if (!md) return "";
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(/^\s*[-*+]\s+(.*)$/);
    if (m) {
      out.push('<ul class="my-1 list-disc space-y-1 pl-6">');
      while (i < lines.length) {
        const mm = lines[i].match(/^\s*[-*+]\s+(.*)$/);
        if (!mm) break;
        out.push(`<li>${inlineMd(mm[1]) || "<br>"}</li>`);
        i++;
      }
      out.push("</ul>");
      continue;
    }
    const line = lines[i];
    if (line.trim() === "") out.push("<div><br></div>");
    else out.push(`<div>${inlineMd(line)}</div>`);
    i++;
  }
  return out.join("");
}

function nodeInline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  if (tag === "br") return "\n";
  const inner = Array.from(el.childNodes).map(nodeInline).join("");
  if (tag === "strong" || tag === "b") return `**${inner}**`;
  if (tag === "em" || tag === "i") return `*${inner}*`;
  if (tag === "code") return `\`${inner}\``;
  return inner;
}

function htmlToMd(root: HTMLElement): string {
  const lines: string[] = [];
  const pushBlock = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = (node.textContent || "").replace(/\u00a0/g, " ").trim();
      if (t) lines.push(t);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (tag === "ul" || tag === "ol") {
      Array.from(el.children).forEach((li) => {
        if (li.tagName.toLowerCase() !== "li") return;
        const t = nodeInline(li).replace(/\n/g, " ").replace(/\u00a0/g, " ").trim();
        lines.push(`- ${t}`);
      });
      return;
    }
    if (tag === "li") {
      const t = nodeInline(el).replace(/\n/g, " ").replace(/\u00a0/g, " ").trim();
      lines.push(`- ${t}`);
      return;
    }
    if (el.querySelector(":scope > ul, :scope > ol")) {
      Array.from(el.childNodes).forEach(pushBlock);
      return;
    }
    if (tag === "div" || tag === "p") {
      const t = nodeInline(el).replace(/\u00a0/g, " ").replace(/\n+$/g, "");
      lines.push(t.trim() === "" ? "" : t);
      return;
    }
    if (tag === "br") { lines.push(""); return; }
  };
  Array.from(root.childNodes).forEach(pushBlock);
  let out = lines.join("\n");
  out = out.replace(/\n{3,}/g, "\n\n").replace(/^\n+/, "").replace(/\n+$/, "");
  return out;
}

export function MarkdownEditor({
  value,
  onChange,
  label = "",
  placeholder = "Tulis di sini… (ketik - lalu spasi untuk bullet)",
  height = "min-h-[160px]",
}: MarkdownEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef<string>("__init__");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const v = value || "";
    if (v === last.current) return;
    el.innerHTML = mdToHtml(v);
    last.current = v;
  }, [value]);

  const emit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const md = htmlToMd(el);
    if (md === last.current) return;
    last.current = md;
    onChange(md);
  }, [onChange]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== " " && e.key !== "Spacebar") return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (!range.collapsed) return;
      const node = range.startContainer;
      if (node.nodeType !== Node.TEXT_NODE) return;
      const text = node.textContent || "";
      const off = range.startOffset;
      if (text.slice(0, off) !== "-") return;
      const elNode = node.parentElement as HTMLElement | null;
      if (elNode?.closest("li")) return;
      e.preventDefault();
      node.textContent = text.slice(off);
      const r = document.createRange();
      r.setStart(node, 0);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
      document.execCommand("insertUnorderedList");
      setTimeout(emit, 0);
    },
    [emit]
  );

  const showPlaceholder = !(value && value.trim().length > 0);

  return (
    <div className="space-y-1.5">
      {label ? <label className="block text-sm font-medium text-on-surface">{label}</label> : null}
      <div className={cn("relative rounded-lg border border-input bg-background", height)}>
        {showPlaceholder && (
          <span className="pointer-events-none absolute left-3 top-3 text-sm text-on-surface-variant/50">
            {placeholder}
          </span>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          onKeyDown={onKeyDown}
          className={cn(
            "h-full w-full overflow-y-auto px-3 py-3 text-sm leading-relaxed text-on-surface focus:outline-none",
            "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6 [&_li]:my-0.5",
            height
          )}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
