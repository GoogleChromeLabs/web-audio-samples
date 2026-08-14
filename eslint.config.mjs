import js from "@eslint/js";

// You may need to run `npm install -D globals` if this package is missing.
import globals from "globals";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "_site/**",
      "dist/**",
      "playwright-report/**",
      "test-results/**",
      "src/rainfly/**",
      "src/archive/**",
      "src/**/build/**",
      "src/**/third-party/**",
      "src/**/lib/**",
      "src/**/*.wasm.js",
      "src/**/*.wasmmodule.js",
      "src/**/coi-serviceworker.js",
      "src/demos/**",
      "src/tests/**"
    ]
  },
  js.configs.recommended,
  {
    linterOptions: {
      reportUnusedDisableDirectives: "off"
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        AudioWorkletGlobalScope: "readonly",
        AudioWorkletProcessor: "readonly",
        registerProcessor: "readonly",
        currentFrame: "readonly",
        currentTime: "readonly",
        sampleRate: "readonly",
        GPUBufferUsage: "readonly",
        GPUMapMode: "readonly",
      }
    },
    rules: {
      "require-jsdoc": "off",
      "no-useless-assignment": "off",
      "no-redeclare": ["error", { "builtinGlobals": false }],
      "no-unused-private-class-members": "off",
      "no-unused-vars": [
        "error",
        {
          "args": "none",
          "vars": "local",
          "varsIgnorePattern": "^.*$",
          "caughtErrors": "none"
        }
      ]
    }
  }
];
