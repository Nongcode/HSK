import { describe, expect, it } from "vitest";
import { parseRules, parseSentences } from "./schema";

const base = {
  id: "w1",
  chunks: ["我", "昨天", "去了", "商店"],
  accepted: [[0, 1, 2, 3]],
  pinyin: "wǒ zuótiān qùle shāngdiàn",
  meaningVi: "Hôm qua tôi đi cửa hàng.",
  pattern: "S + TW + V + O",
  ruleId: "time-place",
  mistakes: [{ order: [1, 0, 2, 3], tag: "time-place-order" }],
  difficulty: 1,
  reviewed: false,
};

describe("parseSentences", () => {
  it("accepts a valid sentence", () => {
    expect(parseSentences([base])).toHaveLength(1);
  });

  it("rejects an order that is not a permutation", () => {
    expect(() => parseSentences([{ ...base, mistakes: [{ order: [0, 0, 2, 3], tag: "other" }] }])).toThrow();
    expect(() => parseSentences([{ ...base, accepted: [[0, 1, 2, 3], [0, 1, 2]] }])).toThrow();
  });

  it("requires the canonical order among accepted", () => {
    expect(() => parseSentences([{ ...base, accepted: [[1, 0, 2, 3]] }])).toThrow();
  });

  it("rejects duplicate ids and out-of-range chunk counts", () => {
    expect(() => parseSentences([base, base])).toThrow();
    expect(() => parseSentences([{ ...base, chunks: ["我", "去"], accepted: [[0, 1]], mistakes: [] }])).toThrow();
  });
});

describe("parseRules", () => {
  it("accepts a valid rule", () => {
    const rule = {
      id: "ba",
      title: "把",
      summary: "s",
      explanation: "e",
      examples: [{ zh: "我把书放好了。", pinyin: "p", vi: "v" }],
      tag: "ba-position",
    };
    expect(parseRules([rule])).toHaveLength(1);
    expect(() => parseRules([{ ...rule, tag: "nope" }])).toThrow();
  });
});
