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
  await page.getByLabel("Family name").fill("Catalog Family");
  await page.getByLabel("Your name").fill("Pat");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByLabel(/parent or guardian/i).check();
  await page.getByRole("button", { name: /create family/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/** Names of the catalog item cards, in display order. */
async function itemOrder(page: Page): Promise<string[]> {
  return page.getByRole("region").evaluateAll((els) =>
    els
      .map((e) => e.getAttribute("aria-label") ?? "")
      .filter((l) => l.startsWith("Manage "))
      .map((l) => l.replace("Manage ", "")),
  );
}

test.describe("chore & reward catalog", () => {
  test("parent creates, reorders, and hides chores", async ({ page }) => {
    await signUpParent(page);
    await page.getByRole("link", { name: /^chores$/i }).click();
    await expect(page).toHaveURL(/\/manage\/chores$/);
    await expectNoA11yViolations(page, "/manage/chores");

    const add = page.getByRole("region", { name: /add a chore/i });
    await add.getByLabel("Name").fill("Made bed");
    await add.getByRole("radio", { name: "Make bed", exact: true }).check();
    await add.getByLabel("Points").fill("5");
    await add.getByRole("button", { name: /add chore/i }).click();
    await expect(page.getByText("Made bed", { exact: true })).toBeVisible();
    await expect(page.getByText("5 pts")).toBeVisible();

    await add.getByLabel("Name").fill("Dishes");
    await add.getByLabel("Points").fill("10");
    await add.getByRole("button", { name: /add chore/i }).click();
    await expect(page.getByText("Dishes", { exact: true })).toBeVisible();
    expect(await itemOrder(page)).toEqual(["Made bed", "Dishes"]);

    // Reorder: move the first chore down.
    await page.getByRole("button", { name: /move made bed down/i }).click();
    await expect.poll(() => itemOrder(page)).toEqual(["Dishes", "Made bed"]);

    // Hide a chore.
    const madeBed = page.getByRole("region", { name: /manage made bed/i });
    await madeBed.getByRole("button", { name: /^hide$/i }).click();
    await expect(madeBed.getByText(/hidden/i)).toBeVisible();
  });

  test("parent creates a reward with a description", async ({ page }) => {
    await signUpParent(page);
    await page.getByRole("link", { name: /^rewards$/i }).click();
    await expect(page).toHaveURL(/\/manage\/rewards$/);
    await expectNoA11yViolations(page, "/manage/rewards");

    const add = page.getByRole("region", { name: /add a reward/i });
    await add.getByLabel("Name").fill("Screen time");
    await add.getByRole("radio", { name: "TV time", exact: true }).check();
    await add.getByLabel("Cost (points)").fill("30");
    await add.getByLabel(/description/i).fill("30 minutes");
    await add.getByRole("button", { name: /add reward/i }).click();

    await expect(page.getByText("Screen time", { exact: true })).toBeVisible();
    await expect(page.getByText("30 pts")).toBeVisible();
    await expect(page.getByText("30 minutes")).toBeVisible();
  });
});
