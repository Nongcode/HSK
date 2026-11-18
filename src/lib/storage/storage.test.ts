import "fake-indexeddb/auto";
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
