import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { addChore, enterPin } from "./_helpers";

function uniqueEmail() {
  return `parent.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21aa"];

async function signUpParent(page: Page) {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("Cat Family");
  await page.getByLabel("Your name").fill("Pat");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByLabel(/parent or guardian/i).check();
  await page.getByRole("button", { name: /create family/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe("custom chore categories", () => {
  test("a parent adds a category, groups a chore under it, then reassigns on delete", async ({
    page,
  }) => {
    await signUpParent(page);

    // Reach categories from the Chores screen.
    await page.goto("/manage/chores");
    await page.getByRole("link", { name: /categories/i }).click();
    await expect(page).toHaveURL(/\/manage\/categories$/);
    await expect(
      page.getByRole("heading", { name: "Categories" }),
    ).toBeVisible();
    // Seeded defaults are present.
    await expect(page.getByText("Bedroom", { exact: true })).toBeVisible();

    // No accessibility violations on the management screen.
    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations).toEqual([]);

    // Add a custom category.
    await page.getByText("Add a category").click();
    const addForm = page.locator("details", {
      has: page.getByText("Add a category"),
    });
    await addForm.getByLabel("Name").fill("Garage");
    await addForm.getByRole("button", { name: /^add category$/i }).click();
    await expect(page.getByText("Garage", { exact: true })).toBeVisible();

    // A chore can be filed under the new category, and groups under it.
    await addChore(page, "Tidy the garage", { points: 4, category: "Garage" });
    await expect(page.getByRole("heading", { name: "Garage" })).toBeVisible();
    await expect(page.getByText("Tidy the garage")).toBeVisible();

    // Deleting a non-empty category reassigns its chores, never orphaning them.
    await page.goto("/manage/categories");
    await page.locator('summary[aria-label="Delete Garage"]').click();
    await page.getByLabel("Move chores to").selectOption({ label: "Bedroom" });
    await page.getByRole("button", { name: /move chores & delete/i }).click();

    await expect(page.getByText("Garage", { exact: true })).toHaveCount(0);
    // The chore survived the move — now under Bedroom on the chores screen.
    await page.goto("/manage/chores");
    await expect(page.getByText("Tidy the garage")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Garage" })).toHaveCount(0);
  });

  test("a kid cannot reach the categories manager", async ({ page }) => {
    await signUpParent(page);
    // Give the parent a PIN and add a kid, then sign in as the kid.
    await page.goto("/manage/kids/new");
    const add = page.getByRole("region", { name: /add a child/i });
    await add.getByLabel("Name").fill("Robin");
    await add.getByLabel("4-digit PIN").fill("4321");
    await add.getByRole("button", { name: /add child/i }).click();
    await expect(page.getByText("Robin")).toBeVisible();

    await page.goto("/dashboard");
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/enter");
    await page.getByRole("button", { name: /Robin/i }).click();
    await enterPin(page, "4321");
    await expect(page).toHaveURL(/\/me$/);

    // A kid hitting the parent route directly is redirected away.
    await page.goto("/manage/categories");
    await expect(page).toHaveURL(/\/me$/);
  });
});
