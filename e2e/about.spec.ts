import { expect, test } from "@playwright/test";

test("trang Giấy phép và nguồn ghi đủ các nguồn dữ liệu", async ({ page }) => {
  await page.goto("/about");
  for (const name of ["complete-hsk-vocabulary", "CVDICT", "OpenCidian", "CC-CEDICT", "Hanzi Writer", "Arphic"]) {
    await expect(page.getByText(name).first()).toBeVisible();
  }
  await expect(page.getByText("CC BY-SA 4.0").first()).toBeVisible();
});

test("manifest PWA có sẵn", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBe(true);
  expect((await res.json()).name).toContain("HSK4");
});
