import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

function uniqueEmail() {
  return `home.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function signUp(page: Page) {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("Picker Family");
  await page.getByLabel("Your name").fill("Robin");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByLabel(/parent or guardian/i).check();
  await page.getByRole("button", { name: /create family/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("a brand-new device sees the marketing home", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /points that make chores fun/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /create your family/i }),
  ).toBeVisible();
});

test("a known device shows the PIN-gated profile picker at / — never marketing", async ({
  page,
}) => {
  await signUp(page); // associates this device with the family (cookie)

  // Give the parent a PIN so they appear in the picker.
  await page.getByText(/set a sign-in pin for yourself/i).click();
  await page.getByLabel(/4-digit PIN/i).fill("4321");
  await page.getByRole("button", { name: /^set pin$/i }).click();
  await expect(page.getByText("PIN saved.")).toBeVisible();
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);

  // Home is the picker — not marketing, not a password form.
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /who.?s signing in/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Robin/i })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /create your family/i }),
  ).toHaveCount(0);

  // No WCAG violations on the picker home.
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag2aaa"])
    .analyze();
  expect(results.violations).toEqual([]);

  // A PIN is required to reach a dashboard.
  await page.getByRole("button", { name: /Robin/i }).click();
  await expect(page.getByLabel(/enter your pin/i)).toBeVisible();
  await page.getByLabel(/enter your pin/i).fill("4321");
  await page.getByRole("button", { name: /let.?s go/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("the picker offers a parent email + password fallback", async ({
  page,
}) => {
  await signUp(page); // parent has no PIN yet
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/");
  await expect(
    page.getByRole("link", { name: /sign in with email/i }).first(),
  ).toBeVisible();
});
