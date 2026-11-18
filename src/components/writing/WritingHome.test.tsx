import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/lib/app-context";
import { newCard } from "@/lib/srs/sm2";
import { MemoryStorage } from "@/lib/storage/memory-storage";
import type { Sentence } from "@/lib/writing/schema";
import { cardIdFor } from "@/lib/writing/session";
import { WritingHome } from "./WritingHome";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const s = (id: string): Sentence => ({
  id, chunks: ["a", "b", "c"], accepted: [[0, 1, 2]], pinyin: "", meaningVi: "", pattern: "",
  ruleId: "r", mistakes: [], difficulty: 1, reviewed: false,
});

function setup(storage: MemoryStorage, sentences: Sentence[]) {
  render(
    <AppProvider words={[]} load={async () => ({ storage, isEphemeral: false })}>
      <WritingHome sentences={sentences} />
    </AppProvider>,
  );
}

describe("WritingHome", () => {
  it("links the four sections", async () => {
    setup(new MemoryStorage(), [s("a")]);
    expect(await screen.findByRole("link", { name: /Sắp xếp câu/ })).toHaveAttribute("href", "/writing/practice");
    expect(screen.getByRole("link", { name: /Quy tắc trật tự từ/ })).toHaveAttribute("href", "/writing/rules");
    expect(screen.getByRole("link", { name: /Lỗi hay mắc/ })).toHaveAttribute("href", "/writing/mistakes");
  });

  it("shows how many wrong sentences are due and links the wrong-review mode", async () => {
    const st = new MemoryStorage();
    await st.putCard({ ...newCard(cardIdFor("a"), Date.now()), due: Date.now() - 1000 });
    await st.putCard({ ...newCard(cardIdFor("b"), Date.now()), due: Date.now() - 1000 });
    setup(st, [s("a"), s("b"), s("c")]);
    const link = await screen.findByRole("link", { name: /Ôn câu sai/ });
    expect(link).toHaveAttribute("href", "/writing/practice?mode=wrong");
    expect(link).toHaveTextContent("2 câu");
  });

  it("softly disables wrong-review with an explanation when nothing is due", async () => {
    setup(new MemoryStorage(), [s("a")]);
    expect(await screen.findByText(/Chưa có câu sai nào đến hạn/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Ôn câu sai/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Ôn câu sai/).closest("[aria-disabled='true']")).not.toBeNull();
  });
});
