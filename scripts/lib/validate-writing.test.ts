import { describe, expect, it } from "vitest";
import type { Word } from "../../src/lib/content/schema";
import type { Rule, Sentence } from "../../src/lib/writing/schema";
import { validateWriting } from "./validate-writing";

const word = (hanzi: string, hsk2: number | null, hsk3: number | null): Word => ({
  id: hanzi, hanzi, pinyin: "x", pos: [], meaningVi: "m", meaningEn: ["m"], hsk2, hsk3, reviewed: false,
});
const words = [word("我", 1, 1), word("去", 1, 1), word("商店", 1, 2), word("龙", 6, 7)];

const rule: Rule = {
  id: "r", title: "t", summary: "s", explanation: "e", tag: "other",
  examples: [
    { zh: "我去。", pinyin: "p", vi: "v" },
    { zh: "我去商店。", pinyin: "p", vi: "v" },
  ],
};
const sentence = (id: string, chunks: string[], over: Partial<Sentence> = {}): Sentence => ({
  id, chunks, accepted: [chunks.map((_, i) => i)], pinyin: "", meaningVi: "m", pattern: "", ruleId: "r",
  mistakes: [], difficulty: 1, reviewed: false, ...over,
});

describe("validateWriting", () => {
  it("accepts valid data, including allowed punctuation", () => {
    expect(validateWriting([sentence("a", ["我", "去", "商店。"])], [rule], words)).toEqual([]);
  });

  it("flags an unknown ruleId", () => {
    const errs = validateWriting([sentence("a", ["我", "去", "商店"], { ruleId: "zz" })], [rule], words);
    expect(errs.join()).toMatch(/a.*zz/);
  });

  it("flags duplicate sentences", () => {
    const errs = validateWriting([sentence("a", ["我", "去", "商店"]), sentence("b", ["我", "去", "商店"])], [rule], words);
    expect(errs.join()).toMatch(/trùng/);
  });

  it("flags characters outside HSK1-4 and names the sentence and character", () => {
    const errs = validateWriting([sentence("a", ["我", "去", "龙"])], [rule], words);
    expect(errs.join()).toMatch(/a.*龙/);
  });

  it("flags a rule with fewer than two examples or out-of-scope example text", () => {
    expect(validateWriting([], [{ ...rule, examples: [rule.examples[0]] }], words).join()).toMatch(/ví dụ/);
    expect(validateWriting([], [{ ...rule, examples: [rule.examples[0], { zh: "龙", pinyin: "", vi: "" }] }], words).join()).toMatch(/龙/);
  });
});
