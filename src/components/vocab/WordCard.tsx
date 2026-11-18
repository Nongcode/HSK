import Link from "next/link";
import type { Word } from "@/lib/content/schema";
import { HanziText } from "./HanziText";

export function WordCard({
  word,
  showPinyin,
  showMeaning,
}: {
  word: Word;
  showPinyin: boolean;
  showMeaning: boolean;
}) {
  const missingVi = word.meaningVi === "";
  return (
    <li>
      <Link
        href={`/vocab/${encodeURIComponent(word.id)}`}
        className="flex min-h-11 items-center gap-4 rounded-xl border border-line bg-surface px-4 py-3 hover:border-accent"
      >
        <span className="w-28 shrink-0"><HanziText hanzi={word.hanzi} pinyin={word.pinyin} showPinyin={showPinyin} /></span>
        {showMeaning && (
          <span className="min-w-0 flex-1 text-sm">
            {missingVi ? (
              <>
                {word.meaningEn.slice(0, 3).join("; ")}{" "}
                <small className="text-muted">(chưa có nghĩa Việt)</small>
              </>
            ) : (
              word.meaningVi
            )}
          </span>
        )}
      </Link>
    </li>
  );
}
