"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/app-context";
import { buildQueue, countNewToday } from "@/lib/srs/queue";
import { needsBackupReminder } from "@/lib/backup";
import { streakDays } from "@/lib/stats";

export function HomeDashboard() {
  const { storage, words, settings } = useApp();
  const [stats, setStats] = useState<{ ready: number; streak: number; remind: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const now = Date.now();
      const reviews = await storage.listReviews();
      const queue = await buildQueue(storage, words, now, {
        hskVersion: settings.hskVersion,
        dailyNewLimit: settings.dailyNewLimit,
        sessionLimit: settings.sessionLimit,
        newToday: countNewToday(reviews, now),
      });
      if (!cancelled) setStats({
          ready: queue.length,
          streak: streakDays(reviews, now),
          remind: needsBackupReminder(settings, now, reviews.length > 0),
        });
    })();
    return () => {
      cancelled = true;
    };
  }, [storage, words, settings]);

  if (!stats) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-medium">Chào bạn 👋</h1>
      <section className="space-y-4 rounded-2xl border border-line bg-surface p-6">
        {stats.ready > 0 ? (
          <>
            <p className="text-lg">
              Hôm nay có <strong>{stats.ready} thẻ</strong> sẵn sàng để ôn.
            </p>
            <Link
              href="/review"
              className="inline-flex min-h-12 items-center rounded-xl bg-accent px-6 font-medium text-accent-text"
            >
              Bắt đầu ôn
            </Link>
          </>
        ) : (
          <>
            <p className="text-lg">Hôm nay không có thẻ nào cần ôn. Bạn làm tốt lắm!</p>
            <span
              aria-disabled="true"
              className="inline-flex min-h-12 items-center rounded-xl border border-line px-6 text-muted opacity-60"
            >
              Bắt đầu ôn
            </span>
          </>
        )}
        {stats.streak > 0 && (
          <p className="text-sm text-muted">Bạn đã học {stats.streak} ngày liên tiếp.</p>
        )}
      </section>
      {stats.remind && (
        <p className="rounded-xl border border-line bg-surface p-4 text-sm text-muted">
          Đã lâu bạn chưa sao lưu tiến độ. <Link href="/settings" className="underline">Cài đặt</Link> → tải bản sao lưu để không mất dữ liệu.
        </p>
      )}
      <nav aria-label="Lối tắt" className="flex flex-wrap gap-3">
        <Link
          href="/vocab"
          className="inline-flex min-h-11 items-center rounded-lg border border-line bg-surface px-4 text-sm hover:border-accent"
        >
          Thư viện từ
        </Link>
        <Link
          href="/writing"
          className="inline-flex min-h-11 items-center rounded-lg border border-line bg-surface px-4 text-sm hover:border-accent"
        >
          Luyện viết
        </Link>
      </nav>
    </div>
  );
}
