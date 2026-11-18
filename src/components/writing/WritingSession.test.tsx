import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/lib/app-context";
import { newCard } from "@/lib/srs/sm2";
import { MemoryStorage } from "@/lib/storage/memory-storage";
import type { Rule, Sentence } from "@/lib/writing/schema";
import { cardIdFor } from "@/lib/writing/session";
import { WritingSession } from "./WritingSession";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const mk = (id: string, chunks: string[]): Sentence => ({
  id,
  chunks,
  accepted: [chunks.map((_, i) => i)],
  pinyin: `py-${id}`,
  meaningVi: `nghĩa-${id}`,
  pattern: "S + V + O",
  ruleId: "adv",
  mistakes: [],
  difficulty: 1,
  reviewed: false,
});
const rules: Rule[] = [
  {
    id: "adv",
    title: "Trạng ngữ",
    summary: "Trạng ngữ đứng trước động từ.",
    explanation: "x",
    examples: [],
    tag: "adverbial-before-verb",
  },
];
const s1 = mk("s1", ["我", "喜欢", "电影"]);
const s2 = mk("s2", ["他", "在家", "休息"]);

let storage: MemoryStorage;
const onExit = vi.fn();
beforeEach(() => {
  storage = new MemoryStorage();
  onExit.mockClear();
});

function setup(sentences: Sentence[], mode: "practice" | "wrong" = "practice") {
  const user = userEvent.setup();
  render(
    <AppProvider load={async () => ({ storage, isEphemeral: false })}>
      <WritingSession mode={mode} onExit={onExit} sentences={sentences} rules={rules} />
    </AppProvider>,
  );
  return user;
}

const tray = () => screen.getByRole("group", { name: "Các cụm từ" });
const place = async (user: ReturnType<typeof userEvent.setup>, chunks: string[]) => {
  for (const c of chunks) await user.click(within(tray()).getByRole("button", { name: new RegExp(c) }));
};

describe("WritingSession", () => {
  it("correct order + Enter shows 'Chính xác' and stores an ok attempt", async () => {
    const user = setup([s1]);
    await screen.findByText("nghĩa-s1");
    await place(user, ["我", "喜欢", "电影"]);
    await user.keyboard("{Enter}");
    expect(await screen.findByText("Chính xác")).toBeTruthy();
    expect(await storage.listAttempts()).toMatchObject([{ sentenceId: "s1", ok: true, tag: null }]);
    expect(await storage.getCard(cardIdFor("s1"))).toBeUndefined();
  });

  it("wrong order shows the answer, the error label, the rule link and creates a card", async () => {
    const user = setup([s1]);
    await screen.findByText("nghĩa-s1");
    await place(user, ["电影", "喜欢", "我"]);
    await user.click(screen.getByRole("button", { name: /Kiểm tra/ }));
    expect(await screen.findByText(/Chưa đúng — Trạng ngữ đứng trước động từ/)).toBeTruthy();
    expect(screen.getByText("我喜欢电影")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Xem bài quy tắc" }).getAttribute("href")).toBe("/writing/rules/adv");
    expect(await storage.getCard(cardIdFor("s1"))).toMatchObject({ lapses: 1 });
  });

  it("flagging a sentence is saved once even when clicked twice", async () => {
    const user = setup([s1]);
    await screen.findByText("nghĩa-s1");
    await place(user, ["电影", "喜欢", "我"]);
    await user.click(screen.getByRole("button", { name: /Kiểm tra/ }));
    const btn = await screen.findByRole("button", { name: "Câu này có vẻ sai" });
    await user.click(btn);
    await waitFor(async () => expect((await storage.getSettings()).flaggedSentences).toEqual(["s1"]));
    const done = screen.getByRole("button", { name: "Đã đánh dấu câu này" });
    await user.click(done);
    expect((await storage.getSettings()).flaggedSentences).toEqual(["s1"]);
  });

  it("finishing the queue shows the summary and no further sentence", async () => {
    const user = setup([s1]);
    await screen.findByText("nghĩa-s1");
    await place(user, ["我", "喜欢", "电影"]);
    await user.keyboard("{Enter}");
    await screen.findByText("Chính xác");
    await user.keyboard("{Enter}");
    expect(await screen.findByText("Hoàn thành phiên luyện")).toBeTruthy();
    expect(screen.queryByRole("group", { name: "Các cụm từ" })).toBeNull();
  });

  it("an empty bank shows a friendly empty state with a link back", async () => {
    setup([]);
    expect(await screen.findByText("Chưa có câu nào để luyện.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Về trang luyện viết" }).getAttribute("href")).toBe("/writing");
  });

  it("wrong mode contains only sentences whose card is due, and has its own empty state", async () => {
    await storage.putCard({ ...newCard(cardIdFor("s2"), Date.now()), due: Date.now() - 1000 });
    setup([s1, s2], "wrong");
    expect(await screen.findByText("nghĩa-s2")).toBeTruthy();
    expect(screen.queryByText("nghĩa-s1")).toBeNull();
  });

  it("wrong mode with nothing due shows the 'no wrong sentences' state", async () => {
    setup([s1], "wrong");
    expect(await screen.findByText("Hôm nay không có câu sai nào cần ôn.")).toBeTruthy();
  });

  it("a failed save shows an alert and the learner can check again", async () => {
    const user = setup([s1]);
    await screen.findByText("nghĩa-s1");
    const put = vi.spyOn(storage, "addAttempt").mockRejectedValueOnce(new Error("disk"));
    await place(user, ["我", "喜欢", "电影"]);
    await user.click(screen.getByRole("button", { name: /Kiểm tra/ }));
    expect((await screen.findByRole("alert")).textContent).toContain("Không lưu được");
    await user.click(screen.getByRole("button", { name: /Kiểm tra/ }));
    expect(await screen.findByText("Chính xác")).toBeTruthy();
    expect(put).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("Enter on the focused rule link does not skip to the next sentence", async () => {
    const user = setup([s1]);
    await screen.findByText("nghĩa-s1");
    await place(user, ["电影", "喜欢", "我"]);
    await user.click(screen.getByRole("button", { name: /Kiểm tra/ }));
    screen.getByRole("link", { name: "Xem bài quy tắc" }).focus();
    await user.keyboard("{Enter}");
    expect(screen.queryByText("Hoàn thành phiên luyện")).toBeNull();
    expect(screen.getByText(/Chưa đúng/)).toBeTruthy();
  });
});
