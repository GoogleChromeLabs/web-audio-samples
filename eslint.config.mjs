import js from "@eslint/js";

// You may need to run `npm install -D globals` if this package is missing.
import globals from "globals";

export default [
  {
    ignores: [
      "_site/**/*.wasm.js",
      "_site/**/*.wasmmodule.js",
      "_site/archive/",
      "_site/**/build/*",
      "_site/**/coi-serviceworker.js"
    ]
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        ...globals.browser
      }
    },
    rules: {
      "require-jsdoc": "off",
      // Note: We dropped eslint-config-google because it is deprecated 
      // and not directly compatible with ESLint flat config.
    }
  }
];
