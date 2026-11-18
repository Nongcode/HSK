import { expect, test } from "@playwright/test";

test("trang Giấy phép và nguồn ghi đủ các nguồn dữ liệu", async ({ page }) => {
  await page.goto("/about");
  for (const name of ["complete-hsk-vocabulary", "CVDICT", "OpenCidian", "CC-CEDICT", "Hanzi Writer", "Arphic", "Tatoeba"]) {
    await expect(page.getByText(name).first()).toBeVisible();
  }
  await expect(page.getByText("CC BY-SA 4.0").first()).toBeVisible();
  await expect(page.getByText("CC BY 2.0 FR").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Tatoeba/ })).toHaveAttribute("href", "https://tatoeba.org");
});

test("manifest PWA có sẵn", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBe(true);
  expect((await res.json()).name).toContain("HSK4");
});
