import type { ErrorTag } from "@/lib/storage/types";
import type { Sentence } from "./schema";

const text = (s: Sentence, order: number[]) => order.map((i) => s.chunks[i]).join("");

export type GradeResult = { ok: true } | { ok: false; tag: ErrorTag; correct: string };

/** Compares by joined text, so swapping two identical chunks is still correct. */
export function gradeOrder(s: Sentence, order: number[], ruleTag: ErrorTag = "other"): GradeResult {
  const answer = text(s, order);
  if (s.accepted.some((o) => text(s, o) === answer)) return { ok: true };
  const known = s.mistakes.find((m) => text(s, m.order) === answer);
  return { ok: false, tag: known?.tag ?? ruleTag, correct: text(s, s.accepted[0]) };
}
