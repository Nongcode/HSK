import { describe, expect, it } from "vitest";
import type { Word } from "@/lib/content/schema";
import { MemoryStorage } from "@/lib/storage/memory-storage";
import type { CardState, ReviewLog } from "@/lib/storage/types";
import { buildQueue, countNewToday } from "./queue";

const NOW = new Date("2026-11-18T10:00:00").getTime();
const w = (id: string, hsk2: number): Word => ({
  id, hanzi: id, pinyin: id, pos: [], meaningVi: "m", meaningEn: ["m"], hsk2, hsk3: null, reviewed: false,
});
const card = (id: string, due: number): CardState => ({ id, ease: 2.5, intervalDays: 1, reps: 1, lapses: 0, due });
const opts = { hskVersion: "2.0" as const, dailyNewLimit: 20, sessionLimit: 30, newToday: 0 };

describe("buildQueue", () => {
  it("puts due cards before new cards", async () => {
    const s = new MemoryStorage();
    await s.putCard(card("c", NOW - 1000));
    const q = await buildQueue(s, [w("a", 1), w("b", 1), w("c", 1)], NOW, opts);
    expect(q.map((x) => x.id)).toEqual(["c", "a", "b"]);
  });

  it("orders new cards by level, lowest first", async () => {
    const q = await buildQueue(new MemoryStorage(), [w("hard", 4), w("easy", 1)], NOW, opts);
    expect(q.map((x) => x.id)).toEqual(["easy", "hard"]);
  });

  it("never exceeds the session limit", async () => {
    const words = Array.from({ length: 10 }, (_, i) => w(`n${i}`, 1));
    const q = await buildQueue(new MemoryStorage(), words, NOW, { ...opts, sessionLimit: 4 });
    expect(q).toHaveLength(4);
  });

  it("never exceeds what is left of today's new-card allowance", async () => {
    const words = Array.from({ length: 10 }, (_, i) => w(`n${i}`, 1));
    const q = await buildQueue(new MemoryStorage(), words, NOW, { ...opts, dailyNewLimit: 5, newToday: 3 });
    expect(q).toHaveLength(2);
  });

  it("skips due cards that are not in the selected HSK version", async () => {
    const s = new MemoryStorage();
    await s.putCard(card("other", NOW - 1));
    const q = await buildQueue(s, [w("a", 1)], NOW, opts);
    expect(q.map((x) => x.id)).toEqual(["a"]);
  });

  it("includes cards due later today, not only those already due this minute", async () => {
    const morning = new Date(2026, 10, 18, 8, 0).getTime();
    const evening = new Date(2026, 10, 18, 21, 0).getTime();
    const tomorrow = new Date(2026, 10, 19, 0, 30).getTime();
    const s = new MemoryStorage();
    await s.putCard({ id: "late", ease: 2.5, intervalDays: 1, reps: 1, lapses: 0, due: evening });
    await s.putCard({ id: "next", ease: 2.5, intervalDays: 1, reps: 1, lapses: 0, due: tomorrow });
    const list = [w("late", 1), w("next", 1)];
    const q = await buildQueue(s, list, morning, { hskVersion: "2.0", dailyNewLimit: 0, sessionLimit: 10, newToday: 0 });
    expect(q.map((x) => x.id)).toEqual(["late"]);
  });

  it("returns an empty queue when there is nothing to study", async () => {
    expect(await buildQueue(new MemoryStorage(), [], NOW, opts)).toEqual([]);
  });
});

describe("countNewToday", () => {
  const log = (cardId: string, at: number): ReviewLog => ({ cardId, grade: "good", at, prevIntervalDays: 0, nextIntervalDays: 1 });
  it("counts cards whose first review happened today", () => {
    const yesterday = NOW - 24 * 3_600_000;
    const reviews = [log("a", yesterday), log("a", NOW - 1000), log("b", NOW - 2000)];
    expect(countNewToday(reviews, NOW)).toBe(1);
  });
});
