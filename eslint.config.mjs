// eslint.config.mjs
import globals from "globals";
import js from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

function trimGlobalKeys(globalsObj) {
  const trimmed = {};
  if (globalsObj) {
    for (const key in globalsObj) {
      trimmed[key.trim()] = globalsObj[key];
    }
  }
  return trimmed;
}

export default [
  {
    ignores: [
      "node_modules/",
      "dist/",
      "build/",
      "coverage/",
      "scripts/",
      "**/*.test.js",
      "**/*.config.js",
      ".vscode/",
      ".idx/",
      "eslint.config.mjs" // Corrected ignore for the config file itself
    ]
  },
  js.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...trimGlobalKeys(globals.browser),
        ...trimGlobalKeys(globals.webextensions),
        chrome: "readonly",
        PromptFinder: "writable",
        PnP: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-console": "off"
    }
  }
];
