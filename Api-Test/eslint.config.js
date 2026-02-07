import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: ["node_modules/**", "prisma/migrations/**", "coverage/**", "dist/**"]
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.node },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-empty": ["error", { allowEmptyCatch: true }]
    }
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: { globals: { ...globals.node, ...globals.jest } }
  },
  {
    files: ["src/public/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        SwaggerUIBundle: "readonly",
        SwaggerUIStandalonePreset: "readonly"
      }
    }
  }
]);
