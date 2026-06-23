import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

function uniqueEmail() {
  return `parent.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag2aaa"];
async function expectNoA11yViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(results.violations, `axe violations on ${label}`).toEqual([]);
}

/** Sign up a fresh parent and return the family join code from the dashboard. */
async function signUpParent(page: Page): Promise<string> {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("Kidtest Family");
  await page.getByLabel("Your name").fill("Pat");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByLabel(/parent or guardian/i).check();
  await page.getByRole("button", { name: /create family/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const code = (
    await page
      .getByText(/^[A-Z0-9]+-[A-Z0-9]+$/)
      .first()
      .textContent()
  )?.trim();
  expect(code).toBeTruthy();
  return code as string;
}

async function addKid(page: Page, name: string, pin: string) {
  await page.getByRole("link", { name: /^kids$/i }).click();
  await expect(page).toHaveURL(/\/manage\/kids$/);
  await page.getByLabel("Name").fill(name);
  await page.getByRole("radio", { name: "Cat", exact: true }).check();
  await page.getByLabel("4-digit PIN").fill(pin);
  await page.getByRole("button", { name: /add child/i }).click();
  await expect(page.getByText(name)).toBeVisible();
}

async function signOut(page: Page) {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe("kids & PIN auth", () => {
  test("parent adds a kid; kid signs in with their PIN", async ({ page }) => {
    const code = await signUpParent(page);
    await expectNoA11yViolations(page, "/manage/kids (before add)");

    await addKid(page, "Kiddo", "4321");
    await signOut(page);

    // Kid signs in via the profile picker.
    await page.goto("/enter");
    await page.getByLabel("Family code").fill(code);
    await page.getByRole("button", { name: /continue/i }).click();

    await expect(page.getByRole("button", { name: /Kiddo/i })).toBeVisible();
    await expectNoA11yViolations(page, "/enter picker");

    await page.getByRole("button", { name: /Kiddo/i }).click();
    await page.getByLabel(/enter your pin/i).fill("4321");
    await page.getByRole("button", { name: /let.?s go/i }).click();

    await expect(page).toHaveURL(/\/me$/);
    await expect(
      page.getByRole("heading", { name: /Hi Kiddo/i }),
    ).toBeVisible();
    await expectNoA11yViolations(page, "/me");
  });

  test("a wrong PIN is rejected", async ({ page }) => {
    const code = await signUpParent(page);
    await addKid(page, "Kiddo", "4321");
    await signOut(page);

    await page.goto("/enter");
    await page.getByLabel("Family code").fill(code);
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByRole("button", { name: /Kiddo/i }).click();
    await page.getByLabel(/enter your pin/i).fill("0000");
    await page.getByRole("button", { name: /let.?s go/i }).click();

    await expect(page.getByText(/isn.?t right|try/i)).toBeVisible();
    await expect(page).toHaveURL(/\/enter$/);
  });

  test("an unknown family code shows an error", async ({ page }) => {
    await page.goto("/enter");
    await page.getByLabel("Family code").fill("NOPE-XYZ");
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByText(/couldn.?t find a family/i)).toBeVisible();
  });
});
