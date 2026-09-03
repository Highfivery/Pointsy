import { expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/** WCAG 2.1 A/AA — the level Pointsy targets (see AGENTS.md). */
export const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21aa"];

/**
 * Wait for anything that would make axe sample a half-rendered page:
 *
 * - the App Router applies `<title>` *after* a soft navigation, so scanning
 *   too early reports a spurious `document-title` violation;
 * - entrance animations can leave a mid-fade colour on screen, which reads as
 *   a contrast failure.
 *
 * Animations that never finish (the skeleton's infinite pulse, anything
 * paused) are skipped, and the whole wait is capped, so a loading state can
 * never hang the scan.
 */
async function settle(page: Page) {
  await expect(page).toHaveTitle(/\S/);
  await page.evaluate(async () => {
    const finishing = document
      .getAnimations()
      .filter((a) =>
        Number.isFinite(a.effect?.getComputedTiming().endTime ?? Infinity),
      )
      .map((a) => a.finished.catch(() => undefined));
    await Promise.race([
      Promise.all(finishing),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  });
}

/**
 * Assert a screen has no WCAG A/AA violations. `label` names the screen in the
 * failure message. Every axe scan in the suite goes through here so the settle
 * above is never forgotten on a new one.
 */
export async function expectNoA11yViolations(page: Page, label: string) {
  await settle(page);
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(results.violations, `axe violations on ${label}`).toEqual([]);
}

/** Tap a PIN into the on-screen number pad (auto-submits on the last digit). */
export async function enterPin(page: Page, pin: string) {
  for (const digit of pin) {
    await page.getByRole("button", { name: digit, exact: true }).click();
  }
}

/** Create a chore through the dedicated editor page and return to the list. */
export async function addChore(
  page: Page,
  name: string,
  opts: {
    points?: number;
    category?: string;
    perDay?: number;
    core?: boolean;
  } = {},
) {
  await page.goto("/manage/chores");
  await page.getByRole("link", { name: /add a chore/i }).click();
  await page.waitForURL(/\/manage\/chores\/new$/);
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Points").fill(String(opts.points ?? 5));
  if (opts.core) {
    await page.getByLabel("Core chore").check();
  }
  if (opts.category) {
    // Categories are per-family rows now — pick by visible name.
    await page.getByLabel("Category").selectOption({ label: opts.category });
  }
  if (opts.perDay) {
    await page.getByLabel(/how often/i).selectOption("day");
    await page.getByLabel(/times per day/i).fill(String(opts.perDay));
  }
  await page.getByRole("button", { name: /save chore/i }).click();
  await page.waitForURL(/\/manage\/chores$/);
  await expect(page.getByText(name, { exact: true })).toBeVisible();
}
