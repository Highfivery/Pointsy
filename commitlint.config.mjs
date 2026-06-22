/**
 * Conventional Commits — drives Changesets/SemVer and keeps history readable.
 * Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci,
 * chore, revert.
 */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-max-line-length": [0, "always"],
  },
};

export default config;
