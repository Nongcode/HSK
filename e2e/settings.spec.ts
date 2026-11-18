import { expect, test } from "@playwright/test";

test("đổi chuẩn HSK, đổi chủ đề và báo lỗi khi khôi phục tệp sai", async ({ page }, info) => {
  await page.goto("/settings");
  await page.getByLabel("HSK 3.0").click();
  await expect(page.getByLabel("HSK 3.0")).toBeChecked();
  await page.getByLabel("Chủ đề").selectOption("dark");
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.reload();
  await expect(page.getByLabel("HSK 3.0")).toBeChecked();

  page.once("dialog", (d) => d.accept());
  await page.locator("input[type=file]").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from("{}"),
  });
  await expect(page.getByRole("status")).toContainText("không hợp lệ");
  await page.screenshot({
    path: `docs/features/study/phase1-foundation-vocab/screenshots/T-001.11-settings-${info.project.name}.png`,
    fullPage: true,
  });
});
