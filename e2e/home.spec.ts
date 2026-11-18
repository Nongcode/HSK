import { expect, test } from "@playwright/test";

test("trang chủ hiện số thẻ cần ôn và dẫn vào phiên ôn", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.getByText(/thẻ/).first()).toBeVisible();
  const start = page.getByRole("link", { name: "Bắt đầu ôn" });
  await expect(start).toHaveAttribute("href", "/review");
  await page.screenshot({
    path: `docs/features/study/phase1-foundation-vocab/screenshots/T-001.10-home-${info.project.name}.png`,
  });
  await page.getByRole("link", { name: "Thư viện từ" }).click();
  await expect(page).toHaveURL(/\/vocab$/);
});
