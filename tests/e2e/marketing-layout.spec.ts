import { test, expect } from "@playwright/test";

/**
 * Layout guardrails for the public marketing surfaces. These would have caught
 * the "content runs to the edge" regression: we check every marketing page, at
 * several widths (including the awkward in-between ones), for horizontal
 * overflow — nothing should ever be wider than the viewport.
 */
const PAGES = [
  "/",
  "/about",
  "/compare",
  "/compare/greenlight",
  "/compare/busykid",
  "/compare/famzoo",
  "/tools/reward-calculator",
  "/tools/allowance-calculator",
  "/guides/age-appropriate-chores",
  "/guides/token-economy-for-kids",
  "/privacy",
  "/terms",
  "/sign-up",
  "/enter",
];

// Mobile, the header wrap-zone, common laptop, and the just-past-max-width case.
const WIDTHS = [360, 390, 900, 1024, 1160, 1440];

test.describe("marketing layout", () => {
  for (const width of WIDTHS) {
    for (const path of PAGES) {
      test(`no horizontal overflow at ${width}px on ${path}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path, { waitUntil: "networkidle" });
        const overflow = await page.evaluate(() => {
          const de = document.documentElement;
          return de.scrollWidth - de.clientWidth;
        });
        // A 1px rounding tolerance; anything more is a real overflow bug.
        expect(overflow, `overflowed by ${overflow}px`).toBeLessThanOrEqual(1);
      });
    }
  }
});
