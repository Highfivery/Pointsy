import { test, expect, type Page } from "@playwright/test";
import { enterPin } from "./_helpers";

function uniqueEmail() {
  return `subtask.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function signUp(page: Page) {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("Subtask Family");
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

test("a checklist chore can only be logged once every step is ticked (#64)", async ({
  page,
}) => {
  await signUp(page);
  await addKid(page, "Robin");

  // Create a chore with a 2-step checklist in the editor.
  await page.goto("/manage/chores");
  await page.getByRole("link", { name: /add a chore/i }).click();
  await page.waitForURL(/\/manage\/chores\/new$/);
  await page.getByLabel("Name").fill("Bathroom");
  await page.getByLabel("Points").fill("10");
  await page.getByRole("button", { name: /add a step/i }).click();
  await page.getByLabel("Step 1", { exact: true }).fill("Wipe counters");
  await page.getByRole("button", { name: /add a step/i }).click();
  await page.getByLabel("Step 2", { exact: true }).fill("Clean mirror");
  await page.getByRole("button", { name: /save chore/i }).click();
  await page.waitForURL(/\/manage\/chores$/);

  // Sign in as Robin.
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("button", { name: /robin/i }).click();
  await page.getByText("Enter your PIN").waitFor();
  await enterPin(page, "4321");
  await expect(page).toHaveURL(/\/me$/);

  // Expand the chore — logging is blocked until every step is ticked.
  await page.goto("/submit");
  await page.getByRole("button", { name: /bathroom/i }).click();
  await expect(
    page.getByRole("button", { name: /tick all 2 steps/i }),
  ).toBeDisabled();

  await page.getByRole("checkbox", { name: "Wipe counters" }).check();
  await page.getByRole("checkbox", { name: "Clean mirror" }).check();

  const logIt = page.getByRole("button", { name: /log it/i });
  await expect(logIt).toBeEnabled();
  await logIt.click();

  // Logged → back on the kid home, waiting for approval.
  await expect(page).toHaveURL(/\/me$/);
  await expect(page.getByText("Bathroom")).toBeVisible();
});
