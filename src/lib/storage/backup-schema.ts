import { z } from "zod";
import type { BackupV1 } from "./types";

const grade = z.enum(["again", "hard", "good", "easy"]);

const BackupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.number(),
  cards: z.array(
    z.object({
      id: z.string(),
      ease: z.number(),
      intervalDays: z.number(),
      reps: z.number(),
      lapses: z.number(),
      due: z.number(),
    }),
  ),
  reviews: z.array(
    z.object({
      cardId: z.string(),
      grade,
      at: z.number(),
      prevIntervalDays: z.number(),
      nextIntervalDays: z.number(),
    }),
  ),
  settings: z.object({
    hskVersion: z.enum(["2.0", "3.0"]),
    dailyNewLimit: z.number(),
    sessionLimit: z.number(),
    theme: z.enum(["light", "dark", "system"]),
    fontScale: z.number(),
    lastBackupAt: z.number().nullable(),
  }),
  edits: z.record(z.string(), z.record(z.string(), z.unknown())),
});

/** Throws a readable error when `raw` is not a valid version-1 backup. */
export function parseBackup(raw: unknown): BackupV1 {
  const parsed = BackupSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Tệp sao lưu không hợp lệ hoặc không đúng phiên bản.");
  }
  return parsed.data as BackupV1;
}
