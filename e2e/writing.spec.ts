import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const SHOTS = "docs/features/study/phase2-writing-practice/screenshots";

interface Sentence {
  id: string;
  chunks: string[];
  meaningVi: string;
}
const sentences: Sentence[] = JSON.parse(readFileSync("src/content/writing/sentences.json", "utf8"));

const tray = (page: Page) => page.getByRole("group", { name: "Các cụm từ" });

/** The sentence currently on screen, found by its Vietnamese meaning. */
async function currentSentence(page: Page): Promise<Sentence> {
  await expect(tray(page)).toBeVisible();
  const texts = await page.locator("main p.text-lg").allInnerTexts();
  const found = sentences.find((s) => texts.includes(s.meaningVi));
  if (!found) throw new Error(`Không nhận ra câu: ${texts.join(" | ")}`);
  return found;
}

async function tapInOrder(page: Page, chunks: string[]) {
  for (const c of chunks) await tray(page).getByRole("button", { name: c }).click();
}

async function keysInOrder(page: Page, chunks: string[]) {
  for (const c of chunks) {
    const labels = (await tray(page).getByRole("button").allInnerTexts()).map((t) =>
      t.replace(/^\d+\s*/, "").trim(),
    );
    await page.keyboard.press(String(labels.indexOf(c) + 1));
  }
}

async function answerWrong(page: Page): Promise<Sentence> {
  const s = await currentSentence(page);
  await keysInOrder(page, [...s.chunks].reverse());
  await page.keyboard.press("Enter");
  await expect(page.getByText(/Chưa đúng/)).toBeVisible();
  return s;
}

async function totalMistakes(page: Page) {
  await page.goto("/writing/mistakes");
  await expect(page.getByRole("heading", { name: "Lỗi hay mắc" })).toBeVisible();
  const counts = await page.locator("li strong").allInnerTexts();
  return counts.reduce((sum, c) => sum + Number(c), 0);
}

test("TC-10 + TC-14: xếp đúng bằng chạm, Enter chấm, Esc thoát, không có thanh điều hướng", async ({ page }, info) => {
  await page.goto("/writing/practice");
  const s = await currentSentence(page);
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await page.screenshot({ path: `${SHOTS}/T-002.11-practice-start-${info.project.name}.png` });

  await tapInOrder(page, s.chunks);
  await page.keyboard.press("Enter");
  await expect(page.getByText("Chính xác")).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/T-002.11-practice-correct-${info.project.name}.png` });

  await page.keyboard.press("Escape");
  await expect(page).toHaveURL("/writing", { timeout: 20_000 });
});

test("TC-11: xếp sai bằng bàn phím hiện đáp án đúng, nhãn lỗi và liên kết quy tắc", async ({ page }, info) => {
  await page.goto("/writing/practice");
  const s = await answerWrong(page);
  await expect(page.getByText(s.chunks.join(""), { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Xem bài quy tắc" })).toHaveAttribute("href", /\/writing\/rules\/.+/);
  await page.screenshot({ path: `${SHOTS}/T-002.11-practice-wrong-${info.project.name}.png` });

  await page.getByRole("button", { name: "Câu này có vẻ sai" }).click();
  await expect(page.getByRole("button", { name: "Đã đánh dấu câu này" })).toBeDisabled();
});

test("TC-12: câu vừa sai xuất hiện ở mục Ôn câu sai", async ({ page }) => {
  await page.goto("/writing/practice");
  const s = await answerWrong(page);

  await page.goto("/writing");
  const link = page.getByRole("link", { name: /Ôn câu sai/ });
  await expect(link).toContainText("1 câu");
  await link.click();
  await expect(page).toHaveURL(/mode=wrong/);
  expect((await currentSentence(page)).id).toBe(s.id);
});

test("TC-13: khôi phục bản sao lưu đưa thống kê lỗi về đúng lúc sao lưu", async ({ page }) => {
  await page.goto("/writing/practice");
  await answerWrong(page);
  const atBackup = await totalMistakes(page);
  expect(atBackup).toBe(1);

  await page.goto("/settings");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Tải bản sao lưu" }).click(),
  ]);
  const file = await download.path();

  await page.goto("/writing/practice");
  await answerWrong(page);
  expect(await totalMistakes(page)).toBe(2);

  await page.goto("/settings");
  page.once("dialog", (d) => d.accept());
  await page.locator("input[type=file]").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: readFileSync(file),
  });
  await page.waitForLoadState("load");
  expect(await totalMistakes(page)).toBe(atBackup);
});

test("kéo thả: đổi vị trí hai cụm trong dòng đáp án bằng chuột", async ({ page, isMobile }) => {
  test.skip(isMobile, "kéo bằng chuột chỉ kiểm trên desktop");
  await page.goto("/writing/practice");
  const s = await currentSentence(page);
  await tapInOrder(page, s.chunks);
  const answer = page.getByRole("list", { name: "Câu của bạn" });
  const first = answer.getByRole("button").nth(0);
  const last = answer.getByRole("button").nth(s.chunks.length - 1);
  const a = (await first.boundingBox())!;
  const b = (await last.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 });
  await page.mouse.up();
  const after = (await answer.getByRole("button").allInnerTexts()).map((t) => t.trim());
  expect(after[after.length - 1]).toBe(s.chunks[0]);
  expect(after[0]).toBe(s.chunks[1]);
});

test("ảnh giao diện sáng/tối: trang luyện viết, quy tắc, lỗi hay mắc", async ({ page }, info) => {
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/writing");
    await expect(page.getByRole("heading", { name: "Luyện viết" })).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/T-002.11-hub-${scheme}-${info.project.name}.png`, fullPage: true });

    await page.goto("/writing/rules/ba");
    await expect(page.getByRole("heading", { name: "Câu chữ 把" })).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/T-002.11-rule-${scheme}-${info.project.name}.png`, fullPage: true });
  }

  await page.goto("/writing/practice");
  await answerWrong(page);
  await page.goto("/writing/mistakes");
  await expect(page.getByRole("img").first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/T-002.11-mistakes-${info.project.name}.png`, fullPage: true });
});

test("quy tắc không tồn tại hiện trạng thái không tìm thấy", async ({ page }) => {
  await page.goto("/writing/rules/khong-co");
  await expect(page.getByText("Không tìm thấy bài quy tắc này.")).toBeVisible();
});
