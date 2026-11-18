import { describe, expect, it } from "vitest";
import type { CardState } from "@/lib/storage/types";
import { newCard, schedule } from "./sm2";

const DAY = 86_400_000;
const NOW = 1_000_000_000_000;

describe("newCard", () => {
  it("starts with ease 2.5, no reps and due immediately", () => {
    expect(newCard("a", NOW)).toEqual({
      id: "a", ease: 2.5, intervalDays: 0, reps: 0, lapses: 0, due: NOW,
    });
  });
});

describe("schedule", () => {
  it("good: 1 day, then 6 days, then interval * ease", () => {
    const first = schedule(newCard("a", NOW), "good", NOW);
    expect(first.intervalDays).toBe(1);
    expect(first.due).toBe(NOW + DAY);
    const second = schedule(first, "good", NOW);
    expect(second.intervalDays).toBe(6);
    const third = schedule(second, "good", NOW);
    expect(third.intervalDays).toBe(Math.round(6 * 2.5));
    expect(third.reps).toBe(3);
  });

  it("again: resets reps, counts a lapse, lowers ease (floor 1.3), due in 10 minutes", () => {
    const learned: CardState = { id: "a", ease: 2.5, intervalDays: 6, reps: 2, lapses: 0, due: NOW };
    const lapsed = schedule(learned, "again", NOW);
    expect(lapsed).toMatchObject({ reps: 0, lapses: 1, intervalDays: 0 });
    expect(lapsed.ease).toBeCloseTo(2.3);
    expect(lapsed.due).toBe(NOW + 10 * 60_000);
    const floor = schedule({ ...learned, ease: 1.35 }, "again", NOW);
    expect(floor.ease).toBe(1.3);
  });

  it("hard: interval * 1.2 (at least 1 day) and ease -0.15", () => {
    const card: CardState = { id: "a", ease: 2.5, intervalDays: 10, reps: 3, lapses: 0, due: NOW };
    const hard = schedule(card, "hard", NOW);
    expect(hard.intervalDays).toBe(12);
    expect(hard.ease).toBeCloseTo(2.35);
    expect(schedule(newCard("b", NOW), "hard", NOW).intervalDays).toBe(1);
  });

  it("easy: interval * ease * 1.3 and ease +0.15", () => {
    const card: CardState = { id: "a", ease: 2.5, intervalDays: 6, reps: 2, lapses: 0, due: NOW };
    const easy = schedule(card, "easy", NOW);
    expect(easy.intervalDays).toBe(Math.round(6 * 2.5 * 1.3));
    expect(easy.ease).toBeCloseTo(2.65);
    expect(schedule(newCard("b", NOW), "easy", NOW).intervalDays).toBe(4);
  });

  it("does not mutate the input state", () => {
    const card = newCard("a", NOW);
    const copy = { ...card };
    schedule(card, "good", NOW);
    expect(card).toEqual(copy);
  });
});
