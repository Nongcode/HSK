import { test } from "@playwright/test";

const SHOTS = "docs/features/study/phase1-foundation-vocab/screenshots";
const PAGES = [
  ["home", "/"],
  ["vocab", "/vocab"],
  ["about", "/about"],
] as const;

for (const theme of ["light", "dark"] as const) {
  test(`ảnh các màn hình chính (${theme})`, async ({ page }, info) => {
    await page.emulateMedia({ colorScheme: theme });
    for (const [name, url] of PAGES) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      await page.screenshot({ path: `${SHOTS}/T-001.12-${name}-${theme}-${info.project.name}.png` });
    }
  });
}
