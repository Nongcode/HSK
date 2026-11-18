"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FocusLayout } from "@/components/FocusLayout";
import { useApp } from "@/lib/app-context";
import type { ErrorTag } from "@/lib/storage/types";
import { isFocusedControl } from "@/lib/writing/keys";
import { gradeOrder, type GradeResult } from "@/lib/writing/grade";
import { TAG_LABEL } from "@/lib/writing/labels";
import type { Rule, Sentence } from "@/lib/writing/schema";
import { buildWrongQueue, pickPractice, recordAttempt } from "@/lib/writing/session";
import { shuffleOrder } from "@/lib/writing/shuffle";
import { FeedbackPanel } from "./FeedbackPanel";
import { SentenceBoard } from "./SentenceBoard";

type Mode = "practice" | "wrong";

const EMPTY: Record<Mode, { title: string; body: string }> = {
  practice: {
    title: "Chưa có câu nào để luyện.",
    body: "Kho câu đang trống. Hãy quay lại sau nhé.",
  },
  wrong: {
    title: "Hôm nay không có câu sai nào cần ôn.",
    body: "Các câu bạn làm sai sẽ hiện lại ở đây khi đến hạn ôn.",
  },
};

export function WritingSession({
  mode,
  onExit,
  sentences,
  rules,
}: {
  mode: Mode;
  onExit: () => void;
  sentences: Sentence[];
  rules: Rule[];
}) {
  const { storage, settings, setSettings } = useApp();
  const [queue, setQueue] = useState<Sentence[] | null>(null);
  const [index, setIndex] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [showPinyin, setShowPinyin] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [tags, setTags] = useState<Partial<Record<ErrorTag, number>>>({});
  const started = useRef(false);
  const busy = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const now = Date.now();
      setQueue(
        mode === "wrong"
          ? await buildWrongQueue(storage, sentences, now)
          : pickPractice(sentences, await storage.listAttempts()),
      );
    })();
  }, [mode, storage, sentences]);

  const current = queue?.[index];
  const order = useMemo(() => (current ? shuffleOrder(current) : []), [current]);
  const rule = rules.find((r) => r.id === current?.ruleId);
  const flagged = current ? settings.flaggedSentences.includes(current.id) : false;

  const check = useCallback(async () => {
    if (!current || result || busy.current || placed.length !== current.chunks.length) return;
    busy.current = true;
    try {
      const graded = gradeOrder(current, placed, rule?.tag ?? "other");
      await recordAttempt(
        storage,
        current,
        graded.ok ? { ok: true } : { ok: false, tag: graded.tag },
        Date.now(),
      );
      if (graded.ok) setCorrect((n) => n + 1);
      else setTags((t) => ({ ...t, [graded.tag]: (t[graded.tag] ?? 0) + 1 }));
      setResult(graded);
      setSaveError(false);
    } catch {
      setSaveError(true);
    } finally {
      busy.current = false;
    }
  }, [current, result, placed, rule, storage]);

  const next = useCallback(() => {
    if (!result) return;
    setIndex((i) => i + 1);
    setResult(null);
    setPlaced([]);
    setShowPinyin(false);
  }, [result]);

  const flag = useCallback(async () => {
    if (!current || settings.flaggedSentences.includes(current.id)) return;
    await setSettings({ flaggedSentences: [...settings.flaggedSentences, current.id] });
  }, [current, settings.flaggedSentences, setSettings]);

  useEffect(() => {
    if (!result) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isFocusedControl(e.target)) return; // focused links/buttons handle Enter themselves
      e.preventDefault();
      next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [result, next]);

  if (queue === null) {
    return (
      <p role="status" className="p-6 text-center text-muted">
        Đang chuẩn bị câu…
      </p>
    );
  }

  const title = mode === "wrong" ? "Ôn câu sai" : "Luyện viết";

  if (queue.length === 0) {
    return (
      <FocusLayout title={title} progress={1} onExit={onExit}>
        <div className="space-y-4 rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="text-lg">{EMPTY[mode].title}</p>
          <p className="text-muted">{EMPTY[mode].body}</p>
          <Link href="/writing" className="inline-flex min-h-11 items-center text-accent underline">
            Về trang luyện viết
          </Link>
        </div>
      </FocusLayout>
    );
  }

  if (!current) {
    const wrong = queue.length - correct;
    const tagList = (Object.keys(tags) as ErrorTag[]).sort((a, b) => tags[b]! - tags[a]!);
    return (
      <FocusLayout title={title} progress={1} onExit={onExit}>
        <div className="space-y-5 rounded-2xl border border-line bg-surface p-8 text-center">
          <h2 className="text-xl font-medium">Hoàn thành phiên luyện</h2>
          <p className="text-muted">
            Đúng <strong>{correct}</strong> · Sai <strong>{wrong}</strong> trên {queue.length} câu.
          </p>
          {tagList.length > 0 && (
            <ul className="space-y-1 text-sm">
              {tagList.map((t) => (
                <li key={t}>
                  {TAG_LABEL[t]}: <strong>{tags[t]}</strong>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/writing"
            className="inline-flex min-h-11 items-center rounded-xl bg-accent px-6 font-medium text-accent-text"
          >
            Về trang luyện viết
          </Link>
        </div>
      </FocusLayout>
    );
  }

  return (
    <FocusLayout title={title} progress={index / queue.length} onExit={onExit}>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm text-muted">Sắp xếp các cụm thành câu đúng</p>
          <p className="text-lg">{current.meaningVi}</p>
          <button
            type="button"
            onClick={() => setShowPinyin((v) => !v)}
            className="min-h-11 rounded-lg px-3 text-sm text-muted underline"
          >
            {showPinyin ? "Ẩn pinyin" : "Hiện pinyin"}
          </button>
          {showPinyin && <p className="text-sm text-muted">{current.pinyin}</p>}
        </div>
        <SentenceBoard
          key={current.id}
          chunks={current.chunks}
          initialOrder={order}
          disabled={result !== null}
          onChange={setPlaced}
          onSubmit={() => void check()}
        />
        {saveError && (
          <p role="alert" className="text-center text-warn">
            Không lưu được kết quả. Hãy thử kiểm tra lại.
          </p>
        )}
        {result ? (
          <FeedbackPanel
            sentence={current}
            result={result}
            rule={rule}
            flagged={flagged}
            isLast={index + 1 >= queue.length}
            onFlag={() => void flag()}
            onNext={next}
          />
        ) : (
          <div className="text-center">
            <button
              type="button"
              onClick={() => void check()}
              disabled={placed.length !== current.chunks.length}
              className="min-h-12 rounded-xl bg-accent px-8 font-medium text-accent-text disabled:opacity-50"
            >
              Kiểm tra <kbd className="ml-1 text-xs opacity-80">Enter</kbd>
            </button>
          </div>
        )}
      </div>
    </FocusLayout>
  );
}
