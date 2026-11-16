import { test, expect, type Page } from "@playwright/test";
import { enterPin, expectNoA11yViolations } from "./_helpers";

function uniqueEmail() {
  return `ms.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function signUpWithKid(page: Page) {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("Milestone Family");
  await page.getByLabel("Your name").fill("Pat");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByLabel(/parent or guardian/i).check();
  await page.getByRole("button", { name: /create family/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/manage/kids/new");
  await page.getByLabel("Name").fill("Robin");
  await page.getByRole("radio", { name: "Cat", exact: true }).check();
  await page.getByLabel("4-digit PIN").fill("4321");
  await page.getByRole("button", { name: /add child/i }).click();
  await expect(page.getByText("Robin")).toBeVisible();
}

async function awardCustom(page: Page, points: number, reason: string) {
  await page.goto("/dashboard");
  await page.getByRole("link", { name: /manage robin/i }).click();
  await expect(page).toHaveURL(/\/award\//);
  const panel = page.getByRole("region", { name: "Award or deduct points" });
  await panel.getByLabel("Points").fill(String(points));
  await panel.getByLabel("Reason").fill(reason);
  await panel.getByRole("button", { name: /^award points$/i }).click();
  await expect(page.getByText(/points awarded/i)).toBeVisible();
}

test.describe("milestones (#181)", () => {
  test("a parent sets a milestone, a kid reaches it, and the parent hands it out", async ({
    page,
  }) => {
    await signUpWithKid(page);

    // Reach Milestones from the Challenges screen.
    await page.goto("/manage/challenges");
    await page.getByRole("link", { name: "Milestones" }).click();
    await expect(page).toHaveURL(/\/manage\/milestones$/);
    await expectNoA11yViolations(page, "/manage/milestones (empty)");

    await page.getByRole("link", { name: /add a milestone/i }).click();
    await expect(page).toHaveURL(/\/manage\/milestones\/new$/);
    await page.getByLabel("Name").fill("Super saver");
    await page.getByLabel("Reward").fill("A trip to the zoo");
    await page.getByLabel("Points earned").fill("50");
    await expectNoA11yViolations(page, "/manage/milestones/new");
    await page.getByRole("button", { name: /save milestone/i }).click();
    await expect(page).toHaveURL(/\/manage\/milestones$/);
    await expect(page.getByText("Super saver")).toBeVisible();
    await expectNoA11yViolations(page, "/manage/milestones (populated)");

    // Earn 30, then spend nothing yet: not reached.
    await awardCustom(page, 30, "Tidied room");
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: /milestone rewards to hand out/i }),
    ).toHaveCount(0);

    // Earn 20 more → reached; it shows on the dashboard.
    await awardCustom(page, 20, "Walked the dog");
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: /milestone rewards to hand out/i }),
    ).toBeVisible();
    await expect(page.getByText("Robin · A trip to the zoo")).toBeVisible();
    await expectNoA11yViolations(page, "/dashboard with a milestone reward");

    // The kid sees their lifetime total and the reward waiting.
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.getByRole("button", { name: /^Robin$/i }).click();
    await enterPin(page, "4321");
    await expect(page).toHaveURL(/\/me$/);
    const section = page.getByRole("region", { name: "Milestones" });
    await expect(section.getByText(/points earned ever/i)).toContainText("50");
    await expect(
      section.getByText(/a grown-up will hand it out/i),
    ).toBeVisible();
    await expectNoA11yViolations(page, "/me with milestones");

    // A kid can't open the parent milestone screens.
    await page.goto("/manage/milestones");
    await expect(page).toHaveURL(/\/me$/);
  });

  test("the editor locks points after a milestone is reached", async ({
    page,
  }) => {
    await signUpWithKid(page);
    await page.goto("/manage/milestones/new");
    await page.getByLabel("Name").fill("First steps");
    await page.getByLabel("Reward").fill("Pizza night");
    await page.getByLabel("Points earned").fill("10");
    await page.getByRole("radio", { name: "Every time" }).check();
    await page.getByRole("button", { name: /save milestone/i }).click();
    await expect(page).toHaveURL(/\/manage\/milestones$/);

    await awardCustom(page, 25, "Great week");

    await page.goto("/dashboard");
    // Repeatable: 25 points at every 10 → reached twice.
    await expect(page.getByText("Robin · Pizza night")).toHaveCount(2);
    await page
      .getByRole("button", { name: /mark pizza night as delivered to robin/i })
      .first()
      .click();
    await expect(page.getByText("Robin · Pizza night")).toHaveCount(1);

    await page.goto("/manage/milestones");
    await expect(page.getByText(/reached 2×/i)).toBeVisible();
    await page.getByRole("link", { name: /first steps/i }).click();
    await expect(
      page.getByText(/points and repeat setting are locked/i),
    ).toBeVisible();
    await expect(page.getByLabel("Points earned")).toBeDisabled();
    await expectNoA11yViolations(page, "/manage/milestones/[id] locked");
  });
});
