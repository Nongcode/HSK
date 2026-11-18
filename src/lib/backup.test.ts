import { describe, expect, it } from "vitest";
import { importBackupText, needsBackupReminder } from "./backup";
import { MemoryStorage } from "./storage/memory-storage";
import { DEFAULT_SETTINGS } from "./storage/types";

const DAY = 86_400_000;
const NOW = new Date("2026-11-18T12:00:00").getTime();

describe("needsBackupReminder", () => {
  it("is true after 8 days and false after 3 days", () => {
    expect(needsBackupReminder({ ...DEFAULT_SETTINGS, lastBackupAt: NOW - 8 * DAY }, NOW, true)).toBe(true);
    expect(needsBackupReminder({ ...DEFAULT_SETTINGS, lastBackupAt: NOW - 3 * DAY }, NOW, true)).toBe(false);
  });

  it("is true when never backed up but progress exists, false without progress", () => {
    expect(needsBackupReminder(DEFAULT_SETTINGS, NOW, true)).toBe(true);
    expect(needsBackupReminder(DEFAULT_SETTINGS, NOW, false)).toBe(false);
  });
});

describe("importBackupText", () => {
  it("rejects a malformed file with a readable message and keeps existing data", async () => {
    const storage = new MemoryStorage();
    await storage.putSettings({ dailyNewLimit: 7 });
    await expect(importBackupText(storage, "{không phải json")).rejects.toThrow(/không hợp lệ/);
    await expect(importBackupText(storage, JSON.stringify({ version: 2 }))).rejects.toThrow(/không hợp lệ/);
    expect((await storage.getSettings()).dailyNewLimit).toBe(7);
  });

  it("restores data from a valid backup", async () => {
    const source = new MemoryStorage();
    await source.putSettings({ dailyNewLimit: 5 });
    const target = new MemoryStorage();
    await importBackupText(target, JSON.stringify(await source.exportAll()));
    expect((await target.getSettings()).dailyNewLimit).toBe(5);
  });
});
