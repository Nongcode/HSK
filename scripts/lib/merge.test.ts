import { describe, expect, it } from "vitest";
import { inScope, mergeWord, type BaseHskEntry } from "./merge";

const base: BaseHskEntry = {
  s: "好",
  l: ["t1", "n1", "o2"],
  p: ["a", "v"],
  f: [
    { i: { y: "hǎo", n: "hao3" }, m: ["good", "all right!"] },
    { i: { y: "hào", n: "hao4" }, m: ["to be fond of"] },
  ],
};

describe("mergeWord", () => {
  it("keeps hsk2 and hsk3 levels from the source", () => {
    const w = mergeWord(base);
    expect(w.hsk2).toBe(2);
    expect(w.hsk3).toBe(1);
  });

  it("marks the word as not reviewed and joins polyphone pinyin", () => {
    const w = mergeWord(base);
    expect(w.reviewed).toBe(false);
    expect(w.pinyin).toBe("hǎo / hào");
  });

  it("leaves meaningVi empty and falls back to English when no Vietnamese is given", () => {
    const w = mergeWord(base);
    expect(w.meaningVi).toBe("");
    expect(w.meaningEn).toEqual(["good", "all right!", "to be fond of"]);
  });

  it("uses the Vietnamese meaning and Han Viet reading when provided", () => {
    const w = mergeWord(base, "tốt", "hảo");
    expect(w.meaningVi).toBe("tốt");
    expect(w.hanViet).toBe("hảo");
  });

  it("nulls a level outside HSK 1-4 for that version", () => {
    const w = mergeWord({ ...base, l: ["n3", "o6"] });
    expect(w.hsk2).toBeNull();
    expect(w.hsk3).toBe(3);
  });

  it("takes the lowest level when a word has several old levels", () => {
    expect(mergeWord({ ...base, l: ["o4", "o2"] }).hsk2).toBe(2);
  });
});

describe("inScope", () => {
  it("is true for words in old or new levels 1-4", () => {
    expect(inScope({ ...base, l: ["o4"] })).toBe(true);
    expect(inScope({ ...base, l: ["n4"] })).toBe(true);
  });

  it("is false for words only in higher levels", () => {
    expect(inScope({ ...base, l: ["o5", "n7"] })).toBe(false);
  });
});
