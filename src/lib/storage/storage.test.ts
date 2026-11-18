/* eslint-disable @typescript-eslint/no-explicit-any -- hostile-input fixtures */
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { describe, expect, it } from "vitest";
import { DexieStorage } from "./dexie-storage";
import { MemoryStorage } from "./memory-storage";
import { DEFAULT_SETTINGS, type CardState, type Storage } from "./types";

let n = 0;
const impls: [string, () => Storage][] = [
  ["MemoryStorage", () => new MemoryStorage()],
  ["DexieStorage", () => new DexieStorage(`test-db-${n++}`)],
];

const card = (id: string, due: number): CardState => ({
  id,
  ease: 2.5,
  intervalDays: 1,
  reps: 1,
  lapses: 0,
  due,
});

describe.each(impls)("%s", (_name, make) => {
  it("stores and returns a card", async () => {
    const s = make();
    await s.putCard(card("a", 100));
    expect(await s.getCard("a")).toEqual(card("a", 100));
    expect(await s.getCard("missing")).toBeUndefined();
  });

  it("listDue returns only due cards, earliest first, honouring limit", async () => {
    const s = make();
    await s.putCard(card("late", 300));
    await s.putCard(card("b", 200));
    await s.putCard(card("a", 100));
    await s.putCard(card("future", 9999));
    expect((await s.listDue(500, 10)).map((c) => c.id)).toEqual(["a", "b", "late"]);
    expect((await s.listDue(500, 2)).map((c) => c.id)).toEqual(["a", "b"]);
    expect(await s.countDue(500)).toBe(3);
  });

  it("listDue accepts a very large limit (IndexedDB caps counts at 2^32 - 1)", async () => {
    const s = make();
    await s.putCard(card("a", 100));
    expect(await s.listDue(500, Number.MAX_SAFE_INTEGER)).toHaveLength(1);
  });

  it("returns default settings on first read and merges patches", async () => {
    const s = make();
    expect(await s.getSettings()).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS).toMatchObject({ hskVersion: "2.0", dailyNewLimit: 20, sessionLimit: 30 });
    await s.putSettings({ hskVersion: "3.0" });
    expect(await s.getSettings()).toEqual({ ...DEFAULT_SETTINGS, hskVersion: "3.0" });
  });

  it("round-trips through exportAll and importAll", async () => {
    const a = make();
    await a.putCard(card("a", 100));
    await a.addReview({ cardId: "a", grade: "good", at: 5, prevIntervalDays: 0, nextIntervalDays: 1 });
    await a.putSettings({ theme: "dark" });
    await a.putEdit("a", { meaningVi: "sửa" });
    const backup = await a.exportAll();

    const b = make();
    await b.importAll(backup);
    const copy = await b.exportAll();
    expect({ ...copy, exportedAt: 0 }).toEqual({ ...backup, exportedAt: 0 });
    expect(await b.getEdit("a")).toEqual({ meaningVi: "sửa" });
  });

  it("rejects an unknown backup version without touching existing data", async () => {
    const s = make();
    await s.putCard(card("keep", 100));
    await expect(s.importAll({ version: 99 })).rejects.toThrow();
    await expect(s.importAll("not json")).rejects.toThrow();
    expect(await s.getCard("keep")).toEqual(card("keep", 100));
  });
});

describe.each(impls)("%s backup validation rejects values that would break the app", (_name, make) => {
  const valid = async () => ({ ...(await make().exportAll()) });
  it.each([
    ["fontScale 0", (b: Record<string, any>) => (b.settings.fontScale = 0)],
    ["sessionLimit 0", (b: Record<string, any>) => (b.settings.sessionLimit = 0)],
    ["negative ease", (b: Record<string, any>) => b.cards.push({ id: "x", ease: -1, intervalDays: 1, reps: 1, lapses: 0, due: 1 })],
    ["null meaningEn edit", (b: Record<string, any>) => (b.edits = { a: { meaningEn: null } })],
    ["numeric hanzi edit", (b: Record<string, any>) => (b.edits = { a: { hanzi: 5 } })],
  ])("%s", async (_n, mutate) => {
    const s = make();
    await s.putCard(card("keep", 100));
    const b: Record<string, any> = await valid();
    mutate(b);
    await expect(s.importAll(b)).rejects.toThrow();
    expect(await s.getCard("keep")).toEqual(card("keep", 100));
  });
});

describe.each(impls)("%s writing attempts", (_name, make) => {
  const at = (id: string, ok: boolean, t: number) => ({
    sentenceId: id,
    ok,
    tag: ok ? null : ("ba-position" as const),
    at: t,
  });

  it("stores attempts in insertion order", async () => {
    const s = make();
    await s.addAttempt(at("a", false, 1));
    await s.addAttempt(at("b", true, 2));
    expect((await s.listAttempts()).map((x) => x.sentenceId)).toEqual(["a", "b"]);
  });

  it("stores flagged sentences in settings and exports them", async () => {
    const s = make();
    await s.putSettings({ flaggedSentences: ["a"] });
    expect((await s.exportAll()).settings.flaggedSentences).toEqual(["a"]);
  });

  it("round-trips attempts through export and import", async () => {
    const a = make();
    await a.addAttempt(at("a", false, 1));
    const b = make();
    await b.importAll(await a.exportAll());
    expect(await b.listAttempts()).toEqual([at("a", false, 1)]);
  });

  it("restores an old backup that has no attempts or flaggedSentences", async () => {
    const s = make();
    await s.addAttempt(at("x", true, 1));
    const old: Record<string, any> = await make().exportAll();
    delete old.attempts;
    delete old.settings.flaggedSentences;
    await s.importAll(old);
    expect(await s.listAttempts()).toEqual([]);
    expect((await s.getSettings()).flaggedSentences).toEqual([]);
  });

  it.each([
    [{ sentenceId: 5, ok: true, tag: null, at: 1 }],
    [{ sentenceId: "a", ok: false, tag: "bad", at: 1 }],
  ])("rejects malformed attempts and keeps existing data", async (bad) => {
    const s = make();
    await s.addAttempt(at("keep", true, 1));
    const b: Record<string, any> = await make().exportAll();
    b.attempts = [bad];
    await expect(s.importAll(b)).rejects.toThrow();
    expect((await s.listAttempts()).map((x) => x.sentenceId)).toEqual(["keep"]);
  });
});

describe("DexieStorage upgrade from version 1", () => {
  it("keeps phase 1 data when opening with the version 2 schema", async () => {
    const name = `upgrade-db-${n++}`;
    const old = new Dexie(name);
    old.version(1).stores({ cards: "id, due", reviews: "++seq, cardId, at", settings: "key", edits: "id" });
    await old.open();
    await old.table("cards").put(card("kept", 5));
    await old.table("reviews").add({ cardId: "kept", grade: "good", at: 1, prevIntervalDays: 0, nextIntervalDays: 1 });
    old.close();

    const s = new DexieStorage(name);
    await s.open();
    expect(await s.getCard("kept")).toEqual(card("kept", 5));
    expect(await s.listReviews()).toHaveLength(1);
    expect(await s.listAttempts()).toEqual([]);
  });
});
