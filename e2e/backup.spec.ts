import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

async function reviewOneCard(page: import("@playwright/test").Page) {
  await page.goto("/review");
  await page.getByRole("button", { name: /Lật thẻ/ }).click();
  await page.getByRole("button", { name: /Được/ }).click();
  await expect(page.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow", "0");
}

async function readyCount(page: import("@playwright/test").Page) {
  await page.goto("/");
  const text = await page.getByText(/\d+ thẻ/).first().innerText();
  return Number(/(\d+) thẻ/.exec(text)![1]);
}

test("TC-06: sao lưu rồi khôi phục đưa tiến độ về đúng trạng thái đã lưu", async ({ page }) => {
  await reviewOneCard(page);
  const atBackup = await readyCount(page);

  await page.goto("/settings");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Tải bản sao lưu" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^hsk4-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const file = await download.path();

  await reviewOneCard(page);
  expect(await readyCount(page)).toBe(atBackup - 1);

  await page.goto("/settings");
  page.once("dialog", (d) => d.accept());
  await page.locator("input[type=file]").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: readFileSync(file),
  });
  await page.waitForLoadState("load");
  expect(await readyCount(page)).toBe(atBackup);
});
