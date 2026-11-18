import { describe, expect, it } from "vitest";
import type { WritingAttempt } from "@/lib/storage/types";
import { mistakeStats } from "./stats";

const a = (ok: boolean, tag: WritingAttempt["tag"]): WritingAttempt => ({ sentenceId: "x", ok, tag, at: 1 });

describe("mistakeStats", () => {
  it("counts failed attempts per tag, most frequent first, ties in ERROR_TAGS order", () => {
    const stats = mistakeStats([
      a(false, "ba-position"),
      a(false, "adverbial-before-verb"),
      a(false, "ba-position"),
      a(true, null),
      a(false, "shi-de"),
    ]);
    expect(stats).toEqual([
      { tag: "ba-position", count: 2 },
      { tag: "adverbial-before-verb", count: 1 },
      { tag: "shi-de", count: 1 },
    ]);
  });

  it("is empty with no failures", () => {
    expect(mistakeStats([a(true, null)])).toEqual([]);
  });
});
