import { describe, expect, it } from "vitest";

describe("test environment", () => {
  it("runs in jsdom with jest-dom matchers", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    expect(el).toBeInTheDocument();
  });
});
