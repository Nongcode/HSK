import { describe, expect, it } from "vitest";
import { isCandidate, parseSentenceTsv, pairIds, segment, suggestRule } from "./tatoeba";

const allowed = new Set([..."我今天在家把书放桌上被他拿走了是昨买的苹果去学校吃饭好"]);

describe("parseSentenceTsv", () => {
  it("maps id to text and ignores blank lines", () => {
    const m = parseSentenceTsv("1\tcmn\t我去。\n\n2\tcmn\t他好。\n");
    expect([...m]).toEqual([[1, "我去。"], [2, "他好。"]]);
  });
});

describe("pairIds", () => {
  it("keeps only cmn→vie links, once per pair", () => {
    const links = "1\t10\n10\t1\n1\t99\n2\t10\n";
    expect(pairIds(links, new Set([1, 2]), new Set([10]))).toEqual([[1, 10], [2, 10]]);
  });
});

describe("isCandidate", () => {
  it("accepts a simplified in-scope sentence of enough length", () => {
    expect(isCandidate("今天我在家吃饭。", allowed)).toBe(true);
  });
  it("rejects out-of-scope characters", () => {
    expect(isCandidate("今天我在家吃龙。", allowed)).toBe(false);
  });
  it("rejects too short, Latin, digits and missing end punctuation", () => {
    expect(isCandidate("我去。", allowed)).toBe(false);
    expect(isCandidate("今天我在家吃饭ok。", allowed)).toBe(false);
    expect(isCandidate("今天我在家吃饭", allowed)).toBe(false);
  });
});

describe("suggestRule", () => {
  it.each([
    ["我把书放在桌上。", "ba"],
    ["他的书被人拿走了。", "bei"],
    ["我是昨天买的苹果。", "shi-de"],
  ])("%s → %s", (zh, rule) => {
    expect(suggestRule(zh)).toBe(rule);
  });
  it("returns null when no keyword matches", () => {
    expect(suggestRule("我去学校吃饭。")).toBeNull();
  });
});

describe("segment", () => {
  it("cuts by longest vocabulary match, single chars as fallback", () => {
    expect(segment("我去学校。", ["学校", "去", "我"])).toEqual(["我", "去", "学校", "。"]);
  });
});
