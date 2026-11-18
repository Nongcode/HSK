import type { Word } from "@/lib/content/schema";

export type HskVersion = "2.0" | "3.0";

/** Words of the chosen HSK version, optionally only those of one level. */
export function wordsFor(all: Word[], version: HskVersion, level?: number): Word[] {
  const key = version === "2.0" ? "hsk2" : "hsk3";
  return all.filter((w) => (level === undefined ? w[key] !== null : w[key] === level));
}

/** Overlays a user edit on a word; the id can never change. */
export function applyEdit(word: Word, edit?: Partial<Word>): Word {
  return edit ? { ...word, ...edit, id: word.id } : word;
}
