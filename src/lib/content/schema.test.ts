import { describe, expect, it } from "vitest";
import { parseVocab } from "./schema";

const valid = {
  id: "你好",
  hanzi: "你好",
  pinyin: "nǐ hǎo",
  pos: ["interj"],
  meaningVi: "xin chào",
  meaningEn: ["hello"],
  hsk2: 1,
  hsk3: 1,
  reviewed: false,
};

describe("parseVocab", () => {
  it("accepts a valid word", () => {
    expect(parseVocab([valid])).toHaveLength(1);
  });

  it("throws when hanzi is missing", () => {
    const { hanzi: _hanzi, ...bad } = valid;
    expect(() => parseVocab([bad])).toThrow();
  });

  it("throws when both hsk2 and hsk3 are null", () => {
    expect(() => parseVocab([{ ...valid, hsk2: null, hsk3: null }])).toThrow();
  });

  it("accepts empty meaningVi when meaningEn is non-empty", () => {
    expect(parseVocab([{ ...valid, meaningVi: "" }])[0].meaningVi).toBe("");
  });

  it("throws when both meaningVi and meaningEn are empty", () => {
    expect(() => parseVocab([{ ...valid, meaningVi: "", meaningEn: [] }])).toThrow();
  });
});
