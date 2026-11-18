import type { Word } from "../../src/lib/content/schema";
import type { Rule, Sentence } from "../../src/lib/writing/schema";

const PUNCTUATION = "，。？！、";
const HAN = /\p{Script=Han}/u;
const MAX_LEVEL = 4;

/** Characters that appear in any HSK 1-4 word of either version. */
function allowedChars(words: Word[]): Set<string> {
  const set = new Set<string>();
  for (const w of words) {
    if ((w.hsk2 !== null && w.hsk2 <= MAX_LEVEL) || (w.hsk3 !== null && w.hsk3 <= MAX_LEVEL)) {
      for (const ch of w.hanzi) set.add(ch);
    }
  }
  return set;
}

function outOfScope(text: string, allowed: Set<string>): string[] {
  return [...new Set([...text].filter((ch) => !PUNCTUATION.includes(ch) && HAN.test(ch) && !allowed.has(ch)))];
}

/** Returns a list of human-readable problems; empty means the content is valid. */
export function validateWriting(sentences: Sentence[], rules: Rule[], words: Word[]): string[] {
  const errors: string[] = [];
  const allowed = allowedChars(words);
  const ruleIds = new Set(rules.map((r) => r.id));
  const seen = new Map<string, string>();

  for (const s of sentences) {
    if (!ruleIds.has(s.ruleId)) errors.push(`${s.id}: ruleId "${s.ruleId}" không tồn tại`);
    const text = s.chunks.join("");
    const first = seen.get(text);
    if (first) errors.push(`${s.id}: câu trùng với ${first}`);
    else seen.set(text, s.id);
    const bad = outOfScope(text, allowed);
    if (bad.length) errors.push(`${s.id}: chữ ngoài HSK1–4: ${bad.join("")}`);
  }

  for (const r of rules) {
    if (r.examples.length < 2) errors.push(`rule ${r.id}: cần ít nhất 2 ví dụ`);
    const bad = outOfScope(r.examples.map((e) => e.zh).join(""), allowed);
    if (bad.length) errors.push(`rule ${r.id}: chữ ngoài HSK1–4 trong ví dụ: ${bad.join("")}`);
  }
  return errors;
}
