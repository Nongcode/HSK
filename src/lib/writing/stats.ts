import { ERROR_TAGS, type ErrorTag, type WritingAttempt } from "@/lib/storage/types";

export function mistakeStats(attempts: WritingAttempt[]): { tag: ErrorTag; count: number }[] {
  const counts = new Map<ErrorTag, number>();
  for (const a of attempts) {
    if (!a.ok && a.tag) counts.set(a.tag, (counts.get(a.tag) ?? 0) + 1);
  }
  return ERROR_TAGS.filter((t) => counts.has(t))
    .map((tag) => ({ tag, count: counts.get(tag)! }))
    .sort((x, y) => y.count - x.count);
}
