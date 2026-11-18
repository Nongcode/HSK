import { describe, expect, it } from "vitest";
import type { Word } from "@/lib/content/schema";
import { applyEdit, wordsFor } from "./index";

const w = (id: string, hsk2: number | null, hsk3: number | null): Word => ({
  id, hanzi: id, pinyin: id, pos: [], meaningVi: "nghĩa", meaningEn: ["m"], hsk2, hsk3, reviewed: false,
});
const all = [w("a", 1, 1), w("b", null, 3), w("c", 4, null), w("d", 3, 4)];

describe("wordsFor", () => {
  it("drops words outside the selected HSK version", () => {
    expect(wordsFor(all, "2.0").map((x) => x.id)).toEqual(["a", "c", "d"]);
    expect(wordsFor(all, "3.0").map((x) => x.id)).toEqual(["a", "b", "d"]);
  });

  it("filters to a single level when given", () => {
    expect(wordsFor(all, "3.0", 4).map((x) => x.id)).toEqual(["d"]);
    expect(wordsFor(all, "2.0", 4).map((x) => x.id)).toEqual(["c"]);
  });
});

describe("applyEdit", () => {
  it("overrides fields but keeps the id", () => {
    const edited = applyEdit(all[0], { id: "hacked", meaningVi: "sửa" });
    expect(edited.meaningVi).toBe("sửa");
    expect(edited.id).toBe("a");
  });

  it("returns the word unchanged without an edit", () => {
    expect(applyEdit(all[0])).toBe(all[0]);
  });
});
