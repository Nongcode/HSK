import { describe, expect, it } from "vitest";
import { getStorage } from "./index";

describe("getStorage", () => {
  it("falls back to an in-memory store flagged ephemeral when IndexedDB is unavailable", async () => {
    expect(typeof indexedDB).toBe("undefined");
    const { storage, isEphemeral } = await getStorage();
    expect(isEphemeral).toBe(true);
    await storage.putSettings({ theme: "dark" });
    expect((await storage.getSettings()).theme).toBe("dark");
  });
});
