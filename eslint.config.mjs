import { defineConfig } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  {
    extends: compat.extends(
      "eslint:recommended",
      "plugin:@typescript-eslint/eslint-recommended",
      "plugin:@typescript-eslint/recommended"
    ),

    plugins: {
      "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
      parser: tsParser,
    },

    ignores: ["**/*.ts"],

    rules: {
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/dot-notation": "off",

      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "enumMember",
          format: null,
        },
      ],

      "@typescript-eslint/no-inferrable-types": [
        "off",
        {
          ignoreParameters: true,
          ignoreProperties: true,
        },
      ],

      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-var-requires": "off",
      "no-console": "off",
      "no-shadow": "off",
      "no-underscore-dangle": "off",
      "no-constant-condition": "off",
      "no-useless-escape": "off",
      "prefer-arrow/prefer-arrow-functions": "off",
      "no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
      "prefer-const": "error",
    },
  },
  {
    files: ["babel.config.js", "jest.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        __dirname: "readonly",
      },
    },
  },
]);
