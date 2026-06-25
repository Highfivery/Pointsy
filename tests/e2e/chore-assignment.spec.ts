import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { enterPin } from "./_helpers";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag2aaa"];
async function expectNoA11yViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(results.violations, `axe violations on ${label}`).toEqual([]);
}

function uniqueEmail() {
  return `assign.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function signUp(page: Page) {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("Assign Family");
  await page.getByLabel("Your name").fill("Pat");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByLabel(/parent or guardian/i).check();
  await page.getByRole("button", { name: /create family/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function addKid(page: Page, name: string) {
  await page.goto("/manage/kids");
  const add = page.getByRole("region", { name: /add a child/i });
  await add.getByLabel("Name").fill(name);
  await add.getByLabel("4-digit PIN").fill("4321");
  await add.getByRole("button", { name: /add child/i }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
}

test("a rotating chore is locked for whoever isn't up", async ({ page }) => {
  await signUp(page);
  await addKid(page, "Robin");
  await addKid(page, "Sky");

  // Create a rotating chore (Robin → Sky) in the editor.
  await page.goto("/manage/chores");
  await page.getByRole("link", { name: /add a chore/i }).click();
  await page.waitForURL(/\/manage\/chores\/new$/);
  await page.getByLabel("Name").fill("Dishes");
  await page.getByLabel("Points").fill("5");
  await page.getByRole("radio", { name: /take turns/i }).check();
  await page.getByRole("checkbox", { name: "Robin" }).check();
  await page.getByRole("checkbox", { name: "Sky" }).check();
  await expectNoA11yViolations(page, "/manage/chores/new");
  await page.getByRole("button", { name: /save chore/i }).click();
  await page.waitForURL(/\/manage\/chores$/);

  // The overview shows whose turn it is.
  await expect(page.getByText("Robin's turn")).toBeVisible();
  await expectNoA11yViolations(page, "/manage/chores");

  // Sign in as Sky — Dishes shows but is locked ("Robin's turn").
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("button", { name: /sky/i }).click();
  await page.getByText("Enter your PIN").waitFor();
  await enterPin(page, "4321");
  await expect(page).toHaveURL(/\/me$/);

  await page.goto("/submit");
  // The chore is shown as a locked card (not a tappable button) with the reason.
  await expect(page.getByText("Dishes", { exact: true })).toBeVisible();
  await expect(page.getByText("Robin's turn")).toBeVisible();
  await expect(page.getByRole("button", { name: /dishes/i })).toHaveCount(0);
});
