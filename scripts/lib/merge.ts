import type { Word } from "../../src/lib/content/schema";

/** One word in complete-hsk-vocabulary's minified format (complete.min.json). */
export interface BaseHskEntry {
  s: string;
  l: string[];
  p: string[];
  f: { i: { y: string; n: string }; m: string[] }[];
}

const MAX_LEVEL = 4;

function lowestLevel(levels: string[], prefix: "o" | "n"): number | null {
  const found = levels
    .filter((l) => l.startsWith(prefix))
    .map((l) => Number(l.slice(1)))
    .filter((n) => n >= 1 && n <= MAX_LEVEL);
  return found.length ? Math.min(...found) : null;
}

export function inScope(base: BaseHskEntry): boolean {
  return lowestLevel(base.l, "o") !== null || lowestLevel(base.l, "n") !== null;
}

export function mergeWord(
  base: BaseHskEntry,
  vi?: string,
  hanViet?: string,
  en?: string[],
): Word {
  const pinyin = [...new Set(base.f.map((f) => f.i.y))].join(" / ");
  const meaningEn = en ?? [...new Set(base.f.flatMap((f) => f.m))];
  return {
    id: base.s,
    hanzi: base.s,
    pinyin,
    pos: base.p,
    meaningVi: vi ?? "",
    meaningEn,
    ...(hanViet ? { hanViet } : {}),
    hsk2: lowestLevel(base.l, "o"),
    hsk3: lowestLevel(base.l, "n"),
    reviewed: false,
  };
}
