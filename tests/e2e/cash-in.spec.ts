import { test, expect, type Page } from "@playwright/test";
import { enterPin, expectNoA11yViolations } from "./_helpers";

function uniqueEmail() {
  return `cashin.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function setup(page: Page) {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("Cash Family");
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

  for (const [name, cost] of [
    ["Ice cream", 30],
    ["Bike ride", 500],
  ] as const) {
    await page.goto("/manage/rewards/new");
    const add = page.getByRole("region", { name: /add a reward/i });
    await add.getByLabel("Name").fill(name);
    await add.getByLabel(/cost/i).fill(String(cost));
    await add.getByRole("button", { name: /add reward/i }).click();
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  }

  // Give Robin 50 points.
  await page.goto("/dashboard");
  await page.getByRole("link", { name: /manage robin/i }).click();
  const panel = page.getByRole("region", { name: "Award or deduct points" });
  await panel.getByLabel("Points").fill("50");
  await panel.getByLabel("Reason").fill("Great week");
  await panel.getByRole("button", { name: /^award points$/i }).click();
  await expect(page.getByText(/points awarded/i)).toBeVisible();
}

test.describe("parent cash-in (#189)", () => {
  test("Deduct shows rewards; a parent cashes one in on the spot", async ({
    page,
  }) => {
    await setup(page);
    // The dashboard's Deduct link opens straight into Deduct mode.
    await page.goto("/dashboard");
    await page.getByRole("link", { name: /deduct points from robin/i }).click();
    await expect(page).toHaveURL(/mode=deduct/);
    const board = page.getByRole("region", { name: "Cash in a reward" });
    await expect(board).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Award a chore" }),
    ).toHaveCount(0);

    // Too expensive: stays focusable and says why.
    const bike = board.getByRole("button", {
      name: /bike ride.*needs 450 more/i,
    });
    await expect(bike).toHaveAttribute("aria-disabled", "true");
    await expectNoA11yViolations(page, "/award deduct mode with rewards");

    await board.getByRole("button", { name: /cash in ice cream/i }).click();
    const sheet = page.getByRole("dialog", {
      name: /cash in ice cream for robin/i,
    });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByLabel(/handing it over now/i)).toBeChecked();
    await expectNoA11yViolations(page, "cash-in confirm sheet");
    await sheet.getByRole("button", { name: /cash in for 30 points/i }).click();

    await expect(sheet).toBeHidden();
    await expect(page.getByText("Ice cream cashed in.")).toBeVisible();
    await expect(page.getByText("20 pts")).toBeVisible();

    // History names the reward, and it can be refunded.
    const recent = page.getByRole("region", { name: "Recent activity" });
    await expect(recent.getByText("Ice cream", { exact: true })).toBeVisible();
    await recent
      .getByRole("button", { name: /refund ice cream for robin/i })
      .click();
    await page.getByRole("button", { name: "Refund it" }).click();
    await expect(page.getByText("50 pts")).toBeVisible();
    await expect(recent.getByText(/refunded ·/i)).toBeVisible();

    // Nothing waits on the dashboard.
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: /awaiting delivery/i }),
    ).toHaveCount(0);
  });

  test("unticked, it goes to Awaiting delivery; the kid sees it", async ({
    page,
  }) => {
    await setup(page);
    await page.goto("/dashboard");
    await page.getByRole("link", { name: /manage robin/i }).click();
    // Award mode shows chores; switch to Deduct for rewards.
    await page.getByRole("button", { name: "Deduct", exact: true }).click();
    const board = page.getByRole("region", { name: "Cash in a reward" });
    await board.getByRole("button", { name: /cash in ice cream/i }).click();
    const sheet = page.getByRole("dialog", { name: /cash in ice cream/i });
    await sheet.getByLabel(/handing it over now/i).uncheck();
    await sheet.getByRole("button", { name: /cash in for 30 points/i }).click();
    await expect(page.getByText(/in awaiting delivery/i)).toBeVisible();

    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: /awaiting delivery/i }),
    ).toBeVisible();
    await expect(page.getByText(/robin · ice cream/i)).toBeVisible();

    // The kid's activity shows the reward by name.
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.getByRole("button", { name: /^Robin$/i }).click();
    await enterPin(page, "4321");
    await expect(page).toHaveURL(/\/me$/);
    await expect(
      page
        .getByRole("region", { name: "Recent" })
        .getByText("Ice cream", { exact: true }),
    ).toBeVisible();
  });
});

test("Also give to: each picked kid gets the reward, short kids are skipped", async ({
  page,
}) => {
  await setup(page); // Robin has 50
  // A second kid, Sky, with only 10 points, and a third, Max, with 40.
  for (const [name, pts] of [
    ["Sky", 10],
    ["Max", 40],
  ] as const) {
    await page.goto("/manage/kids/new");
    await page.getByLabel("Name").fill(name);
    await page.getByRole("radio", { name: "Dog", exact: true }).check();
    await page.getByLabel("4-digit PIN").fill("1111");
    await page.getByRole("button", { name: /add child/i }).click();
    await expect(page.getByText(name).first()).toBeVisible();
    await page.goto("/dashboard");
    await page
      .getByRole("link", { name: new RegExp(`manage ${name}`, "i") })
      .click();
    const panel = page.getByRole("region", { name: "Award or deduct points" });
    await panel.getByLabel("Points").fill(String(pts));
    await panel.getByLabel("Reason").fill("Seed");
    await panel.getByRole("button", { name: /^award points$/i }).click();
    await expect(page.getByText(/points awarded/i)).toBeVisible();
  }

  await page.goto("/dashboard");
  await page.getByRole("link", { name: /deduct points from robin/i }).click();
  await page.getByRole("button", { name: "Sky", exact: true }).click();
  await page.getByRole("button", { name: "Max", exact: true }).click();
  await expect(
    page.getByText(/points and rewards below apply to/i),
  ).toBeVisible();

  const board = page.getByRole("region", { name: "Cash in a reward" });
  const card = board.getByRole("button", {
    name: /cash in ice cream for 30 points each, 2 of 3 can have it/i,
  });
  await card.click();
  const sheet = page.getByRole("dialog", {
    name: /cash in ice cream for robin and max/i,
  });
  await expect(sheet.getByText(/skipped · needs 20 more/i)).toBeVisible();
  await expectNoA11yViolations(page, "cash-in sheet for several kids");
  await sheet.getByRole("button", { name: /30 points each/i }).click();
  await expect(sheet).toBeHidden();
  await expect(
    page.getByText(
      "Ice cream cashed in for Robin and Max. Skipped Sky (not enough points).",
    ),
  ).toBeVisible();

  await page.goto("/dashboard");
  for (const [name, pts] of [
    ["Robin", "20 pts"],
    ["Max", "10 pts"],
    ["Sky", "10 pts"],
  ]) {
    await expect(
      page.getByRole("link", { name: new RegExp(`manage ${name}`, "i") }),
    ).toContainText(pts);
  }
});
