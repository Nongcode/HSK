"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import vocabData from "@/content/vocab/hsk-words.json";
import type { Word } from "@/lib/content/schema";
import { getStorage } from "@/lib/storage";
import { DEFAULT_SETTINGS, type Settings, type Storage } from "@/lib/storage/types";
import { applyEdit, wordsFor } from "@/lib/vocab";

interface AppState {
  storage: Storage;
  settings: Settings;
  setSettings: (p: Partial<Settings>) => Promise<void>;
  /** Words of the selected HSK version, with the user's edits applied. */
  words: Word[];
  /** Every word of both versions, with edits applied. */
  allWords: Word[];
  saveEdit: (id: string, patch: Partial<Word>) => Promise<void>;
  isEphemeral: boolean;
}

const AppContext = createContext<AppState | null>(null);

type Loader = () => Promise<{ storage: Storage; isEphemeral: boolean }>;

export function AppProvider({
  children,
  words = vocabData as Word[],
  load = getStorage,
}: {
  children: React.ReactNode;
  words?: Word[];
  load?: Loader;
}) {
  const [ready, setReady] = useState<{
    storage: Storage;
    isEphemeral: boolean;
    settings: Settings;
    edits: Record<string, Partial<Word>>;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { storage, isEphemeral } = await load();
      const [settings, backup] = await Promise.all([storage.getSettings(), storage.exportAll()]);
      if (!cancelled) setReady({ storage, isEphemeral, settings, edits: backup.edits });
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const settings = ready?.settings ?? DEFAULT_SETTINGS;
  useEffect(() => {
    const root = document.documentElement;
    const dark =
      settings.theme === "dark" ||
      (settings.theme === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    root.classList.toggle("dark", Boolean(dark));
    root.style.setProperty("--font-scale", String(settings.fontScale));
  }, [settings.theme, settings.fontScale]);

  const setSettings = useCallback(
    async (p: Partial<Settings>) => {
      if (!ready) return;
      await ready.storage.putSettings(p);
      setReady({ ...ready, settings: { ...ready.settings, ...p } });
    },
    [ready],
  );

  const saveEdit = useCallback(
    async (id: string, patch: Partial<Word>) => {
      if (!ready) return;
      const merged = { ...ready.edits[id], ...patch };
      await ready.storage.putEdit(id, merged);
      setReady({ ...ready, edits: { ...ready.edits, [id]: merged } });
    },
    [ready],
  );

  const value = useMemo<AppState | null>(() => {
    if (!ready) return null;
    const allWords = words.map((w) => applyEdit(w, ready.edits[w.id]));
    return {
      storage: ready.storage,
      settings: ready.settings,
      setSettings,
      allWords,
      words: wordsFor(allWords, ready.settings.hskVersion),
      saveEdit,
      isEphemeral: ready.isEphemeral,
    };
  }, [ready, words, setSettings, saveEdit]);

  if (!value) {
    return (
      <p role="status" className="p-6 text-muted">
        Đang tải…
      </p>
    );
  }
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp phải được dùng bên trong <AppProvider>");
  return ctx;
}
