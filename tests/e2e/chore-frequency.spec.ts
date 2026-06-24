import { test, expect } from "@playwright/test";

function uniqueEmail() {
  return `freq.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

// Issue #56: a chore set to "N per day" couldn't be changed back to Unlimited,
// because the add form and every edit card shared id="limitPeriod", so the edit
// form's label targeted the wrong (add-form) control.
test("a chore's frequency can be switched back to Unlimited (#56)", async ({
  page,
}) => {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("Freq Family");
  await page.getByLabel("Your name").fill("Pat");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByLabel(/parent or guardian/i).check();
  await page.getByRole("button", { name: /create family/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/manage/chores");
  const add = page.getByRole("region", { name: /add a chore/i });
  await add.getByLabel("Name").fill("Brush teeth");
  await add.getByLabel("Points").fill("5");
  await add.getByLabel(/how often/i).selectOption("day");
  await add.getByLabel(/times per day/i).fill("3");
  await add.getByRole("button", { name: /add chore/i }).click();
  await expect(page.getByText("Brush teeth", { exact: true })).toBeVisible();

  const card = page.getByRole("region", { name: /manage brush teeth/i });
  await expect(card.getByText("3× per day")).toBeVisible(); // the limit chip
  await card.getByText("Edit", { exact: true }).click();

  // The edit form's OWN "How often" control resolves via its label (unique id).
  await expect(card.getByLabel(/times per day/i)).toBeVisible();
  await card.getByLabel(/how often/i).selectOption("none");
  await expect(card.getByLabel(/times per day/i)).toHaveCount(0);

  await card.getByRole("button", { name: /save changes/i }).click();
  await expect(card.getByText("Saved.")).toBeVisible();
  // The chore is now unlimited — the "3× per day" chip is gone.
  await expect(card.getByText("3× per day")).toHaveCount(0);
});
