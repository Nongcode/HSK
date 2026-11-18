import { describe, expect, it } from "vitest";
import type { ReviewLog } from "@/lib/storage/types";
import { streakDays } from "./stats";

const DAY = 86_400_000;
const NOW = new Date("2026-11-18T15:00:00").getTime();
const log = (at: number): ReviewLog => ({
  cardId: "a",
  grade: "good",
  at,
  prevIntervalDays: 0,
  nextIntervalDays: 1,
});

describe("streakDays", () => {
  it("is 0 with no reviews", () => {
    expect(streakDays([], NOW)).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    expect(streakDays([log(NOW), log(NOW - DAY), log(NOW - 2 * DAY)], NOW)).toBe(3);
  });

  it("keeps the streak when today has no review yet but yesterday does", () => {
    expect(streakDays([log(NOW - DAY), log(NOW - 2 * DAY)], NOW)).toBe(2);
  });

  it("breaks on a missed day and ignores several reviews on one day", () => {
    expect(streakDays([log(NOW), log(NOW - 1000), log(NOW - 3 * DAY)], NOW)).toBe(1);
  });

  it("is 0 when the last review was two or more days ago", () => {
    expect(streakDays([log(NOW - 2 * DAY)], NOW)).toBe(0);
  });
});
