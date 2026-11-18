import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/lib/app-context";
import type { Word } from "@/lib/content/schema";
import { MemoryStorage } from "@/lib/storage/memory-storage";
import { HomeDashboard } from "./HomeDashboard";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const word = (id: string): Word => ({
  id,
  hanzi: id,
  pinyin: id,
  pos: [],
  meaningVi: "m",
  meaningEn: ["m"],
  hsk2: 1,
  hsk3: null,
  reviewed: false,
});

function setup(words: Word[]) {
  render(
    <AppProvider words={words} load={async () => ({ storage: new MemoryStorage(), isEphemeral: false })}>
      <HomeDashboard />
    </AppProvider>,
  );
}

describe("HomeDashboard", () => {
  it("offers a shortcut to writing practice", async () => {
    setup([]);
    expect(await screen.findByRole("link", { name: "Luyện viết" })).toHaveAttribute("href", "/writing");
  });

  it("shows how many cards are ready and links to the review session", async () => {
    setup([word("a"), word("b")]);
    expect(await screen.findByText(/2 thẻ/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Bắt đầu ôn/ })).toHaveAttribute("href", "/review");
  });

  it("disables the start button with a friendly message when nothing is due", async () => {
    setup([]);
    expect(await screen.findByText(/không có thẻ nào cần ôn/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Bắt đầu ôn/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Bắt đầu ôn/).closest("[aria-disabled='true']")).not.toBeNull();
  });

  it("gently reminds to back up when progress was never backed up, without blocking review", async () => {
    const storage = new MemoryStorage();
    await storage.addReview({ cardId: "a", grade: "good", at: Date.now(), prevIntervalDays: 0, nextIntervalDays: 1 });
    render(
      <AppProvider words={[word("a")]} load={async () => ({ storage, isEphemeral: false })}>
        <HomeDashboard />
      </AppProvider>,
    );
    expect(await screen.findByText(/sao lưu/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Cài đặt/ })).toHaveAttribute("href", "/settings");
  });

  it("shows no backup reminder when there is no progress yet", async () => {
    setup([word("a")]);
    await screen.findByText(/1 thẻ/);
    expect(screen.queryByText(/sao lưu/i)).not.toBeInTheDocument();
  });

  it("links to the vocab library", async () => {
    setup([word("a")]);
    expect(await screen.findByRole("link", { name: /Thư viện từ/ })).toHaveAttribute("href", "/vocab");
  });
});
