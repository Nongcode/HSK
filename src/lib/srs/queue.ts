import type { Word } from "@/lib/content/schema";
import type { ReviewLog, Storage } from "@/lib/storage/types";

export interface QueueOptions {
  hskVersion: "2.0" | "3.0";
  dailyNewLimit: number;
  sessionLimit: number;
  /** New cards already started today. */
  newToday: number;
}

/** Number of cards whose very first review happened on the same local day as `now`. */
export function countNewToday(reviews: ReviewLog[], now: number): number {
  const dayStart = new Date(now).setHours(0, 0, 0, 0);
  const first = new Map<string, number>();
  for (const r of reviews) first.set(r.cardId, Math.min(first.get(r.cardId) ?? Infinity, r.at));
  return [...first.values()].filter((at) => at >= dayStart).length;
}

/** Due cards first, then new words (lowest level first), within session and daily limits. */
export async function buildQueue(
  storage: Storage,
  words: Word[],
  now: number,
  opts: QueueOptions,
): Promise<Word[]> {
  const byId = new Map(words.map((w) => [w.id, w]));
  // "Due today" means due any time before local midnight, so evening reviews show up the next morning.
  const endOfDay = new Date(now).setHours(23, 59, 59, 999);
  const dueCards = await storage.listDue(endOfDay, Number.MAX_SAFE_INTEGER);
  const due = dueCards
    .map((c) => byId.get(c.id))
    .filter((w): w is Word => w !== undefined)
    .slice(0, opts.sessionLimit);

  const newSlots = Math.max(
    0,
    Math.min(opts.sessionLimit - due.length, opts.dailyNewLimit - opts.newToday),
  );
  const level = (w: Word) => (opts.hskVersion === "2.0" ? w.hsk2 : w.hsk3) ?? 99;
  const fresh: Word[] = [];
  for (const w of [...words].sort((a, b) => level(a) - level(b))) {
    if (fresh.length >= newSlots) break;
    if (!(await storage.getCard(w.id))) fresh.push(w);
  }
  return [...due, ...fresh];
}
