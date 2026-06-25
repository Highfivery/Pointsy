import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Verify the design tokens meet WCAG AA on the public pages.
// (Pointsy is dark-only, so every spec renders dark; this pins the public ones.)
test.use({ colorScheme: "dark" });

const PAGES = ["/", "/sign-up", "/sign-in", "/enter"];

test.describe("dark mode accessibility", () => {
  for (const path of PAGES) {
    test(`${path} has no A/AA violations in dark mode`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(results.violations, `dark-mode axe on ${path}`).toEqual([]);
    });
  }
});
