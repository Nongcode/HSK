import type { Word } from "@/lib/content/schema";

/** Lowercases and strips tone marks / diacritics, spaces and punctuation. */
function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLowerCase();
}

export function searchWords(words: Word[], query: string): Word[] {
  const q = query.trim();
  if (!q) return words;
  const folded = fold(q);
  return words.filter(
    (w) =>
      w.hanzi.includes(q) ||
      (folded !== "" &&
        (fold(w.pinyin).includes(folded) ||
          fold(w.meaningVi).includes(folded) ||
          w.meaningEn.some((m) => fold(m).includes(folded)))),
  );
}
