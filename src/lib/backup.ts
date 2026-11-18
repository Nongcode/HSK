import type { Settings, Storage } from "@/lib/storage/types";

const DAY = 86_400_000;
const REMINDER_AFTER_DAYS = 7;

/** True after more than 7 days without a backup, or when progress exists but was never backed up. */
export function needsBackupReminder(s: Settings, now: number, hasProgress: boolean): boolean {
  if (s.lastBackupAt === null) return hasProgress;
  return now - s.lastBackupAt > REMINDER_AFTER_DAYS * DAY;
}

/** Downloads the backup as hsk4-backup-YYYY-MM-DD.json and records the backup time. */
export async function downloadBackup(storage: Storage): Promise<void> {
  const now = Date.now();
  await storage.putSettings({ lastBackupAt: now });
  const data = await storage.exportAll();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hsk4-backup-${new Date(now).toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Restores from the text of a backup file; throws a readable error and changes nothing when invalid. */
export async function importBackupText(storage: Storage, text: string): Promise<void> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("Tệp sao lưu không hợp lệ: không đọc được nội dung JSON.");
  }
  await storage.importAll(raw);
}
