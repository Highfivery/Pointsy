import { test, expect, type Page } from "@playwright/test";
import { enterPin } from "./_helpers";
import AxeBuilder from "@axe-core/playwright";

function uniqueEmail() {
  return `parent.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function expectNoA11yViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations, `axe violations on ${label}`).toEqual([]);
}

const PASSWORD = "supersecret123";

async function signUpParent(page: Page): Promise<string> {
  const email = uniqueEmail();
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("Redeem Family");
  await page.getByLabel("Your name").fill("Pat");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByLabel(/parent or guardian/i).check();
  await page.getByRole("button", { name: /create family/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  return email;
}

async function familyCode(page: Page): Promise<string> {
  await page.goto("/dashboard");
  const code = (
    await page
      .getByText(/^[A-Z0-9]+-[A-Z0-9]+$/)
      .first()
      .textContent()
  )?.trim();
  return code ?? "";
}

test.describe("redemption loop", () => {
  test("kid requests a reward and a parent approves it", async ({ page }) => {
    test.setTimeout(120_000);

    const email = await signUpParent(page);
    await familyCode(page);

    // Add a kid.
    await page.goto("/manage/kids/new");
    let add = page.getByRole("region", { name: /add a child/i });
    await add.getByLabel("Name").fill("Kiddo");
    await add.getByLabel("4-digit PIN").fill("4321");
    await add.getByRole("button", { name: /add child/i }).click();
    await expect(page.getByText("Kiddo")).toBeVisible();

    // Add a reward.
    await page.goto("/manage/rewards/new");
    add = page.getByRole("region", { name: /add a reward/i });
    await add.getByLabel("Name").fill("Sticker");
    await add.getByLabel("Cost (points)").fill("5");
    await add.getByRole("button", { name: /add reward/i }).click();
    await expect(page.getByText("Sticker", { exact: true })).toBeVisible();

    // Award the kid 10 points.
    await page.goto("/dashboard");
    await page.getByRole("link", { name: /kiddo/i }).click();
    await expect(page).toHaveURL(/\/award\//);
    await page.getByText("Award custom points").click();
    const custom = page.locator("details", {
      has: page.getByText("Award custom points"),
    });
    await custom.getByLabel("Points").fill("10");
    await custom.getByLabel("Reason").fill("Great week");
    await custom.getByRole("button", { name: /^award points$/i }).click();
    await expect(page.getByText("10 pts")).toBeVisible();

    // Parent signs out.
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/$/);

    // Kid signs in and redeems (device remembers the family → picker directly).
    await page.goto("/enter");
    await page.getByRole("button", { name: /Kiddo/i }).click();
    await enterPin(page, "4321");
    await expect(page).toHaveURL(/\/me$/);

    // Navigate via the kid tab bar.
    await page.getByRole("link", { name: "Rewards", exact: true }).click();
    await expect(page).toHaveURL(/\/redeem$/);
    await expect(page).toHaveTitle(/redeem/i); // let the soft-nav title settle
    await expectNoA11yViolations(page, "/redeem");

    await page.getByRole("button", { name: /sticker/i }).click();
    // Confirm in the bottom sheet (guards against accidental taps).
    await page.getByRole("button", { name: /yes, request it/i }).click();
    await expect(page.getByText(/pending/i)).toBeVisible();

    // Kid signs out.
    await page.goto("/me");
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/$/); // wait for sign-out to complete

    // Parent signs in and approves.
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await expect(page.getByText(/Kiddo wants Sticker/i)).toBeVisible();
    await page
      .getByRole("button", { name: /approve sticker for kiddo/i })
      .click();

    // Moves to the awaiting-delivery queue; balance drops to 5.
    await expect(page.getByText(/awaiting delivery/i)).toBeVisible();
    await expect(page.getByText("5 pts", { exact: true })).toBeVisible();
  });
});
