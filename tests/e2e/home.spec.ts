import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("landing page", () => {
  test("renders the hero", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("has no WCAG A/AA/AAA violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag2aaa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
