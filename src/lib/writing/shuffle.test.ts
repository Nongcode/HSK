import { describe, expect, it } from "vitest";
import { gradeOrder } from "./grade";
import type { Sentence } from "./schema";
import { shuffleOrder } from "./shuffle";

const mk = (chunks: string[], accepted: number[][]): Sentence => ({
  id: "w", chunks, accepted, pinyin: "", meaningVi: "", pattern: "", ruleId: "r", mistakes: [], difficulty: 1, reviewed: false,
});

function seeded(seed: number) {
  let x = seed;
  return () => ((x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

describe("shuffleOrder", () => {
  it("always returns a permutation that is not an accepted answer", () => {
    const s = mk(["a", "b", "c", "d"], [[0, 1, 2, 3], [1, 0, 2, 3]]);
    for (let seed = 1; seed <= 40; seed++) {
      const order = shuffleOrder(s, seeded(seed));
      expect([...order].sort()).toEqual([0, 1, 2, 3]);
      expect(gradeOrder(s, order).ok).toBe(false);
    }
  });

  it("terminates when every permutation is accepted", () => {
    const s = mk(["a", "a", "a"], [[0, 1, 2]]);
    expect(shuffleOrder(s, seeded(3))).toHaveLength(3);
  });
});
