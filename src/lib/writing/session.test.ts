import { describe, expect, it } from "vitest";
import type { Word } from "@/lib/content/schema";
import { buildQueue } from "@/lib/srs/queue";
import { newCard } from "@/lib/srs/sm2";
import { MemoryStorage } from "@/lib/storage/memory-storage";
import type { WritingAttempt } from "@/lib/storage/types";
import type { Sentence } from "./schema";
import { buildWrongQueue, cardIdFor, pickPractice, recordAttempt, SESSION_SIZE } from "./session";

const NOW = new Date(2026, 10, 18, 10, 0, 0).getTime();
const MIN = 60_000;

const mk = (id: string, difficulty: 1 | 2 | 3 = 1): Sentence => ({
  id, chunks: ["a", "b", "c"], accepted: [[0, 1, 2]], pinyin: "", meaningVi: "", pattern: "",
  ruleId: "r", mistakes: [], difficulty, reviewed: false,
});
const att = (sentenceId: string, ok: boolean, at: number): WritingAttempt => ({
  sentenceId, ok, tag: ok ? null : "other", at,
});
const first = () => 0;

describe("pickPractice", () => {
  it("prefers unattempted sentences, lowest difficulty first", () => {
    const ss = [mk("d3", 3), mk("d1", 1), mk("done", 1), mk("d2", 2)];
    const out = pickPractice(ss, [att("done", true, 1)], 3, first);
    expect(out.map((s) => s.id)).toEqual(["d1", "d2", "d3"]);
  });

  it("fills up with recently wrong sentences, newest mistake first, without duplicates", () => {
    const ss = [mk("new"), mk("w1"), mk("w2"), mk("ok")];
    const attempts = [att("w1", false, 10), att("w2", false, 20), att("ok", true, 30)];
    const out = pickPractice(ss, attempts, 3, first);
    expect(out.map((s) => s.id)).toEqual(["new", "w2", "w1"]);
  });

  it("falls back to the least recently practised sentences when nothing else is left", () => {
    const ss = [mk("a"), mk("b")];
    const out = pickPractice(ss, [att("a", true, 20), att("b", true, 10)], 5, first);
    expect(out.map((s) => s.id)).toEqual(["b", "a"]);
  });

  it("respects the limit, defaults to SESSION_SIZE and handles an empty list", () => {
    const ss = Array.from({ length: 30 }, (_, i) => mk(`s${i}`));
    expect(pickPractice(ss, [])).toHaveLength(SESSION_SIZE);
    expect(pickPractice(ss, [], 4)).toHaveLength(4);
    expect(pickPractice([], [])).toEqual([]);
  });
});

describe("recordAttempt + buildWrongQueue", () => {
  it("wrong answer stores an attempt and an 'again' card due in 10 minutes", async () => {
    const st = new MemoryStorage();
    await recordAttempt(st, mk("x"), { ok: false, tag: "ba-position" }, NOW);
    expect(await st.listAttempts()).toEqual([{ sentenceId: "x", ok: false, tag: "ba-position", at: NOW }]);
    const card = await st.getCard(cardIdFor("x"));
    expect(card?.lapses).toBe(1);
    expect(card?.due).toBe(NOW + 10 * MIN);
  });

  it("correct answer with an existing card schedules it as 'good'", async () => {
    const st = new MemoryStorage();
    await st.putCard(newCard(cardIdFor("x"), NOW));
    await recordAttempt(st, mk("x"), { ok: true }, NOW);
    const card = await st.getCard(cardIdFor("x"));
    expect(card?.reps).toBe(1);
    expect(card?.intervalDays).toBe(1);
    expect((await st.listAttempts())[0]).toMatchObject({ ok: true, tag: null });
  });

  it("correct answer without a card does not create one", async () => {
    const st = new MemoryStorage();
    await recordAttempt(st, mk("x"), { ok: true }, NOW);
    expect(await st.getCard(cardIdFor("x"))).toBeUndefined();
    expect(await st.listAttempts()).toHaveLength(1);
  });

  it("buildWrongQueue returns only due sentence cards and ignores unknown ids", async () => {
    const st = new MemoryStorage();
    const ss = [mk("due"), mk("later"), mk("none")];
    await st.putCard({ ...newCard(cardIdFor("due"), NOW), due: NOW - MIN });
    await st.putCard({ ...newCard(cardIdFor("later"), NOW), due: NOW + 3 * 86_400_000 });
    await st.putCard({ ...newCard(cardIdFor("gone"), NOW), due: NOW - MIN });
    await st.putCard({ ...newCard("vocab-1", NOW), due: NOW - MIN });
    const out = await buildWrongQueue(st, ss, NOW);
    expect(out.map((s) => s.id)).toEqual(["due"]);
  });

  it("includes cards due later today, like the vocabulary queue", async () => {
    const st = new MemoryStorage();
    await st.putCard({ ...newCard(cardIdFor("a"), NOW), due: new Date(2026, 10, 18, 23, 0).getTime() });
    expect((await buildWrongQueue(st, [mk("a")], NOW)).map((s) => s.id)).toEqual(["a"]);
  });

  it("sentence cards never leak into the vocabulary queue", async () => {
    const st = new MemoryStorage();
    const words = [{ id: "v1", hsk2: 1, hsk3: 1 }] as unknown as Word[];
    const opts = { hskVersion: "2.0" as const, dailyNewLimit: 20, sessionLimit: 30, newToday: 0 };
    const before = await buildQueue(st, words, NOW, opts);
    await recordAttempt(st, mk("x"), { ok: false, tag: "other" }, NOW);
    await st.putCard({ ...newCard(cardIdFor("x"), NOW), due: NOW - MIN });
    expect(await buildQueue(st, words, NOW, opts)).toEqual(before);
  });
});
