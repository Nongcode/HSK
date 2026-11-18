"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/lib/app-context";
import { speak } from "@/lib/speech";
import { posLabel } from "@/lib/vocab/pos";
import { HanziText } from "./HanziText";

export function WordDetail({ id }: { id: string }) {
  const { allWords, saveEdit } = useApp();
  const word = allWords.find((w) => w.id === id);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  if (!word) {
    return (
      <div className="space-y-3">
        <p>Không tìm thấy từ này</p>
        <Link href="/vocab" className="text-accent underline">
          Quay lại thư viện
        </Link>
      </div>
    );
  }

  const levels = [
    word.hsk2 !== null && `HSK 2.0: cấp ${word.hsk2}`,
    word.hsk3 !== null && `HSK 3.0: cấp ${word.hsk3}`,
  ].filter(Boolean);

  return (
    <article className="space-y-5">
      <Link
        href="/vocab"
        className="inline-flex min-h-11 items-center text-sm text-muted hover:text-accent"
      >
        ← Thư viện từ
      </Link>
      <div className="flex items-center gap-4">
        <HanziText hanzi={word.hanzi} pinyin={word.pinyin} size="text-6xl" />
        <button
          type="button"
          onClick={() => speak(word.hanzi)}
          aria-label={`Nghe phát âm ${word.hanzi}`}
          className="min-h-11 min-w-11 rounded-full border border-line bg-surface hover:border-accent"
        >
          🔊
        </button>
      </div>
      <p className="text-sm text-muted">
        {levels.join(" · ")}
        {word.pos.length > 0 && ` · ${word.pos.map(posLabel).join(", ")}`}
        {word.hanViet && ` · Hán Việt: ${word.hanViet}`}
      </p>

      {editing ? (
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            await saveEdit(word.id, { meaningVi: draft.trim(), reviewed: true });
            setEditing(false);
          }}
        >
          <label className="block text-sm">
            Nghĩa tiếng Việt
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-line bg-surface p-3"
            />
          </label>
          <div className="flex gap-2">
            <button type="submit" className="min-h-11 rounded-lg bg-accent px-4 text-accent-text">
              Lưu
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="min-h-11 rounded-lg border border-line px-4"
            >
              Hủy
            </button>
          </div>
        </form>
      ) : (
        <section className="space-y-2">
          {word.meaningVi ? (
            <p className="text-lg">{word.meaningVi}</p>
          ) : (
            <p className="text-muted">Chưa có nghĩa Việt cho từ này.</p>
          )}
          <p className="text-sm text-muted">{word.meaningEn.join("; ")}</p>
          <button
            type="button"
            onClick={() => {
              setDraft(word.meaningVi);
              setEditing(true);
            }}
            className="min-h-11 rounded-lg border border-line px-3 text-sm hover:border-accent"
          >
            Sửa nghĩa
          </button>
        </section>
      )}
    </article>
  );
}
