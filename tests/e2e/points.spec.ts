import { test, expect, type Page } from "@playwright/test";
import { addChore, expectNoA11yViolations } from "./_helpers";

function uniqueEmail() {
  return `parent.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
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
  await page.goto("/manage/kids/new");
  const add = page.getByRole("region", { name: /add a child/i });
  await add.getByLabel("Name").fill(name);
  await add.getByLabel("4-digit PIN").fill("4321");
  await add.getByRole("button", { name: /add child/i }).click();
  await expect(page.getByText(name)).toBeVisible();
}

test.describe("points engine", () => {
  test("award a chore and custom points updates the balance", async ({
    page,
  }) => {
    await signUpParent(page);
    await addKid(page, "Kiddo");
    await addChore(page, "Made bed", { points: 5 });

    await page.goto("/dashboard");
    await expect(page.getByText("0 pts")).toBeVisible();

    // Open the kid's award screen.
    await page.getByRole("link", { name: /manage kiddo/i }).click();
    await expect(page).toHaveURL(/\/award\//);
    await expectNoA11yViolations(page, "/award");

    // One-tap chore award.
    await page.getByRole("button", { name: /made bed/i }).click();
    await expect(page.getByText("5 pts")).toBeVisible();

    // Custom award (Award is the default direction).
    const custom = page.getByRole("region", { name: "Award or deduct points" });
    await custom.getByLabel("Points").fill("3");
    await custom.getByLabel("Reason").fill("Helped out");
    await custom.getByRole("button", { name: /^award points$/i }).click();
    await expect(page.getByText("8 pts")).toBeVisible();
  });

  test('"also give to" applies custom points to every picked kid', async ({
    page,
  }) => {
    await signUpParent(page);
    await addKid(page, "Robin");
    await addKid(page, "Andy");

    await page.goto("/dashboard");
    await page.getByRole("link", { name: /manage robin/i }).click();
    await expect(page).toHaveURL(/\/award\//);

    // The picker sits above the custom form and applies to it (issue #159).
    await page.getByRole("button", { name: /^andy$/i }).click();
    await expect(
      page.getByText(/points and chores below apply to robin and andy/i),
    ).toBeVisible();
    await expectNoA11yViolations(page, "/award with an extra recipient");

    const panel = page.getByRole("region", { name: "Award or deduct points" });
    await panel.getByLabel("Points").fill("7");
    await panel.getByLabel("Reason").fill("Tidied together");
    await panel
      .getByRole("button", { name: /^award to robin and andy$/i })
      .click();
    await expect(
      page.getByText(/points awarded to robin and andy/i),
    ).toBeVisible();

    // Both kids got it, not just the one whose screen this is.
    await page.goto("/dashboard");
    await expect(page.getByText("7 pts")).toHaveCount(2);
  });

  test("deducting points can take the balance below zero", async ({ page }) => {
    await signUpParent(page);
    await addKid(page, "Kiddo");

    await page.goto("/dashboard");
    await page.getByRole("link", { name: /manage kiddo/i }).click();
    await expect(page).toHaveURL(/\/award\//);

    const panel = page.getByRole("region", { name: "Award or deduct points" });
    // Switch to the Deduct direction, then enter a plain positive amount.
    await panel.getByRole("button", { name: /^deduct$/i }).click();
    await panel.getByLabel("Points").fill("4");
    await panel.getByLabel("Reason").fill("Penalty");
    await panel.getByRole("button", { name: /^deduct points$/i }).click();
    await expect(page.getByText("-4 pts")).toBeVisible();
  });
});
