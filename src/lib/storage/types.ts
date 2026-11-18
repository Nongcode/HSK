import type { Word } from "@/lib/content/schema";

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
}

export const DEFAULT_SETTINGS: Settings = {
  hskVersion: "2.0",
  dailyNewLimit: 20,
  sessionLimit: 30,
  theme: "system",
  fontScale: 1,
  lastBackupAt: null,
};

export interface BackupV1 {
  version: 1;
  exportedAt: number;
  cards: CardState[];
  reviews: ReviewLog[];
  settings: Settings;
  edits: Record<string, Partial<Word>>;
}

export interface Storage {
  getCard(id: string): Promise<CardState | undefined>;
  putCard(s: CardState): Promise<void>;
  /** Cards with due <= now, earliest first. */
  listDue(now: number, limit: number): Promise<CardState[]>;
  countDue(now: number): Promise<number>;
  addReview(r: ReviewLog): Promise<void>;
  listReviews(): Promise<ReviewLog[]>;
  getSettings(): Promise<Settings>;
  putSettings(p: Partial<Settings>): Promise<void>;
  getEdit(id: string): Promise<Partial<Word> | undefined>;
  putEdit(id: string, patch: Partial<Word>): Promise<void>;
  exportAll(): Promise<BackupV1>;
  /** Validates first; throws and leaves existing data untouched when invalid. */
  importAll(raw: unknown): Promise<void>;
}
