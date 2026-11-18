import type { Word }
 from "@/lib/content/schema";

export const ERROR_TAGS = [
  "adverbial-before-verb",
  "ba-position",
  "bei-position",
  "shi-de",
  "result-complement",
  "attributive-order",
  "time-place-order",
  "other",
] as const;
export type ErrorTag = (typeof ERROR_TAGS)[number];

export interface WritingAttempt {
  sentenceId: string;
  ok: boolean;
  tag: ErrorTag | null;
  at: number;
}

export type Grade = "again" | "hard" | "good" | "easy";

export interface CardState {
  id: string;
  ease: number;
  intervalDays: number;
  reps: number;
  lapses: number;
  /** Epoch ms when the card is next due. */
  due: number;
}

export interface ReviewLog {
  cardId: string;
  grade: Grade;
  at: number;
  prevIntervalDays: number;
  nextIntervalDays: number;
}

export interface Settings {
  hskVersion: "2.0" | "3.0";
  dailyNewLimit: number;
  sessionLimit: number;
  theme: "light" | "dark" | "system";
  fontScale: number;
  lastBackupAt: number | null;
  flaggedSentences: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  hskVersion: "2.0",
  dailyNewLimit: 20,
  sessionLimit: 30,
  theme: "system",
  fontScale: 1,
  lastBackupAt: null,
  flaggedSentences: [],
};

export interface BackupV1 {
  version: 1;
  exportedAt: number;
  cards: CardState[];
  reviews: ReviewLog[];
  settings: Settings;
  edits: Record<string, Partial<Word>>;
  attempts?: WritingAttempt[];
}

export interface Storage {
  getCard(id: string): Promise<CardState | undefined>;
  putCard(s: CardState): Promise<void>;
  /** Cards with due <= now, earliest first. */
  listDue(now: number, limit: number): Promise<CardState[]>;
  countDue(now: number): Promise<number>;
  addReview(r: ReviewLog): Promise<void>;
  listReviews(): Promise<ReviewLog[]>;
  addAttempt(a: WritingAttempt): Promise<void>;
  listAttempts(): Promise<WritingAttempt[]>;
  getSettings(): Promise<Settings>;
  putSettings(p: Partial<Settings>): Promise<void>;
  getEdit(id: string): Promise<Partial<Word> | undefined>;
  putEdit(id: string, patch: Partial<Word>): Promise<void>;
  exportAll(): Promise<BackupV1>;
  /** Validates first; throws and leaves existing data untouched when invalid. */
  importAll(raw: unknown): Promise<void>;
}
