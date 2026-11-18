import { describe, expect, it } from "vitest";
import { moveChunk } from "./move";

describe("moveChunk", () => {
  it("moves forward and backward", () => {
    expect(moveChunk([5, 6, 7, 8], 0, 2)).toEqual([6, 7, 5, 8]);
    expect(moveChunk([5, 6, 7, 8], 3, 1)).toEqual([5, 8, 6, 7]);
  });

  it("returns the original order when from equals to or an index is out of range", () => {
    const a = [1, 2, 3];
    expect(moveChunk(a, 1, 1)).toBe(a);
    expect(moveChunk(a, -1, 2)).toBe(a);
    expect(moveChunk(a, 0, 3)).toBe(a);
  });

  it("does not mutate its input", () => {
    const a = [1, 2, 3];
    moveChunk(a, 0, 2);
    expect(a).toEqual([1, 2, 3]);
  });
});
