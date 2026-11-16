#!/usr/bin/env node
/**
 * Cut a release locally (replaces the old GitHub Actions Changesets job).
 *
 * 1. Requires a clean tree on an up-to-date `main` with pending changesets.
 * 2. Runs `changeset version` to bump package.json and write CHANGELOG.md.
 * 3. Commits on a `release/vX.Y.Z` branch, pushes it, and opens a PR.
 *
 * Merge the PR and Vercel deploys `main`. Nothing is published to npm.
 */
import { execSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";

const run = (cmd, opts = {}) =>
  execSync(cmd, { stdio: "pipe", encoding: "utf8", ...opts }).trim();
const say = (msg) => console.log(`› ${msg}`);
const fail = (msg) => {
  console.error(`✖ ${msg}`);
  process.exit(1);
};

if (run("git status --porcelain")) fail("Commit or stash your changes first.");
if (run("git rev-parse --abbrev-ref HEAD") !== "main") {
  fail("Switch to main first (git switch main).");
}
run("git pull --ff-only");

const pending = readdirSync(".changeset").filter(
  (f) => f.endsWith(".md") && f !== "README.md",
);
if (pending.length === 0) fail("No pending changesets — nothing to release.");
say(`${pending.length} changeset(s): ${pending.join(", ")}`);

execSync("npx changeset version", { stdio: "inherit" });
const { version } = JSON.parse(readFileSync("package.json", "utf8"));
const branch = `release/v${version}`;

run(`git switch -c ${branch}`);
run("git add -A");
run(`git commit -m "chore(release): v${version}"`);
run(`git push -u origin ${branch}`);
say(`Pushed ${branch}`);

const url = run(
  `gh pr create --base main --head ${branch} --title "chore(release): v${version}" --body "Applies pending changesets: bumps to v${version} and updates CHANGELOG.md. Merge to release; Vercel deploys main."`,
);
say(`Release PR: ${url}`);
say("Merge it with: gh pr merge --squash --delete-branch " + url);
