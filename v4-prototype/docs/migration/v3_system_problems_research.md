# V3 System Problems and Technical Debt Analysis

## Executive Summary

While **v3.x** of `web-audio-samples` modernized individual components (such
as upgrading to Eleventy 3, Tailwind CSS v4, and ESLint v10), the overall
system exhibits significant architectural fragmentation, decoupled build
pipelines, testing blindspots, and accumulated legacy debt.

This document identifies and categorizes the core problems in the current
system to inform the design and architecture of **V4**.

---

## 1. SSG & Templating Fragmentation

### 1.1 Multi-Engine Inconsistency
- The site mixes **Nunjucks (`.njk`)**, **Liquid (`.html`)**, and raw HTML
  across different sections without clear boundaries.
- Landing pages and category indexes use Nunjucks layouts
  ([src/_includes/base.njk](file:///Users/hongchan/a/web-audio-samples/src/_includes/base.njk)),
  while many interactive samples under `src/demos/` and `src/tests/` are raw
  HTML/Liquid files that bypass the shared site shell, navigation, and
  typography.

### 1.2 Brittle Passthrough File Copying
- [.eleventy.js](file:///Users/hongchan/a/web-audio-samples/.eleventy.js) maintains
  over 30 distinct, hardcoded passthrough globs (e.g.,
  `src/demos/**/*.wav`, `src/sounds/fx/**/*.mp3`, `src/library/**.js`).
- Adding a new sample directory, audio file format, or asset type requires
  manually editing the build config, leading to frequent missing-asset bugs on
  deployment.

### 1.3 Disconnected Data Layer
- Metadata in `src/_data/` (`landing_data.yaml`, `audioworklet_data.yaml`, etc.)
  is manually maintained and decoupled from the actual source files and demos.
- There is no automated schema validation for YAML entries, risking broken
  links, missing metadata, or outdated descriptions when demos are moved or
  renamed.

---

## 2. Build Pipeline & Subproject Decoupling

### 2.1 The "Rainfly" Island
- [src/rainfly/](file:///Users/hongchan/a/web-audio-samples/src/rainfly/) is a
  nested SvelteKit + Vite application with its own `package.json`, dependencies,
  and build process.
- The root `npm run build` script **does not invoke the Rainfly build**.
- Rainfly uses a custom `postbuild` shell script that executes
  `mkdir -p ../../_site/rainfly && cp -r build/* ../../_site/rainfly/`, which
  bypasses Eleventy's lifecycle and cleanup hooks.
- Dependencies in Rainfly are outdated (Svelte 4, Tailwind v3, Vite 5) compared
  to the root workspace (Tailwind v4).

### 2.2 Unbundled Styling & Parallel Watchers
- CSS compilation is decoupled from the static site generator. Tailwind v4 is
  invoked via `@tailwindcss/cli` as a standalone process.
- Local development relies on `npm-run-all -p` running two separate watchers
  (`start:css` and `start:eleventy`), which can cause race conditions during
  initial site generation or live reloading.

---

## 3. Codebase Inconsistencies & Legacy Debt

### 3.1 Untyped Core Libraries
- Core audio utilities ([src/library/](file:///Users/hongchan/a/web-audio-samples/src/library/))
  and lock-free concurrency structures
  ([src/lib/free-queue/](file:///Users/hongchan/a/web-audio-samples/src/lib/free-queue/))
  are written in untyped vanilla JavaScript without TypeScript type definitions
  (`.d.ts`).
- Consumers and demo authors lack compiler safety, parameter validation, and
  IDE autocomplete for critical audio buffer operations.

### 3.2 Broad Linter Exclusions
- [eslint.config.mjs](file:///Users/hongchan/a/web-audio-samples/eslint.config.mjs)
  ignores significant portions of the repository:
  - `src/demos/**` (unlinted)
  - `src/tests/**` (unlinted)
  - `src/archive/**` (unlinted)
  - `src/rainfly/**` (unlinted)
- As a result, code quality and style standards are only enforced on a small
  subset of the repository.

### 3.3 Scattered Audio & Static Assets
- Audio assets are scattered without a unified directory convention:
  - `src/sounds/drum-samples/`
  - `src/sounds/fx/`
  - `src/sounds/hyper-reality/`
  - `src/sounds/impulse-responses/`
  - `src/demos/mld-drum-sampler/`
  - `src/demos/shiny-drum-machine/`
- Multiple duplicate or uncompressed WAV/MP3 files increase repository size and
  clone times without a centralized asset pipeline.

---

## 4. Testing & Quality Assurance Gaps

### 4.1 Disabled `npm test`
- The root `package.json` `test` script is disabled:
  ```json
  "test": "echo 'Test disabled due to issue #426'"
  ```
- Contributors running `npm test` receive a no-op message, reducing developer
  confidence and making local verification difficult.

### 4.2 Disjointed Test Harness
- Playwright tests run against dedicated mock pages in
  `src/tests/playwright/pages/` rather than testing the real user-facing demos
  and interactive samples.
- CI only executes tests on Chromium, leaving Web Audio compatibility on
  Firefox and WebKit (Safari) unverified in automated runs.

---

## 5. Summary Table: V3 Problem Areas & V4 Opportunities

| Problem Domain | Current State (V3) | Impact / Risk | V4 Opportunity |
| :--- | :--- | :--- | :--- |
| **Site Framework** | Eleventy 3 + Nunjucks + Liquid + Raw HTML | Inconsistent UI, broken styles across demos | Unified modern SSG/Vite pipeline |
| **Subprojects** | Rainfly decoupled in separate sub-tree | Missing from default build, stale deps | Unified monorepo or integrated SPA |
| **Type Safety** | Untyped JS in core audio libraries | Runtime errors, poor IDE DX | Migrate core libraries to TypeScript |
| **Asset Pipeline** | 30+ manual passthrough copy globs | Missing assets on deploy, duplicates | Centralized asset loader & optimizer |
| **Testing** | Disabled root test script, mock-only E2E | Regressions in real audio samples | Integrated Playwright test suite |
| **Linting** | Demos and tests excluded from ESLint | Divergent code styles and hidden bugs | Uniform ESLint/Prettier coverage |
