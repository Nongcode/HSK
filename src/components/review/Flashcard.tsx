import { HanziText } from "@/components/vocab/HanziText";
import type { Word } from "@/lib/content/schema";

export function Flashcard({
  word,
  flipped,
  onFlip,
}: {
  word: Word;
  flipped: boolean;
  onFlip: () => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
      <div className="flex min-h-48 flex-col items-center justify-center gap-4">
        {flipped ? (
          <>
            <HanziText hanzi={word.hanzi} pinyin={word.pinyin} size="text-5xl" />
            <p className="text-xl">
              {word.meaningVi || (
                <span className="text-base text-muted">
                  {word.meaningEn.slice(0, 3).join("; ")} (chưa có nghĩa Việt)
                </span>
              )}
            </p>
            {word.hanViet && <p className="text-sm text-muted">Hán Việt: {word.hanViet}</p>}
          </>
        ) : (
          <>
            <span lang="zh-Hans" className="font-hanzi text-7xl leading-tight">
              {word.hanzi}
            </span>
            <p className="text-sm text-muted">Nhớ nghĩa và cách đọc, rồi lật thẻ</p>
          </>
        )}
      </div>
      {!flipped && (
        <button
          type="button"
          onClick={onFlip}
          className="mt-6 min-h-11 w-full rounded-xl bg-accent px-4 font-medium text-accent-text"
        >
          Lật thẻ <kbd className="ml-1 text-xs opacity-80">Space</kbd>
        </button>
      )}
    </div>
  );
}
