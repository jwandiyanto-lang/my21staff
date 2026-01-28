import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Catch variables used before declaration (prevents "Cannot access before initialization" errors)
      '@typescript-eslint/no-use-before-define': ['error', {
        variables: true,
        functions: false, // Allow function hoisting
        classes: true,
        allowNamedExports: false,
      }],
    },
  },
]);

export default eslintConfig;
