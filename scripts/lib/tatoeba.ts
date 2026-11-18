import { outOfScope } from "./validate-writing";

const MIN_HAN = 6;
const MAX_HAN = 16;
const END = /[。？！]$/;

export function parseSentenceTsv(text: string): Map<number, string> {
  const map = new Map<number, string>();
  for (const line of text.split("\n")) {
    const [id, , sentence] = line.split("\t");
    if (id && sentence) map.set(Number(id), sentence.trim());
  }
  return map;
}

/** Link lines are `from\tto`; keep cmn→vie pairs, sorted by the Chinese id. */
export function pairIds(links: string, cmn: Set<number>, vie: Set<number>): [number, number][] {
  const pairs = new Map<string, [number, number]>();
  for (const line of links.split("\n")) {
    const [a, b] = line.split("\t").map(Number);
    if (cmn.has(a) && vie.has(b)) pairs.set(`${a}-${b}`, [a, b]);
  }
  return [...pairs.values()].sort((x, y) => x[0] - y[0]);
}

export function isCandidate(zh: string, allowed: Set<string>): boolean {
  if (!END.test(zh) || /[A-Za-z0-9]/.test(zh)) return false;
  const han = [...zh].filter((ch) => /\p{Script=Han}/u.test(ch)).length;
  if (han < MIN_HAN || han > MAX_HAN) return false;
  return outOfScope(zh, allowed).length === 0;
}

/** Keyword guess only; the agent review decides the real rule. */
export function suggestRule(zh: string): string | null {
  if (zh.includes("把")) return "ba";
  if (zh.includes("被")) return "bei";
  if (/是.+的/.test(zh)) return "shi-de";
  return null;
}

/** Longest-match segmentation over `words`; unknown characters stay single. */
export function segment(zh: string, words: string[]): string[] {
  const vocab = new Set(words);
  const maxLen = Math.max(1, ...words.map((w) => w.length));
  const chars = [...zh];
  const out: string[] = [];
  for (let i = 0; i < chars.length; ) {
    let len = Math.min(maxLen, chars.length - i);
    while (len > 1 && !vocab.has(chars.slice(i, i + len).join(""))) len--;
    out.push(chars.slice(i, i + len).join(""));
    i += len;
  }
  return out;
}
