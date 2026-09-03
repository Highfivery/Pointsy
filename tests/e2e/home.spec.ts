import { test, expect } from "@playwright/test";
import { expectNoA11yViolations } from "./_helpers";

test.describe("landing page", () => {
  test("renders the hero", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("has no WCAG A/AA violations", async ({ page }) => {
    await page.goto("/");
    await expectNoA11yViolations(page, "/");
  });
});
