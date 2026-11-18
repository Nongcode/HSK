import { expect, test } from "@playwright/test";

const SHOTS = "docs/features/study/phase1-foundation-vocab/screenshots";

test("TC-02 + TC-05: ôn thẻ bằng phím tắt trong chế độ tập trung", async ({ page }, info) => {
  await page.goto("/review");

  const progress = page.getByRole("progressbar", { name: "Tiến độ phiên" });
  await expect(progress).toHaveAttribute("aria-valuenow", "0");
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await page.screenshot({ path: `${SHOTS}/T-001.9-review-front-${info.project.name}.png` });

  await page.keyboard.press("Space");
  await expect(page.getByRole("group", { name: "Chấm mức nhớ" })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/T-001.9-review-back-${info.project.name}.png` });

  await page.keyboard.press("3");
  await expect(progress).not.toHaveAttribute("aria-valuenow", "0");
  await expect(page.getByRole("group", { name: "Chấm mức nhớ" })).toBeHidden();

  await page.keyboard.press("Escape");
  await expect(page).toHaveURL("/");
});

test("chạm vào nút cũng ôn được (không cần bàn phím)", async ({ page }) => {
  await page.goto("/review");
  await page.getByRole("button", { name: /Lật thẻ/ }).click();
  await page.getByRole("button", { name: /Được/ }).click();
  await expect(page.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow", "0");
});
