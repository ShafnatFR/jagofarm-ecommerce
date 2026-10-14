import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Larangan: orderBy Prisma harus berupa array objek terpisah.
 *
 *   BENAR  orderBy: [{ createdAt: "desc" }, { id: "asc" }]
 *   SALAH  orderBy: [{ createdAt: "desc", id: "asc" }]
 *   SALAH  orderBy = [[ createdAt: "desc", id: "asc" ]]
 *
 * Kenapa: Prisma menolak object berisi lebih dari satu kunci urutan (runtime
 * error -> 500), dan sintaks `[ [ k: v ]]` bukan ekspresi JS yang valid.
 * Terbukti saat /api/products balas 500 setelah tiebreaker ditambahkan.
 */

const API_DIR = join(process.cwd(), "src", "app", "api");

function tsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...tsFiles(full));
    else if (entry.endsWith(".ts")) out.push(full);
  }
  return out;
}

// Tangkap object dgn dua kunci urutan di dalam array orderBy.
const TWO_KEYS_IN_ONE_OBJECT = /orderBy\s*[:=]\s*\[\s*\{\s*\w+\s*:\s*["'][a-z]+["']\s*,\s*\w+\s*:/;
// Tangkap sintaks ganda tak valid.
const DOUBLE_BRACKET = /orderBy\s*[:=]\s*\[\s*\[/;

test("orderBy Prisma: tidak ada object multi-kunci (harus array objek terpisah)", () => {
  const offenders: string[] = [];
  for (const file of tsFiles(API_DIR)) {
    const src = readFileSync(file, "utf8");
    if (TWO_KEYS_IN_ONE_OBJECT.test(src) || DOUBLE_BRACKET.test(src)) {
      offenders.push(file);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `orderBy Prisma salah bentuk di:\n  ${offenders.join("\n  ")}\n` +
      `Harus [{ k1: "asc" }, { k2: "asc" }] — bukan [{ k1: "asc", k2: "asc" }].`
  );
});
