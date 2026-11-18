import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Word } from "@/lib/content/schema";
import { AppProvider } from "@/lib/app-context";
import { MemoryStorage } from "@/lib/storage/memory-storage";
import { VocabList } from "./VocabList";
import { WordDetail } from "./WordDetail";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

const w = (hanzi: string, pinyin: string, vi: string, hsk2: number | null, hsk3: number | null): Word => ({
  id: hanzi, hanzi, pinyin, pos: ["v"], meaningVi: vi, meaningEn: ["english"], hsk2, hsk3, reviewed: false,
});
const words = [w("你好", "nǐ hǎo", "xin chào", 1, 1), w("爱情", "ài qíng", "tình yêu", 4, 2), w("摆", "bǎi", "", 4, 3)];

function setup(ui: React.ReactNode, storage = new MemoryStorage()) {
  render(
    <AppProvider words={words} load={async () => ({ storage, isEphemeral: false })}>
      {ui}
    </AppProvider>,
  );
  return storage;
}

describe("VocabList", () => {
  it("finds a word by pinyin without tones", async () => {
    setup(<VocabList />);
    await userEvent.type(await screen.findByRole("searchbox"), "ni hao");
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("你好")).toBeInTheDocument();
  });

  it("filters by level", async () => {
    setup(<VocabList />);
    await screen.findByRole("searchbox");
    await userEvent.selectOptions(screen.getByLabelText("Cấp độ"), "4");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByText("你好")).not.toBeInTheDocument();
  });

  it("shows English with a notice when the Vietnamese meaning is missing", async () => {
    setup(<VocabList />);
    const item = (await screen.findByText("摆")).closest("li")!;
    expect(within(item).getByText(/chưa có nghĩa Việt/i)).toBeInTheDocument();
    expect(within(item).getByText(/english/)).toBeInTheDocument();
  });

  it("shows a friendly empty state when nothing matches", async () => {
    setup(<VocabList />);
    await userEvent.type(await screen.findByRole("searchbox"), "zzzz");
    expect(screen.getByText("Không tìm thấy từ phù hợp")).toBeInTheDocument();
  });

  it("can hide meanings for self-testing", async () => {
    setup(<VocabList />);
    await screen.findByRole("searchbox");
    await userEvent.click(screen.getByLabelText("Hiện nghĩa"));
    expect(screen.queryByText(/xin chào/)).not.toBeInTheDocument();
  });
});

describe("WordDetail", () => {
  it("saves an edited Vietnamese meaning to storage", async () => {
    const storage = setup(<WordDetail id="你好" />);
    await userEvent.click(await screen.findByRole("button", { name: "Sửa nghĩa" }));
    const box = screen.getByLabelText("Nghĩa tiếng Việt");
    await userEvent.clear(box);
    await userEvent.type(box, "chào bạn");
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    await waitFor(async () => expect(await storage.getEdit("你好")).toEqual({ meaningVi: "chào bạn", reviewed: true }));
    expect(screen.getByText("chào bạn")).toBeInTheDocument();
  });

  it("explains when the word does not exist", async () => {
    setup(<WordDetail id="không-có" />);
    expect(await screen.findByText("Không tìm thấy từ này")).toBeInTheDocument();
  });
});
