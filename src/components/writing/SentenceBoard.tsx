"use client";

import { useEffect, useState } from "react";

interface Props {
  chunks: string[];
  /** Chunk indexes in the order they start in the tray (already shuffled). */
  initialOrder: number[];
  disabled: boolean;
  /** Original chunk indexes placed on the answer line, in order. */
  onChange: (placed: number[]) => void;
  onSubmit: () => void;
}

const chipClass =
  "min-h-11 rounded-lg border border-line bg-surface px-4 py-2 font-hanzi text-xl transition-colors enabled:hover:border-accent disabled:opacity-60";

export function SentenceBoard({ chunks, initialOrder, disabled, onChange, onSubmit }: Props) {
  const [placed, setPlaced] = useState<number[]>([]);
  const tray = initialOrder.filter((i) => !placed.includes(i));
  const complete = placed.length === chunks.length;

  const update = (next: number[]) => {
    setPlaced(next);
    onChange(next);
  };
  const place = (i: number) => !disabled && update([...placed, i]);
  const unplace = (i: number) => !disabled && update(placed.filter((p) => p !== i));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (disabled || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[1-9]$/.test(e.key)) {
        const i = tray[Number(e.key) - 1];
        if (i !== undefined) update([...placed, i]);
      } else if (e.key === "Backspace") {
        if (placed.length > 0) update(placed.slice(0, -1));
      } else if (e.key === "Enter" && complete) {
        e.preventDefault(); // keeps a focused button from also firing its click
        onSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="space-y-6">
      <ol
        role="list"
        aria-label="Câu của bạn"
        className="flex min-h-20 flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-line bg-surface/60 p-3"
      >
        {placed.length === 0 && (
          <li className="px-1 text-sm text-muted" aria-hidden>
            Chạm các cụm bên dưới để ghép thành câu
          </li>
        )}
        {placed.map((i) => (
          <li key={i}>
            <button
              type="button"
              lang="zh-Hans"
              disabled={disabled}
              onClick={() => unplace(i)}
              className={`${chipClass} border-accent`}
            >
              {chunks[i]}
            </button>
          </li>
        ))}
      </ol>
      <div role="group" aria-label="Các cụm từ" className="flex flex-wrap gap-2">
        {tray.map((i, k) => (
          <button
            key={i}
            type="button"
            lang="zh-Hans"
            disabled={disabled}
            onClick={() => place(i)}
            className={`${chipClass} relative`}
          >
            <kbd aria-hidden className="mr-2 font-sans text-xs text-muted">
              {k + 1}
            </kbd>
            {chunks[i]}
          </button>
        ))}
      </div>
    </div>
  );
}
