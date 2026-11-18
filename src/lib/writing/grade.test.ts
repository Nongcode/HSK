import { describe, expect, it } from "vitest";
import { gradeOrder } from "./grade";
import type { Sentence } from "./schema";

const s: Sentence = {
  id: "w1",
  chunks: ["我", "昨天", "去了", "商店"],
  accepted: [[0, 1, 2, 3], [1, 0, 2, 3]],
  pinyin: "",
  meaningVi: "",
  pattern: "",
  ruleId: "time-place",
  mistakes: [{ order: [0, 2, 1, 3], tag: "adverbial-before-verb" }],
  difficulty: 1,
  reviewed: false,
};

describe("gradeOrder", () => {
  it("accepts the canonical and other accepted orders", () => {
    expect(gradeOrder(s, [0, 1, 2, 3])).toEqual({ ok: true });
    expect(gradeOrder(s, [1, 0, 2, 3])).toEqual({ ok: true });
  });

  it("returns the matching mistake tag and the correct sentence", () => {
    expect(gradeOrder(s, [0, 2, 1, 3])).toEqual({ ok: false, tag: "adverbial-before-verb", correct: "我昨天去了商店" });
  });

  it("falls back to the rule tag for unknown mistakes", () => {
    expect(gradeOrder(s, [3, 2, 1, 0], "time-place-order")).toMatchObject({ ok: false, tag: "time-place-order" });
    expect(gradeOrder(s, [3, 2, 1, 0])).toMatchObject({ ok: false, tag: "other" });
  });

  it("compares by text so swapping identical chunks is still correct", () => {
    const dup: Sentence = { ...s, chunks: ["很", "高兴", "很"], accepted: [[0, 1, 2]], mistakes: [] };
    expect(gradeOrder(dup, [2, 1, 0])).toEqual({ ok: true });
  });
});
