import { test, expect } from "@playwright/test";
import { addChore } from "./_helpers";

function uniqueEmail() {
  return `freq.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

// Issue #56: a chore set to "N per day" must be changeable back to Unlimited.
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

  await addChore(page, "Brush teeth", { points: 5, perDay: 3 });
  await expect(page.getByText("3× per day")).toBeVisible(); // the limit chip

  // Open the editor and switch the frequency back to Unlimited.
  await page
    .getByRole("link", { name: /brush teeth/i })
    .first()
    .click();
  await page.waitForURL(/\/manage\/chores\/[0-9a-f-]+$/);
  await expect(page.getByLabel(/times per day/i)).toBeVisible();
  await page.getByLabel(/how often/i).selectOption("none");
  await expect(page.getByLabel(/times per day/i)).toHaveCount(0);

  await page.getByRole("button", { name: /save chore/i }).click();
  await page.waitForURL(/\/manage\/chores$/);
  // Now unlimited — no frequency chip on the row.
  await expect(page.getByText("3× per day")).toHaveCount(0);
});
