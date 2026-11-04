import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import noRawStateChangingFetch from "./scripts/eslint-rules/no-raw-state-changing-fetch.js";
import noInterPoppinsImport from "./scripts/eslint-rules/no-inter-poppins-import.js";
import noHardcodedBrandColors from "./scripts/eslint-rules/no-hardcoded-brand-colors.js";
import requireLanguageGuard from "./scripts/eslint-rules/require-language-guard.js";
import noBusinessRedirectInPage from "./scripts/eslint-rules/no-business-redirect-in-page.js";

const localRules = {
  "no-raw-state-changing-fetch": noRawStateChangingFetch,
  "no-inter-poppins-import": noInterPoppinsImport,
  "no-hardcoded-brand-colors": noHardcodedBrandColors,
  "require-language-guard": requireLanguageGuard,
  "no-business-redirect-in-page": noBusinessRedirectInPage,
};

const localPlugin = {
  rules: localRules,
};

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "scripts/**/*.js",
      ".journey-test-reports/**",
      ".claude/worktrees/**",
      ".claude/tmp/**",
      // Generated docx build artifacts (gitignored Node scripts, not app code)
      "**/.docx-build/**",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      local: localPlugin,
    },
    rules: {
      "local/no-raw-state-changing-fetch": "error",
      "local/no-inter-poppins-import": "warn",
      "local/no-hardcoded-brand-colors": "warn",
      "local/no-business-redirect-in-page": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      // SSR safety: prevent module-level imports of browser-only libraries
      // These must be dynamically imported: const { x } = await import('lib')
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "html-to-image",
              message:
                "html-to-image is browser-only. Use dynamic import: const { toPng } = await import('html-to-image')",
            },
            {
              name: "html2canvas",
              message:
                "html2canvas is browser-only. Use dynamic import: const html2canvas = (await import('html2canvas')).default",
            },
            {
              name: "canvas-confetti",
              message:
                "canvas-confetti is browser-only. Use dynamic import inside useEffect or event handlers.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["lib/**/*.ts", "app/**/*.ts", "app/**/*.tsx"],
    ignores: [
      "**/__tests__/**",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
      "**/*.d.ts",
    ],
    plugins: {
      local: localPlugin,
    },
    rules: {
      "local/require-language-guard": "error",
    },
  },
  {
    // Test files legitimately use `any` for mocking — suppress warnings
    files: [
      "**/__tests__/**/*.{ts,tsx}",
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
