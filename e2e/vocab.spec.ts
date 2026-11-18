import { expect, test } from "@playwright/test";

const SHOTS = "docs/features/study/phase1-foundation-vocab/screenshots";

test("TC-01: tìm một từ trong thư viện và mở chi tiết", async ({ page }, info) => {
  await page.goto("/vocab");
  const search = page.getByRole("searchbox", { name: "Tìm từ" });
  await expect(search).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/T-001.8-vocab-list-${info.project.name}.png` });

  await search.fill("zhong guo");
  const item = page.getByRole("link", { name: /中国/ }).first();
  await expect(item).toBeVisible();
  await item.click();

  await expect(page).toHaveURL(/\/vocab\/.+/);
  await expect(page.getByLabel(/Nghe phát âm 中国/)).toBeVisible();
  await expect(page.getByText("Trung Quốc").first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/T-001.8-vocab-detail-${info.project.name}.png` });
});

test("không có từ phù hợp thì hiện trạng thái trống thân thiện", async ({ page }) => {
  await page.goto("/vocab");
  await page.getByRole("searchbox", { name: "Tìm từ" }).fill("zzzzzz");
  await expect(page.getByText("Không tìm thấy từ phù hợp")).toBeVisible();
});
