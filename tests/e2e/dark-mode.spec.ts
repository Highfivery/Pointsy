import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Verify the dark-mode design tokens meet WCAG AAA on the public pages
// (light mode is covered by the other specs).
test.use({ colorScheme: "dark" });

const PAGES = ["/", "/sign-up", "/sign-in", "/enter"];

test.describe("dark mode accessibility", () => {
  for (const path of PAGES) {
    test(`${path} has no A/AA/AAA violations in dark mode`, async ({
      page,
    }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag2aaa"])
        .analyze();
      expect(results.violations, `dark-mode axe on ${path}`).toEqual([]);
    });
  }
});
