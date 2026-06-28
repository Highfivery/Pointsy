import { test, expect, type Page } from "@playwright/test";
import { addChore, enterPin } from "./_helpers";

function uniqueEmail() {
  return `parent.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function signUpParent(page: Page) {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("MustDo Family");
  await page.getByLabel("Your name").fill("Pat");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByLabel(/parent or guardian/i).check();
  await page.getByRole("button", { name: /create family/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("a kid logs a must-do from the dashboard, after confirming", async ({
  page,
}) => {
  await signUpParent(page);
  await page.goto("/manage/kids/new");
  const add = page.getByRole("region", { name: /add a child/i });
  await add.getByLabel("Name").fill("Robin");
  await add.getByLabel("4-digit PIN").fill("4321");
  await add.getByRole("button", { name: /add child/i }).click();
  await expect(page.getByText("Robin")).toBeVisible();

  await addChore(page, "Brush teeth", { points: 3, core: true });

  // Kid signs in.
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/");
  await page.getByRole("button", { name: /robin/i }).click();
  await enterPin(page, "4321");
  await expect(page).toHaveURL(/\/me$/);

  // The must-do is a tappable button ("Brush teeth +3" — not the waiting-list
  // "Cancel Brush teeth", which this start-anchored name won't match).
  const mustDo = page.getByRole("button", { name: /^brush teeth/i });
  await expect(mustDo).toBeVisible();

  // Tapping shows a confirmation — it does NOT log right away.
  await mustDo.click();
  await expect(page.getByText(/did you finish brush teeth/i)).toBeVisible();
  await expect(page.getByText(/waiting for approval/i)).toHaveCount(0);

  // "Not yet" closes without logging.
  await page.getByRole("button", { name: /not yet/i }).click();
  await expect(page.getByText(/did you finish brush teeth/i)).toBeHidden();
  await expect(page.getByText(/waiting for approval/i)).toHaveCount(0);

  // Confirming logs it: it moves to "Waiting for approval" and leaves the list.
  await mustDo.click();
  await page.getByRole("button", { name: /yes, i did it/i }).click();
  await expect(
    page.getByRole("heading", { name: /waiting for approval/i }),
  ).toBeVisible();
  // The must-do button is gone (only the waiting-list "Cancel Brush teeth"
  // remains, which the start-anchored name doesn't match).
  await expect(page.getByRole("button", { name: /^brush teeth/i })).toHaveCount(
    0,
  );
});
