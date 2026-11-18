"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/app-context";
import { searchWords } from "@/lib/vocab/search";
import { WordCard } from "./WordCard";

const PAGE_SIZE = 50;

export function VocabList() {
  const { words, settings } = useApp();
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("");
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const key = settings.hskVersion === "2.0" ? "hsk2" : "hsk3";
  const results = useMemo(
    () => searchWords(words, query).filter((w) => level === "" || w[key] === Number(level)),
    [words, query, level, key],
  );

  return (
    <section aria-labelledby="vocab-title" className="space-y-4">
      <h1 id="vocab-title" className="text-xl font-medium">
        Từ vựng HSK {settings.hskVersion}
      </h1>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(PAGE_SIZE);
          }}
          placeholder="Tìm chữ Hán, pinyin hoặc nghĩa"
          aria-label="Tìm từ"
          className="min-h-11 w-full rounded-lg border border-line bg-surface px-3 sm:w-auto sm:min-w-0 sm:flex-1"
        />
        <label className="flex items-center gap-2 text-sm">
          Cấp độ
          <select
            value={level}
            onChange={(e) => {
              setLevel(e.target.value);
              setLimit(PAGE_SIZE);
            }}
            className="min-h-11 rounded-lg border border-line bg-surface px-2"
          >
            <option value="">Tất cả</option>
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                HSK {n}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showPinyin}
            onChange={(e) => setShowPinyin(e.target.checked)}
          />
          Hiện pinyin
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showMeaning}
            onChange={(e) => setShowMeaning(e.target.checked)}
          />
          Hiện nghĩa
        </label>
      </div>
      <p className="text-sm text-muted" aria-live="polite">
        {results.length} từ
      </p>
      {results.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-muted">
          Không tìm thấy từ phù hợp
        </p>
      ) : (
        <ul className="space-y-2">
          {results.slice(0, limit).map((w) => (
            <WordCard key={w.id} word={w} showPinyin={showPinyin} showMeaning={showMeaning} />
          ))}
        </ul>
      )}
      {results.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + PAGE_SIZE)}
          className="min-h-11 w-full rounded-lg border border-line bg-surface text-sm hover:border-accent"
        >
          Hiện thêm
        </button>
      )}
    </section>
  );
}
