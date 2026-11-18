"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FocusLayout } from "@/components/FocusLayout";
import { useApp } from "@/lib/app-context";
import type { Word } from "@/lib/content/schema";
import { buildQueue, countNewToday } from "@/lib/srs/queue";
import { newCard, schedule } from "@/lib/srs/sm2";
import type { Grade } from "@/lib/storage/types";
import { Flashcard } from "./Flashcard";
import { SessionSummary } from "./SessionSummary";

const KEYS: Record<string, Grade> = { "1": "again", "2": "hard", "3": "good", "4": "easy" };
const BUTTONS: { key: string; grade: Grade; label: string }[] = [
  { key: "1", grade: "again", label: "Quên" },
  { key: "2", grade: "hard", label: "Khó" },
  { key: "3", grade: "good", label: "Được" },
  { key: "4", grade: "easy", label: "Dễ" },
];

export function ReviewSession({ onExit }: { onExit: () => void }) {
  const { storage, words, settings } = useApp();
  const [queue, setQueue] = useState<Word[] | null>(null);
  const [index, setIndex] = useState(0);
  const [saveError, setSaveError] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [counts, setCounts] = useState<Record<Grade, number>>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });
  const started = useRef(false);
  const busy = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const now = Date.now();
      const newToday = countNewToday(await storage.listReviews(), now);
      setQueue(
        await buildQueue(storage, words, now, {
          hskVersion: settings.hskVersion,
          dailyNewLimit: settings.dailyNewLimit,
          sessionLimit: settings.sessionLimit,
          newToday,
        }),
      );
    })();
  }, [storage, words, settings]);

  const current = queue?.[index];

  const grade = useCallback(
    async (g: Grade) => {
      if (!current || !flipped || busy.current) return;
      busy.current = true;
      try {
        const now = Date.now();
      const before = (await storage.getCard(current.id)) ?? newCard(current.id, now);
        const after = schedule(before, g, now);
        await storage.putCard(after);
        await storage.addReview({
          cardId: current.id,
          grade: g,
          at: now,
          prevIntervalDays: before.intervalDays,
          nextIntervalDays: after.intervalDays,
        });
        setCounts((c) => ({ ...c, [g]: c[g] + 1 }));
        if (g === "again") setQueue((q) => (q ? [...q, current] : q));
        setIndex((i) => i + 1);
        setFlipped(false);
        setSaveError(false);
      } catch {
        setSaveError(true);
      } finally {
        busy.current = false;
      }
    },
    [current, flipped, storage],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setFlipped(true);
      } else if (KEYS[e.key]) {
        void grade(KEYS[e.key]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [grade]);

  if (queue === null) {
    return (
      <p role="status" className="p-6 text-center text-muted">
        Đang chuẩn bị thẻ…
      </p>
    );
  }

  if (queue.length === 0) {
    return (
      <FocusLayout title="Ôn tập" progress={1} onExit={onExit}>
        <div className="space-y-4 rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="text-lg">Hôm nay không còn thẻ nào cần ôn.</p>
          <p className="text-muted">Bạn có thể xem lại thư viện từ hoặc nghỉ ngơi.</p>
          <Link href="/vocab" className="inline-flex min-h-11 items-center text-accent underline">
            Mở thư viện từ
          </Link>
        </div>
      </FocusLayout>
    );
  }

  return (
    <FocusLayout title="Ôn tập" progress={index / queue.length} onExit={onExit}>
      {current ? (
        <div className="space-y-4">
          <Flashcard word={current} flipped={flipped} onFlip={() => setFlipped(true)} />
          {saveError && (
            <p role="alert" className="text-center text-warn">
              Không lưu được kết quả. Hãy thử chấm lại.
            </p>
          )}
          {flipped && (
            <div className="grid grid-cols-4 gap-2" role="group" aria-label="Chấm mức nhớ">
              {BUTTONS.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => void grade(b.grade)}
                  className="min-h-14 rounded-xl border border-line bg-surface text-sm hover:border-accent"
                >
                  {b.label}
                  <kbd className="block text-xs text-muted">{b.key}</kbd>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <SessionSummary counts={counts} />
      )}
    </FocusLayout>
  );
}
