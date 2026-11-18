"use client";

import { useEffect } from "react";

export function FocusLayout({
  title,
  progress,
  onExit,
  children,
}: {
  title: string;
  /** 0..1 share of the session completed. */
  progress: number;
  onExit: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit]);

  const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-2xl items-center gap-4 px-4 py-3">
        <button
          type="button"
          onClick={onExit}
          className="min-h-11 rounded-lg px-3 text-sm text-muted hover:bg-surface"
        >
          Thoát <kbd className="ml-1 text-xs opacity-70">Esc</kbd>
        </button>
        <h1 className="flex-1 text-center text-sm font-medium text-muted">{title}</h1>
        <span className="w-16" aria-hidden />
      </header>
      <div
        role="progressbar"
        aria-label="Tiến độ phiên"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mx-auto h-1.5 w-full max-w-2xl overflow-hidden rounded-full bg-line"
      >
        <div
          className="h-full bg-accent transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-8">
        {children}
      </main>
    </div>
  );
}
