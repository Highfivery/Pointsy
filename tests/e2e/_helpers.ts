import { expect, type Page } from "@playwright/test";

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
    await page.getByLabel("Category").selectOption(opts.category);
  }
  if (opts.perDay) {
    await page.getByLabel(/how often/i).selectOption("day");
    await page.getByLabel(/times per day/i).fill(String(opts.perDay));
  }
  await page.getByRole("button", { name: /save chore/i }).click();
  await page.waitForURL(/\/manage\/chores$/);
  await expect(page.getByText(name, { exact: true })).toBeVisible();
}
