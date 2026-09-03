import { test } from "@playwright/test";
import { expectNoA11yViolations } from "./_helpers";

// Verify the design tokens meet WCAG AA on the public pages.
// (Pointsy is dark-only, so every spec renders dark; this pins the public ones.)
test.use({ colorScheme: "dark" });

const PAGES = ["/", "/sign-up", "/sign-in", "/enter"];

test.describe("dark mode accessibility", () => {
  for (const path of PAGES) {
    test(`${path} has no A/AA violations in dark mode`, async ({ page }) => {
      await page.goto(path);
      await expectNoA11yViolations(page, `${path} (dark mode)`);
    });
  }
});
