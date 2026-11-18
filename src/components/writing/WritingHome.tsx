"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/app-context";
import type { Sentence } from "@/lib/writing/schema";
import { buildWrongQueue } from "@/lib/writing/session";

const cardClass =
  "block min-h-11 space-y-1 rounded-2xl border border-line bg-surface p-5 transition-colors";

export function WritingHome({ sentences }: { sentences: Sentence[] }) {
  const { storage } = useApp();
  const [due, setDue] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    buildWrongQueue(storage, sentences, Date.now(), Number.MAX_SAFE_INTEGER).then((q) => {
      if (!cancelled) setDue(q.length);
    });
    return () => {
      cancelled = true;
    };
  }, [storage, sentences]);

  if (due === null) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-medium">Luyện viết</h1>
      <p className="text-muted">Luyện trật tự từ trong câu tiếng Trung, mỗi lần một câu, không áp lực thời gian.</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        <li>
          <Link href="/writing/practice" className={`${cardClass} hover:border-accent`}>
            <span className="block text-lg font-medium">Sắp xếp câu</span>
            <span className="block text-sm text-muted">Ghép các cụm từ thành câu đúng.</span>
          </Link>
        </li>
        <li>
          {due > 0 ? (
            <Link href="/writing/practice?mode=wrong" className={`${cardClass} hover:border-accent`}>
              <span className="block text-lg font-medium">Ôn câu sai</span>
              <span className="block text-sm text-muted">{due} câu đến hạn ôn hôm nay.</span>
            </Link>
          ) : (
            <div aria-disabled="true" className={`${cardClass} opacity-60`}>
              <span className="block text-lg font-medium">Ôn câu sai</span>
              <span className="block text-sm text-muted">Chưa có câu sai nào đến hạn ôn.</span>
            </div>
          )}
        </li>
        <li>
          <Link href="/writing/rules" className={`${cardClass} hover:border-accent`}>
            <span className="block text-lg font-medium">Quy tắc trật tự từ</span>
            <span className="block text-sm text-muted">Đọc lại các quy tắc trước khi luyện.</span>
          </Link>
        </li>
        <li>
          <Link href="/writing/mistakes" className={`${cardClass} hover:border-accent`}>
            <span className="block text-lg font-medium">Lỗi hay mắc</span>
            <span className="block text-sm text-muted">Xem loại lỗi bạn gặp nhiều nhất.</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
