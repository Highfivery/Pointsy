/**
 * Conventional Commits — drives Changesets/SemVer and keeps history readable.
 * Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci,
 * chore, revert.
 */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Allow long lines in the body/footer (URLs, co-author trailers, context).
    "body-max-line-length": [0, "always"],
    "footer-max-line-length": [0, "always"],
  },
};

export default config;
