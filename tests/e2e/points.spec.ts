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

async function signUpParent(page: Page) {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("Points Family");
  await page.getByLabel("Your name").fill("Pat");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByLabel(/parent or guardian/i).check();
  await page.getByRole("button", { name: /create family/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function addKid(page: Page, name: string) {
  await page.getByRole("link", { name: "Kids", exact: true }).click();
  await expect(page).toHaveURL(/\/manage\/kids$/);
  const add = page.getByRole("region", { name: /add a child/i });
  await add.getByLabel("Name").fill(name);
  await add.getByLabel("4-digit PIN").fill("4321");
  await add.getByRole("button", { name: /add child/i }).click();
  await expect(page.getByText(name)).toBeVisible();
}

async function addChore(page: Page, name: string, points: number) {
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "Chores", exact: true }).click();
  await expect(page).toHaveURL(/\/manage\/chores$/);
  const add = page.getByRole("region", { name: /add a chore/i });
  await add.getByLabel("Name").fill(name);
  await add.getByLabel("Points").fill(String(points));
  await add.getByRole("button", { name: /add chore/i }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
}

test.describe("points engine", () => {
  test("award a chore and custom points updates the balance", async ({
    page,
  }) => {
    await signUpParent(page);
    await addKid(page, "Kiddo");
    await addChore(page, "Made bed", 5);

    await page.goto("/dashboard");
    await expect(page.getByText("0 pts")).toBeVisible();

    // Open the kid's award screen.
    await page.getByRole("link", { name: /kiddo/i }).click();
    await expect(page).toHaveURL(/\/award\//);
    await expectNoA11yViolations(page, "/award");

    // One-tap chore award.
    await page.getByRole("button", { name: /made bed/i }).click();
    await expect(page.getByText("5 pts")).toBeVisible();

    // Custom award.
    await page.getByText("Award custom points").click();
    await page.getByLabel("Points").fill("3");
    await page.getByLabel("Reason").fill("Helped out");
    await page.getByRole("button", { name: /^award points$/i }).click();
    await expect(page.getByText("8 pts")).toBeVisible();
  });

  test("a negative adjustment can take the balance below zero", async ({
    page,
  }) => {
    await signUpParent(page);
    await addKid(page, "Kiddo");

    await page.goto("/dashboard");
    await page.getByRole("link", { name: /kiddo/i }).click();
    await expect(page).toHaveURL(/\/award\//);

    await page.getByText("Adjust points").click();
    await page.getByLabel("Amount").fill("-4");
    await page.getByLabel("Reason").fill("Penalty");
    await page.getByRole("button", { name: /apply adjustment/i }).click();
    await expect(page.getByText("-4 pts")).toBeVisible();
  });
});
