"use client";

import { useApp } from "@/lib/app-context";
import type { Settings } from "@/lib/storage/types";

const ORDER: Settings["theme"][] = ["light", "dark", "system"];
const LABEL: Record<Settings["theme"], string> = {
  light: "Sáng",
  dark: "Tối",
  system: "Theo hệ thống",
};

export function ThemeToggle() {
  const { settings, setSettings } = useApp();
  const next = ORDER[(ORDER.indexOf(settings.theme) + 1) % ORDER.length];
  return (
    <button
      type="button"
      onClick={() => setSettings({ theme: next })}
      className="min-h-11 rounded-lg px-3 text-sm text-muted hover:bg-surface"
      aria-label={`Giao diện: ${LABEL[settings.theme]}. Bấm để đổi sang ${LABEL[next]}`}
    >
      {LABEL[settings.theme]}
    </button>
  );
}
