import { z } from "zod";
import { WordShape } from "@/lib/content/schema";
import { ERROR_TAGS, type BackupV1, type WritingAttempt } from "./types";

const grade = z.enum(["again", "hard", "good", "easy"]);

const BackupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.number(),
  cards: z.array(
    z.object({
      id: z.string(),
      ease: z.number().min(1.3).max(10),
      intervalDays: z.number().min(0),
      reps: z.number().int().min(0),
      lapses: z.number().int().min(0),
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
    dailyNewLimit: z.number().int().min(0).max(1000),
    sessionLimit: z.number().int().min(1).max(1000),
    theme: z.enum(["light", "dark", "system"]),
    fontScale: z.number().min(0.5).max(2),
    lastBackupAt: z.number().nullable(),
    flaggedSentences: z.array(z.string()).default([]),
  }),
  edits: z.record(z.string(), WordShape.partial().omit({ id: true })),
  attempts: z
    .array(
      z.object({
        sentenceId: z.string().min(1),
        ok: z.boolean(),
        tag: z.enum(ERROR_TAGS).nullable(),
        at: z.number(),
      }),
    )
    .default([]),
});

/** Throws a readable error when `raw` is not a valid version-1 backup. */
export function parseBackup(raw: unknown): BackupV1 & { attempts: WritingAttempt[] } {
  const parsed = BackupSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Tệp sao lưu không hợp lệ hoặc không đúng phiên bản.");
  }
  return parsed.data as BackupV1 & { attempts: WritingAttempt[] };
}
