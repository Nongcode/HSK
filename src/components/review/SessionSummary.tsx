import Link from "next/link";
import type { Grade } from "@/lib/storage/types";

const LABELS: Record<Grade, string> = { again: "Quên", hard: "Khó", good: "Được", easy: "Dễ" };

export function SessionSummary({ counts }: { counts: Record<Grade, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <div className="space-y-5 rounded-2xl border border-line bg-surface p-8 text-center">
      <h2 className="text-xl font-medium">Hoàn thành phiên ôn</h2>
      <p className="text-muted">Bạn đã ôn {total} lượt thẻ. Nghỉ một chút rồi quay lại sau nhé.</p>
      <ul className="flex justify-center gap-4 text-sm">
        {(Object.keys(LABELS) as Grade[]).map((g) => (
          <li key={g}>
            {LABELS[g]}: <strong>{counts[g]}</strong>
          </li>
        ))}
      </ul>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-xl bg-accent px-6 font-medium text-accent-text"
      >
        Về trang chủ
      </Link>
    </div>
  );
}
