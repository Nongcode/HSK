import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Word } from "@/lib/content/schema";
import { AppProvider } from "@/lib/app-context";
import { MemoryStorage } from "@/lib/storage/memory-storage";
import { ReviewSession } from "./ReviewSession";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

const w = (id: string, vi: string): Word => ({
  id, hanzi: id, pinyin: `py-${id}`, pos: [], meaningVi: vi, meaningEn: ["m"], hsk2: 1, hsk3: null, reviewed: false,
});
const words = [w("爱", "yêu"), w("人", "người")];

let storage: MemoryStorage;
const onExit = vi.fn();
beforeEach(() => {
  storage = new MemoryStorage();
  onExit.mockClear();
});

function setup(list = words) {
  render(
    <AppProvider words={list} load={async () => ({ storage, isEphemeral: false })}>
      <ReviewSession onExit={onExit} />
    </AppProvider>,
  );
}

describe("ReviewSession", () => {
  it("flips with Space, grades with 3, saves SM-2 state and advances", async () => {
    setup();
    expect(await screen.findByText("爱")).toBeInTheDocument();
    expect(screen.queryByText("yêu")).not.toBeInTheDocument();
    await userEvent.keyboard(" ");
    expect(screen.getByText("yêu")).toBeInTheDocument();
    await userEvent.keyboard("3");
    await waitFor(async () => expect(await storage.getCard("爱")).toMatchObject({ intervalDays: 1, reps: 1 }));
    expect((await storage.listReviews())[0]).toMatchObject({ cardId: "爱", grade: "good" });
    expect(await screen.findByText("人")).toBeInTheDocument();
  });

  it("keeps working after a failed save instead of freezing", async () => {
    setup();
    await screen.findByText("爱");
    const spy = vi.spyOn(storage, "putCard").mockRejectedValueOnce(new Error("quota"));
    await userEvent.keyboard(" ");
    await userEvent.keyboard("3");
    expect(await screen.findByRole("alert")).toHaveTextContent(/không lưu được/i);
    spy.mockRestore();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("3");
    expect(await screen.findByText("人")).toBeInTheDocument();
  });

  it("ignores grade keys until the card is flipped", async () => {
    setup();
    await screen.findByText("爱");
    await userEvent.keyboard("3");
    expect(await storage.getCard("爱")).toBeUndefined();
  });

  it("shows a calm summary after the last card and stops", async () => {
    setup([words[0]]);
    await screen.findByText("爱");
    await userEvent.keyboard(" ");
    await userEvent.keyboard("4");
    expect(await screen.findByText(/Hoàn thành/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Về trang chủ" })).toHaveAttribute("href", "/");
  });

  it("re-queues a forgotten card at the end of the session", async () => {
    setup([words[0]]);
    await screen.findByText("爱");
    await userEvent.keyboard(" ");
    await userEvent.keyboard("1");
    expect(await screen.findByText("爱")).toBeInTheDocument();
    expect(screen.queryByText(/Hoàn thành/)).not.toBeInTheDocument();
  });

  it("exits on Escape", async () => {
    setup();
    await screen.findByText("爱");
    await userEvent.keyboard("{Escape}");
    expect(onExit).toHaveBeenCalled();
  });

  it("shows a friendly empty state when there is nothing to review", async () => {
    setup([]);
    expect(await screen.findByText(/không còn thẻ nào cần ôn/i)).toBeInTheDocument();
  });
});
