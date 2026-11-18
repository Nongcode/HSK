import Link from "next/link";
import type { GradeResult } from "@/lib/writing/grade";
import { TAG_LABEL } from "@/lib/writing/labels";
import type { Rule, Sentence } from "@/lib/writing/schema";

export function FeedbackPanel({
  sentence,
  result,
  rule,
  flagged,
  isLast,
  onFlag,
  onNext,
}: {
  sentence: Sentence;
  result: GradeResult;
  rule: Rule | undefined;
  flagged: boolean;
  isLast: boolean;
  onFlag: () => void;
  onNext: () => void;
}) {
  return (
    <div
      role="region"
      aria-label="Kết quả"
      className={`space-y-4 rounded-2xl border bg-surface p-5 ${result.ok ? "border-ok" : "border-warn"}`}
    >
      {result.ok ? (
        <p role="status" className="text-lg font-medium text-ok">
          Chính xác
        </p>
      ) : (
        <div className="space-y-3">
          <p role="status" className="text-lg font-medium text-warn">
            Chưa đúng — {TAG_LABEL[result.tag]}
          </p>
          <div>
            <p className="text-sm text-muted">Đáp án đúng</p>
            <p lang="zh-Hans" className="font-hanzi text-2xl">
              {result.correct}
            </p>
          </div>
          {rule && (
            <p className="text-sm">
              {rule.summary}{" "}
              <Link
                href={`/writing/rules/${rule.id}`}
                className="inline-flex min-h-11 items-center text-accent underline"
              >
                Xem bài quy tắc
              </Link>
            </p>
          )}
        </div>
      )}
      <p className="text-sm text-muted">
        {sentence.pinyin} · {sentence.meaningVi}
      </p>
      <p className="text-sm text-muted">Mẫu câu: {sentence.pattern}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onFlag}
          disabled={flagged}
          className="min-h-11 rounded-lg px-3 text-sm text-muted underline disabled:no-underline"
        >
          {flagged ? "Đã đánh dấu câu này" : "Câu này có vẻ sai"}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="min-h-11 rounded-xl bg-accent px-6 font-medium text-accent-text"
        >
          {isLast ? "Xem tổng kết" : "Câu tiếp"} <kbd className="ml-1 text-xs opacity-80">Enter</kbd>
        </button>
      </div>
    </div>
  );
}
