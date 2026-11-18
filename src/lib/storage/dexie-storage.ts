import Dexie, { type EntityTable } from "dexie";
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

const MAX_IDB_COUNT = 0xffffffff;

type EditRow = { id: string; patch: Partial<Word> };
type SettingsRow = { key: "main"; value: Settings };
type ReviewRow = ReviewLog & { seq?: number };
type AttemptRow = WritingAttempt & { seq?: number };

class HskDb extends Dexie {
  cards!: EntityTable<CardState, "id">;
  reviews!: EntityTable<ReviewRow, "seq">;
  settings!: EntityTable<SettingsRow, "key">;
  edits!: EntityTable<EditRow, "id">;
  attempts!: EntityTable<AttemptRow, "seq">;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      cards: "id, due",
      reviews: "++seq, cardId, at",
      settings: "key",
      edits: "id",
    });
    this.version(2).stores({ attempts: "++seq, sentenceId, at" });
  }
}

export class DexieStorage implements Storage {
  private db: HskDb;

  constructor(name = "hsk4-study") {
    this.db = new HskDb(name);
  }

  /** Opens the database; rejects when IndexedDB is unavailable. */
  open() {
    return this.db.open();
  }

  getCard(id: string) {
    return this.db.cards.get(id);
  }
  async putCard(s: CardState) {
    await this.db.cards.put(s);
  }
  listDue(now: number, limit: number) {
    // IndexedDB rejects counts above 2^32 - 1, so callers may pass "no limit" as a huge number.
    return this.db.cards
      .where("due")
      .belowOrEqual(now)
      .limit(Math.min(limit, MAX_IDB_COUNT))
      .toArray();
  }
  countDue(now: number) {
    return this.db.cards.where("due").belowOrEqual(now).count();
  }
  async addReview(r: ReviewLog) {
    await this.db.reviews.add({ ...r });
  }
  async listReviews() {
    const rows = await this.db.reviews.orderBy("seq").toArray();
    return rows.map(({ seq: _seq, ...r }) => r);
  }
  async addAttempt(a: WritingAttempt) {
    await this.db.attempts.add({ ...a });
  }
  async listAttempts() {
    const rows = await this.db.attempts.orderBy("seq").toArray();
    return rows.map(({ seq: _seq, ...a }) => a);
  }
  async getSettings(): Promise<Settings> {
    const row = await this.db.settings.get("main");
    return { ...DEFAULT_SETTINGS, ...row?.value };
  }
  async putSettings(p: Partial<Settings>) {
    const current = await this.getSettings();
    await this.db.settings.put({ key: "main", value: { ...current, ...p } });
  }
  async getEdit(id: string) {
    return (await this.db.edits.get(id))?.patch;
  }
  async putEdit(id: string, patch: Partial<Word>) {
    await this.db.edits.put({ id, patch });
  }
  async exportAll(): Promise<BackupV1> {
    return {
      version: 1,
      exportedAt: Date.now(),
      cards: await this.db.cards.toArray(),
      reviews: await this.listReviews(),
      settings: await this.getSettings(),
      edits: Object.fromEntries((await this.db.edits.toArray()).map((e) => [e.id, e.patch])),
      attempts: await this.listAttempts(),
    };
  }
  async importAll(raw: unknown) {
    const b = parseBackup(raw);
    const { cards, reviews, settings, edits, attempts } = this.db;
    await this.db.transaction("rw", [cards, reviews, settings, edits, attempts], async () => {
      await Promise.all([cards.clear(), reviews.clear(), settings.clear(), edits.clear(), attempts.clear()]);
      await cards.bulkPut(b.cards);
      await reviews.bulkAdd(b.reviews.map((r) => ({ ...r })));
      await attempts.bulkAdd(b.attempts.map((a) => ({ ...a })));
      await settings.put({ key: "main", value: b.settings });
      await edits.bulkPut(Object.entries(b.edits).map(([id, patch]) => ({ id, patch })));
    });
  }
}
