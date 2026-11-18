import { describe, expect, it } from "vitest";
import type { Word } from "@/lib/content/schema";
import { searchWords } from "./search";

const w = (hanzi: string, pinyin: string, vi: string, en: string[]): Word => ({
  id: hanzi, hanzi, pinyin, pos: [], meaningVi: vi, meaningEn: en, hsk2: 1, hsk3: 1, reviewed: false,
});
const words = [w("你好", "nǐ hǎo", "xin chào", ["hello"]), w("谢谢", "xièxie", "cảm ơn", ["to thank"])];

describe("searchWords", () => {
  it("matches hanzi", () => expect(searchWords(words, "你").map((x) => x.id)).toEqual(["你好"]));
  it("matches pinyin without tone marks or spaces", () => {
    expect(searchWords(words, "ni hao").map((x) => x.id)).toEqual(["你好"]);
    expect(searchWords(words, "xiexie").map((x) => x.id)).toEqual(["谢谢"]);
  });
  it("matches Vietnamese with or without diacritics", () => {
    expect(searchWords(words, "cam on").map((x) => x.id)).toEqual(["谢谢"]);
    expect(searchWords(words, "chào").map((x) => x.id)).toEqual(["你好"]);
  });
  it("matches English and returns everything for an empty query", () => {
    expect(searchWords(words, "thank").map((x) => x.id)).toEqual(["谢谢"]);
    expect(searchWords(words, "  ")).toHaveLength(2);
  });
});
