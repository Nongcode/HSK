import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Word } from "@/lib/content/schema";
import { MemoryStorage } from "@/lib/storage/memory-storage";
import { AppProvider, useApp } from "./app-context";

const words: Word[] = [
  { id: "a", hanzi: "a", pinyin: "a", pos: [], meaningVi: "gốc", meaningEn: ["x"], hsk2: 1, hsk3: null, reviewed: false },
  { id: "b", hanzi: "b", pinyin: "b", pos: [], meaningVi: "", meaningEn: ["y"], hsk2: null, hsk3: 2, reviewed: false },
];

function Probe() {
  const { words: ws, settings, isEphemeral } = useApp();
  return (
    <p>
      {settings.hskVersion}|{ws.map((x) => x.meaningVi || "-").join(",")}|{String(isEphemeral)}
    </p>
  );
}

describe("AppProvider", () => {
  it("exposes words for the chosen version with stored edits applied", async () => {
    const storage = new MemoryStorage();
    await storage.putEdit("a", { meaningVi: "đã sửa" });
    render(
      <AppProvider words={words} load={async () => ({ storage, isEphemeral: true })}>
        <Probe />
      </AppProvider>,
    );
    await waitFor(() => expect(screen.getByText("2.0|đã sửa|true")).toBeInTheDocument());
  });

  it("switching HSK version keeps card progress and changes the word set", async () => {
    const storage = new MemoryStorage();
    await storage.putCard({ id: "a", ease: 2.5, intervalDays: 1, reps: 1, lapses: 0, due: 0 });
    await storage.putSettings({ hskVersion: "3.0" });
    render(
      <AppProvider words={words} load={async () => ({ storage, isEphemeral: false })}>
        <Probe />
      </AppProvider>,
    );
    await waitFor(() => expect(screen.getByText("3.0|-|false")).toBeInTheDocument());
    expect(await storage.getCard("a")).toBeDefined();
  });

  it("refresh() picks up data restored into storage", async () => {
    const storage = new MemoryStorage();
    function Btn() {
      const { refresh } = useApp();
      return <button onClick={() => refresh()}>r</button>;
    }
    render(
      <AppProvider words={words} load={async () => ({ storage, isEphemeral: true })}>
        <Probe />
        <Btn />
      </AppProvider>,
    );
    await screen.findByText("2.0|gốc|true");
    await storage.putSettings({ hskVersion: "3.0" });
    screen.getByText("r").click();
    await waitFor(() => expect(screen.getByText(/^3\.0\|/)).toBeInTheDocument());
  });
});
