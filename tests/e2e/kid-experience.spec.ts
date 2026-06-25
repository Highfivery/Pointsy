import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { enterPin, addChore } from "./_helpers";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21aa"];
async function expectNoA11yViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(results.violations, `axe violations on ${label}`).toEqual([]);
}

function uniqueEmail() {
  return `kidexp.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function signUp(page: Page) {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("Kid Exp Family");
  await page.getByLabel("Your name").fill("Pat");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByLabel(/parent or guardian/i).check();
  await page.getByRole("button", { name: /create family/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("kid tab bar navigates and core progress updates as chores are logged", async ({
  page,
}) => {
  await signUp(page);
  await page.goto("/manage/kids/new");
  const add = page.getByRole("region", { name: /add a child/i });
  await add.getByLabel("Name").fill("Robin");
  await add.getByLabel("4-digit PIN").fill("4321");
  await add.getByRole("button", { name: /add child/i }).click();
  await expect(page.getByText("Robin", { exact: true })).toBeVisible();

  await addChore(page, "Brush teeth", { points: 5, core: true, perDay: 1 });
  await addChore(page, "Tidy room", { points: 3 });

  // Sign in as Robin (device remembers the family → picker).
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("button", { name: /robin/i }).click();
  await enterPin(page, "4321");
  await expect(page).toHaveURL(/\/me$/);

  // Home shows today's must-dos with the core chore still to do (0 of 1).
  await expect(
    page.getByRole("heading", { name: /today.s must-dos/i }),
  ).toBeVisible();
  await expect(
    page.getByText("0 of 1 must-do chores done today"),
  ).toBeVisible();
  await expectNoA11yViolations(page, "/me");

  // Tab bar → Chores.
  await page.getByRole("link", { name: "Chores", exact: true }).click();
  await expect(page).toHaveURL(/\/submit$/);
  await expect(page.getByRole("heading", { name: "My chores" })).toBeVisible();
  await expectNoA11yViolations(page, "/submit");

  // Log the core chore — logging redirects home with a celebration, and the
  // ring is now complete.
  await page.getByRole("button", { name: /brush teeth/i }).click();
  await expect(page).toHaveURL(/\/me$/);
  await expect(
    page.getByRole("heading", { name: /all done today/i }),
  ).toBeVisible();
  await expect(
    page.getByText("1 of 1 must-do chores done today"),
  ).toBeVisible();

  // Back on Chores, the logged chore shows as a "Done today" card.
  await page.getByRole("link", { name: "Chores", exact: true }).click();
  await expect(page).toHaveURL(/\/submit$/);
  await expect(page.getByText("Done today")).toBeVisible();

  // Tab bar → Rewards.
  await page.getByRole("link", { name: "Rewards", exact: true }).click();
  await expect(page).toHaveURL(/\/redeem$/);
  await expect(page.getByRole("heading", { name: "Rewards" })).toBeVisible();
  await expectNoA11yViolations(page, "/redeem");
});
