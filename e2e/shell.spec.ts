import { expect, test } from "@playwright/test";

test("trang chủ có điều hướng chính và mục Luyện viết dẫn tới /writing", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Điều hướng chính" });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link", { name: "Từ vựng" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Cài đặt" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Luyện viết" })).toHaveAttribute("href", "/writing");
});
