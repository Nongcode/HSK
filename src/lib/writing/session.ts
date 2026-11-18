import { newCard, schedule } from "@/lib/srs/sm2";
import type { ErrorTag, Storage, WritingAttempt } from "@/lib/storage/types";
import type { Sentence } from "./schema";

export const SESSION_SIZE = 10;

export const cardIdFor = (sentenceId: string) => "s:" + sentenceId;

function shuffled<T>(items: T[], rand: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Unseen sentences first (easy → hard), then recent mistakes, then whatever was practised longest ago. */
export function pickPractice(
  sentences: Sentence[],
  attempts: WritingAttempt[],
  limit = SESSION_SIZE,
  rand: () => number = Math.random,
): Sentence[] {
  const last = new Map<string, number>();
  const lastWrong = new Map<string, number>();
  for (const a of attempts) {
    last.set(a.sentenceId, Math.max(last.get(a.sentenceId) ?? 0, a.at));
    if (!a.ok) lastWrong.set(a.sentenceId, Math.max(lastWrong.get(a.sentenceId) ?? 0, a.at));
  }

  const picked: Sentence[] = [];
  const seen = new Set<string>();
  const take = (list: Sentence[]) => {
    for (const s of list) {
      if (picked.length >= limit) return;
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      picked.push(s);
    }
  };

  const unseen = sentences.filter((s) => !last.has(s.id));
  take(shuffled(unseen, rand).sort((a, b) => a.difficulty - b.difficulty));
  take(
    sentences
      .filter((s) => lastWrong.has(s.id))
      .sort((a, b) => lastWrong.get(b.id)! - lastWrong.get(a.id)!),
  );
  take([...sentences].sort((a, b) => (last.get(a.id) ?? 0) - (last.get(b.id) ?? 0)));
  return picked;
}

/** Sentences whose wrong-answer card is due today (until local midnight, like the vocabulary queue). */
export async function buildWrongQueue(
  storage: Storage,
  sentences: Sentence[],
  now: number,
  limit = SESSION_SIZE,
): Promise<Sentence[]> {
  const byCard = new Map(sentences.map((s) => [cardIdFor(s.id), s]));
  const endOfDay = new Date(now).setHours(23, 59, 59, 999);
  const due = await storage.listDue(endOfDay, Number.MAX_SAFE_INTEGER);
  return due
    .map((c) => byCard.get(c.id))
    .filter((s): s is Sentence => s !== undefined)
    .slice(0, limit);
}

export async function recordAttempt(
  storage: Storage,
  s: Sentence,
  result: { ok: true } | { ok: false; tag: ErrorTag },
  now: number,
): Promise<void> {
  await storage.addAttempt({
    sentenceId: s.id,
    ok: result.ok,
    tag: result.ok ? null : result.tag,
    at: now,
  });
  const id = cardIdFor(s.id);
  const card = await storage.getCard(id);
  if (!result.ok) {
    await storage.putCard(schedule(card ?? newCard(id, now), "again", now));
  } else if (card) {
    await storage.putCard(schedule(card, "good", now));
  }
}
