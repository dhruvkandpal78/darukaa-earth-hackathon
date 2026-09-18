/** Shared code checks catch mistakes before commits and deployment. */
import js from "@eslint/js";
import ts from "typescript-eslint";
import globals from "globals";
import hooks from "eslint-plugin-react-hooks";
export default ts.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      ".venv/**",
      "output/**",
      ".npm-cache/**",
      ".python-cache/**",
      "pytest-cache-files-*/**",
      "tmp/**",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": hooks },
    rules: { ...hooks.configs.recommended.rules },
  },
);
