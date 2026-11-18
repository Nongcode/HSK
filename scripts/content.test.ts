import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseVocab } from "../src/lib/content/schema";
import { parseRules, parseSentences } from "../src/lib/writing/schema";
import { validateWriting } from "./lib/validate-writing";

const read = (p: string) => JSON.parse(readFileSync(p, "utf8"));
const sentences = parseSentences(read("src/content/writing/sentences.json"));
const rules = parseRules(read("src/content/writing/rules.json"));
const words = parseVocab(read("src/content/vocab/hsk-words.json"));

describe("writing content", () => {
  it("passes content validation", () => {
    expect(validateWriting(sentences, rules, words)).toEqual([]);
  });

  it("has at least 50 sentences, 5 per rule, all unreviewed", () => {
    expect(sentences.length).toBeGreaterThanOrEqual(50);
    for (const r of rules) {
      expect(sentences.filter((s) => s.ruleId === r.id).length, r.id).toBeGreaterThanOrEqual(5);
    }
    expect(sentences.every((s) => s.reviewed === false)).toBe(true);
  });
});
