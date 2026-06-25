import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { addChore } from "./_helpers";

function uniqueEmail() {
  return `parent.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21aa"];
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

test.describe("chore & reward catalog", () => {
  test("parent creates, reorders, and hides chores", async ({ page }) => {
    await signUpParent(page);
    await addChore(page, "Made bed", { points: 5 });
    await expectNoA11yViolations(page, "/manage/chores");
    await addChore(page, "Dishes", { points: 10 });

    // Both chores list as rows that link into the editor.
    const rows = page.locator('ul a[href^="/manage/chores/"]');
    await expect(rows.first()).toContainText("Made bed");

    // Reorder: move the first chore down.
    await page.getByRole("button", { name: /move made bed down/i }).click();
    await expect(rows.first()).toContainText("Dishes");

    // Hide via the editor.
    await page
      .getByRole("link", { name: /made bed/i })
      .first()
      .click();
    await page.waitForURL(/\/manage\/chores\/[0-9a-f-]+$/);
    await page.getByRole("button", { name: /hide from kids/i }).click();
    await expect(
      page.getByRole("button", { name: /show to kids/i }),
    ).toBeVisible();
  });

  test("parent creates a reward with a description", async ({ page }) => {
    await signUpParent(page);
    await page.goto("/manage/rewards/new");
    await expectNoA11yViolations(page, "/manage/rewards/new");

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
