import { DexieStorage } from "./dexie-storage";
import { MemoryStorage } from "./memory-storage";
import type { Storage } from "./types";

export * from "./types";
export { DexieStorage } from "./dexie-storage";
export { MemoryStorage } from "./memory-storage";

/**
 * IndexedDB-backed storage, or an in-memory fallback flagged `isEphemeral`
 * when IndexedDB cannot be opened (e.g. private browsing).
 */
export async function getStorage(): Promise<{ storage: Storage; isEphemeral: boolean }> {
  try {
    const storage = new DexieStorage();
    await storage.open();
    return { storage, isEphemeral: false };
  } catch {
    return { storage: new MemoryStorage(), isEphemeral: true };
  }
}
