import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/lib/app-context";
import { MemoryStorage } from "@/lib/storage/memory-storage";
import type { ErrorTag } from "@/lib/storage/types";
import { MistakesView } from "./MistakesView";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function setup(storage: MemoryStorage) {
  render(
    <AppProvider words={[]} load={async () => ({ storage, isEphemeral: false })}>
      <MistakesView />
    </AppProvider>,
  );
}
const wrong = (storage: MemoryStorage, tag: ErrorTag, n: number) =>
  Promise.all(Array.from({ length: n }, (_, i) => storage.addAttempt({ sentenceId: `${tag}${i}`, ok: false, tag, at: i })));

describe("MistakesView", () => {
  it("lists error types by count, most frequent first, with accessible bars", async () => {
    const st = new MemoryStorage();
    await wrong(st, "bei-position", 1);
    await wrong(st, "ba-position", 3);
    setup(st);
    const items = await screen.findAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Vị trí của 把");
    expect(items[0]).toHaveTextContent("3");
    expect(items[1]).toHaveTextContent("Vị trí của 被");
    expect(within(items[0]).getByRole("img")).toHaveAttribute("aria-label", "Vị trí của 把: 3 lần");
  });

  it("shows a friendly empty state when there are no mistakes", async () => {
    setup(new MemoryStorage());
    expect(await screen.findByText(/Chưa có lỗi nào được ghi lại/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Luyện viết/ })).toHaveAttribute("href", "/writing/practice");
  });
});
