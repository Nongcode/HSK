"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/app-context";
import type { ErrorTag } from "@/lib/storage/types";
import { TAG_LABEL } from "@/lib/writing/labels";
import { mistakeStats } from "@/lib/writing/stats";

export function MistakesView() {
  const { storage } = useApp();
  const [stats, setStats] = useState<{ tag: ErrorTag; count: number }[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    storage.listAttempts().then((a) => {
      if (!cancelled) setStats(mistakeStats(a));
    });
    return () => {
      cancelled = true;
    };
  }, [storage]);

  if (stats === null) return null;
  const max = Math.max(1, ...stats.map((s) => s.count));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-medium">Lỗi hay mắc</h1>
      {stats.length === 0 ? (
        <div className="space-y-3 rounded-2xl border border-line bg-surface p-6">
          <p>Chưa có lỗi nào được ghi lại. Cứ luyện thử vài câu nhé!</p>
          <Link href="/writing/practice" className="inline-flex min-h-11 items-center text-accent underline">
            Luyện viết
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {stats.map((s) => (
            <li key={s.tag} className="space-y-1 rounded-xl border border-line bg-surface p-4">
              <div className="flex justify-between text-sm">
                <span>{TAG_LABEL[s.tag]}</span>
                <strong>{s.count}</strong>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-line">
                <div
                  role="img"
                  aria-label={`${TAG_LABEL[s.tag]}: ${s.count} lần`}
                  className="h-full bg-warn"
                  style={{ width: `${(s.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
