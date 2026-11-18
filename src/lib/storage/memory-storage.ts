import type { Word } from "@/lib/content/schema";
import { parseBackup } from "./backup-schema";
import {
  DEFAULT_SETTINGS,
  type BackupV1,
  type CardState,
  type ReviewLog,
  type WritingAttempt,
  type Settings,
  type Storage,
} from "./types";

export class MemoryStorage implements Storage {
  private cards = new Map<string, CardState>();
  private reviews: ReviewLog[] = [];
  private attempts: WritingAttempt[] = [];
  private settings: Settings = { ...DEFAULT_SETTINGS };
  private edits = new Map<string, Partial<Word>>();

  async getCard(id: string) {
    return this.cards.get(id);
  }
  async putCard(s: CardState) {
    this.cards.set(s.id, s);
  }
  async listDue(now: number, limit: number) {
    return [...this.cards.values()]
      .filter((c) => c.due <= now)
      .sort((a, b) => a.due - b.due)
      .slice(0, limit);
  }
  async countDue(now: number) {
    return [...this.cards.values()].filter((c) => c.due <= now).length;
  }
  async addReview(r: ReviewLog) {
    this.reviews.push(r);
  }
  async listReviews() {
    return [...this.reviews];
  }
  async addAttempt(a: WritingAttempt) {
    this.attempts.push(a);
  }
  async listAttempts() {
    return [...this.attempts];
  }
  async getSettings() {
    return { ...this.settings };
  }
  async putSettings(p: Partial<Settings>) {
    this.settings = { ...this.settings, ...p };
  }
  async getEdit(id: string) {
    return this.edits.get(id);
  }
  async putEdit(id: string, patch: Partial<Word>) {
    this.edits.set(id, patch);
  }
  async exportAll(): Promise<BackupV1> {
    return {
      version: 1,
      exportedAt: Date.now(),
      cards: [...this.cards.values()],
      reviews: [...this.reviews],
      settings: { ...this.settings },
      edits: Object.fromEntries(this.edits),
      attempts: [...this.attempts],
    };
  }
  async importAll(raw: unknown) {
    const b = parseBackup(raw);
    this.cards = new Map(b.cards.map((c) => [c.id, c]));
    this.reviews = [...b.reviews];
    this.attempts = [...b.attempts];
    this.settings = { ...b.settings };
    this.edits = new Map(Object.entries(b.edits));
  }
}
