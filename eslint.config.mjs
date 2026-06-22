import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";
import eslintConfigPrettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Accessibility: apply the strict ruleset's RULES on top of the jsx-a11y
  // plugin already registered by eslint-config-next (don't re-register the
  // plugin), then tighten toward our WCAG 2.1 AAA target (SPEC §9.3).
  {
    rules: {
      ...jsxA11y.flatConfigs.strict.rules,
      "jsx-a11y/no-autofocus": "error",
      "jsx-a11y/lang": "error",
      "jsx-a11y/html-has-lang": "error",
      "jsx-a11y/no-aria-hidden-on-focusable": "error",
      "jsx-a11y/prefer-tag-over-role": "warn",
      "jsx-a11y/control-has-associated-label": "error",
    },
  },

  // Tests may use looser typing helpers.
  {
    files: ["**/*.test.{ts,tsx}", "tests/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Keep Prettier last so formatting rules never conflict with lint rules.
  eslintConfigPrettier,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "drizzle/**",
    "public/sw.js",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
