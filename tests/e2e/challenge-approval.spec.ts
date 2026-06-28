import { test, expect, type Page } from "@playwright/test";

function uniqueEmail() {
  return `chapprove.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function signUp(page: Page) {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("Approve Family");
  await page.getByLabel("Your name").fill("Pat");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByLabel(/parent or guardian/i).check();
  await page.getByRole("button", { name: /create family/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("a parent-confirm challenge waits for approval, then pays the bonus", async ({
  page,
}) => {
  await signUp(page);
  await page.goto("/manage/kids/new");
  const add = page.getByRole("region", { name: /add a child/i });
  await add.getByLabel("Name").fill("Robin");
  await add.getByLabel("4-digit PIN").fill("4321");
  await add.getByRole("button", { name: /add child/i }).click();
  await expect(page.getByText("Robin", { exact: true })).toBeVisible();

  // Challenge that needs the parent to confirm the bonus.
  await page.goto("/manage/challenges/new");
  await page.getByLabel("Name").fill("Confirm me");
  await page.getByLabel("Points to earn").fill("10");
  await page.getByLabel(/bonus points/i).fill("50");
  await page.getByLabel(/hold the bonus until i approve it/i).check();
  await page.getByRole("button", { name: /save challenge/i }).click();
  await expect(page).toHaveURL(/\/manage\/challenges$/);

  // Award Robin enough to complete it — the bonus is held, not paid.
  await page.goto("/dashboard");
  await page.getByRole("link", { name: /manage robin/i }).click();
  const custom = page.getByRole("region", { name: "Award or deduct points" });
  await custom.getByLabel("Points").fill("10");
  await custom.getByLabel("Reason").fill("Allowance");
  await custom.getByRole("button", { name: /^award points$/i }).click();
  await expect(page.getByText("10 pts")).toBeVisible();

  // It shows up as a challenge approval; approving pays the +50.
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: /challenge approvals/i }),
  ).toBeVisible();
  await expect(page.getByText(/robin finished confirm me/i)).toBeVisible();
  await page
    .getByRole("button", { name: /approve confirm me for robin/i })
    .click();
  await expect(page.getByText("60 pts")).toBeVisible(); // 10 + 50 bonus
  await expect(page.getByText(/challenge approvals/i)).toHaveCount(0);
});
