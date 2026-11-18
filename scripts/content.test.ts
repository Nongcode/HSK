import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseVocab } from "../src/lib/content/schema";
import { parseRules, parseSentences } from "../src/lib/writing/schema";
import { gradeOrder } from "../src/lib/writing/grade";
import { validateWriting } from "./lib/validate-writing";

const read = (p: string) => JSON.parse(readFileSync(p, "utf8"));
const sentences = parseSentences(read("src/content/writing/sentences.json"));
const rules = parseRules(read("src/content/writing/rules.json"));
const words = parseVocab(read("src/content/vocab/hsk-words.json"));

describe("writing content", () => {
  it("passes content validation", () => {
    expect(validateWriting(sentences, rules, words)).toEqual([]);
  });

  it("has at least 250 sentences, 20 per rule, all unreviewed", () => {
    expect(sentences.length).toBeGreaterThanOrEqual(250);
    for (const r of rules) {
      expect(sentences.filter((s) => s.ruleId === r.id).length, r.id).toBeGreaterThanOrEqual(20);
    }
    expect(sentences.every((s) => s.reviewed === false)).toBe(true);
  });
});

describe("natural word orders", () => {
  const cases: [string, number[]][] = [
    ["w001", [3, 0, 1, 2]], ["w003", [3, 0, 1, 2]], ["w030", [3, 0, 1, 2]], ["w079", [2, 0, 1]],
    ["w081", [2, 0, 1]], ["w084", [3, 0, 1, 2]], ["w038", [1, 2, 3, 0]], ["w034", [1, 0, 2, 3]],
    ["w040", [1, 0, 2, 3]], ["w041", [0, 2, 1, 3]], ["w042", [0, 2, 1, 3]],
  ];
  it.each(cases)("%s accepts the fronted/reordered variant", (id, order) => {
    const s = sentences.find((x) => x.id === id)!;
    expect(gradeOrder(s, order).ok).toBe(true);
  });

  it("records a source for every sentence added after the first 100", () => {
    const added = sentences.filter((s) => Number(s.id.slice(1)) > 100);
    expect(added.length).toBeGreaterThan(0);
    for (const s of added) expect(s.source, s.id).toMatch(/^(original|tatoeba:\d+)$/);
  });
});
