# V4 Migration Task Tracker

This tracker coordinates the execution of tasks across the **4 Autonomous
Subagents** during the **v4** migration of `web-audio-samples`.

---

## Status Legend
- `[ ]` **Not Started**: Task is pending prerequisite or milestone activation.
- `[/]` **In Progress**: Actively being worked on by the assigned agent.
- `[x]` **Completed**: Merged and verified against acceptance criteria.
- `[!]` **Blocked**: Blocked by an unresolved dependency or upstream gate.

---

## Summary Dashboard

| Workstream / Pillar | Assigned Agent | Tasks | Done | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Foundation: Shared Packages** | `@agent-core` | 8 | 8 | `[x]` Done |
| **M1: Dev Portal (Guides)** | `@agent-portal` | 17 | 17 | `[x]` Done |
| **M1: Apps and Demos** | `@agent-projects` | 8 | 8 | `[x]` Done |
| **M1: Tests & Benchmarks** | `@agent-qa` | 7 | 0 | `[ ]` Pending |
| **M1: Verification Gates** | All Agents | 5 | 4 | `[/]` In Progress |
| **M2: Dev Portal (Music 220A)** | `@agent-portal` | 2 | 0 | `[ ]` Pending |
| **M2: Apps and Demos** | `@agent-projects` | 4 | 0 | `[ ]` Pending |
| **M2: Tests & CI (Playwright)** | `@agent-qa` | 5 | 0 | `[ ]` Pending |
| **M2: Cutover Gates** | `@agent-em` | 6 | 0 | `[ ]` Pending |

---

## Foundation: Package Scaffolding & Core Libraries

### `@agent-core` (Core & Tooling)
- [x] `[CORE-01]` Initialize root `package.json` with npm/pnpm workspaces.
- [x] `[CORE-02]` Scaffold `packages/core/` package manifest and
  `tsconfig.json`.
- [x] `[CORE-03]` Migrate `src/lib/free-queue/` to TypeScript (`FreeQueue.ts`).
- [x] `[CORE-04]` Migrate `src/library/FIFO.js` to TypeScript (`FIFO.ts`).
- [x] `[CORE-05]` Scaffold `packages/ui/` package manifest and `tsconfig.json`.
- [x] `[CORE-06]` Migrate `src/library/Waveform.js` to `packages/ui/`.
- [x] `[CORE-07]` Migrate `src/library/VUMeter.js` to `packages/ui/`.
- [x] `[CORE-08]` Setup `tsup`/Vite bundling for `core` and `ui` emitting
  `.d.ts`.

### 🛡️ Foundation Verification Gate
- [x] `[VF-01]` `npm run build` succeeds in `packages/core` (emits ESM &
  `.d.ts`).
- [x] `[VF-02]` `npm run build` succeeds in `packages/ui` (emits ESM & `.d.ts`).
- [x] `[VF-03]` Vitest unit tests pass for `FreeQueue` (SAB concurrency
  push/pull).
- [x] `[VF-04]` Vitest unit tests pass for `FIFO` buffer queue operations.
- [x] `[VF-05]` Vitest component unit tests pass for `packages/ui` (Custom
  Element lifecycle, property reflection, event dispatching, and `rAF`
  cleanup).

---

## Milestone 1: MVP

The primary objective for Milestone 1 is delivering a robust, interactive MVP
containing all AudioWorklet guides, core curated apps and demos, external
Google and ecosystem links, and foundational test and benchmark fixtures.

### 1. Developer Portal: AudioWorklet Guides (`@agent-portal`)
- [x] `[PORTAL-01]` Initialize portal shell with Astro 5 and Tailwind CSS v4.
- [x] `[PORTAL-02]` Build base responsive layouts (`Layout.astro`, `Header`,
  `Footer`).
- [x] `[PORTAL-03]` Define Astro Content Collections schemas for guides.
- [x] `[PORTAL-04a]` Port `hello-audio-worklet` (Bypass processor demo).
- [x] `[PORTAL-04b]` Port `noise-generator` (White noise generator).
- [x] `[PORTAL-04c]` Port `bit-crusher` (Bit depth & sample rate reduction).
- [x] `[PORTAL-04d]` Port `volume-meter` (RMS/peak metering worklet).
- [x] `[PORTAL-04e]` Port `one-pole-filter` (One-pole IIR lowpass filter).
- [x] `[PORTAL-04f]` Port `handling-errors` (Error handling in AudioWorklet).
- [x] `[PORTAL-04g]` Port `message-port` (Bi-directional MessagePort
  communication).
- [x] `[PORTAL-04h]` Port `audio-worklet-node-options` (Custom node
  initialization options).
- [x] `[PORTAL-05a]` Port `shared-buffer` (Lock-free SharedArrayBuffer
  pattern).
- [x] `[PORTAL-05b]` Port `wasm` (Emscripten WebAssembly audio kernel).
- [x] `[PORTAL-05c]` Port `wasm-ring-buffer` (Variable buffer ring buffer with
  WASM).
- [x] `[PORTAL-05d]` Port `wasm-supersaw` (Virtual analog multi-voice
  synthesizer).
- [x] `[PORTAL-06a]` Port `spn-recorder` (ScriptProcessorNode legacy recorder).
- [x] `[PORTAL-06b]` Port `worklet-recorder` (Modern AudioWorklet recorder).
- [x] `[PORTAL-07]` Migrate static audio assets from `src/sounds/` to
  `assets/sounds/` (shared across portal, tests, and demos).

### 2. Apps and Demos (`@agent-projects` / `@agent-portal`)
- [x] `[DEMO-01]` Port `shiny-drum-machine` (Multi-kit drum sequencer with
  reverb and stereo delay).
- [x] `[DEMO-02]` Port `mld-drum-sampler` (Mother Language Day Korean
  traditional drum sampler).
- [x] `[DEMO-03]` Port `dj` (Dual-deck beat-synced DJ player and mixer).
- [x] `[DEMO-04]` Port `pool` (WebGL 3D physics pool game with 3D spatial
  audio).
- [x] `[DEMO-05]` Port `visualizer` (Canvas frequency spectrum and waveform
  visualizer using `AnalyserNode`).
- [x] `[DEMO-06]` Consolidate and port `wavetable-synth` and `wavetable-synth-2`
  into a modernized wavetable synthesizer.
- [x] `[DEMO-07]` Port auxiliary demos (`panning-reverberation`, `stress-box`,
  and `pwa-audio-recorder`).
- [x] `[DEMO-08]` Implement "External Showcase & Ecosystem Links" section:
  Omnitone, Resonance Audio, Chrome Music Lab, Google Doodles (Clara Rockmore,
  Robert Moog), Audion DevTools Extension, W3C spec, and MDN Web Docs.

### 3. Test and Benchmark (`@agent-qa`)
- [ ] `[TEST-01]` Scaffold `tests/` directory structure and unified test
  catalog index page.
- [ ] `[TEST-02]` Port `resampler` test and benchmark fixture
  (`src/tests/resampler/`).
- [ ] `[TEST-03]` Port `resampler-smoke` stress and stability test harness
  (`src/tests/resampler-smoke/`).
- [ ] `[TEST-04]` Port `setsinkid` device routing test fixture
  (`AudioContext.setSinkId()`).
- [ ] `[TEST-05]` Port `pannernode` audio listener and spatial performance
  benchmark.
- [ ] `[TEST-06]` Migrate legacy bug reproduction test cases and audio graph
  edge cases.
- [ ] `[TEST-07]` Setup local test server fixture serving and benchmark
  reporting.

### 🛡️ Milestone 1 Verification & Quality Gate
- [x] `[V1-01]` `npm run build` in portal builds all AudioWorklet pages cleanly.
- [x] `[V1-02]` Zero broken internal relative links in migrated AudioWorklet
  pages.
- [x] `[V1-03]` All ported MVP demos (`shiny-drum-machine`, `mld-drum-sampler`,
  `dj`, `pool`, `visualizer`, `wavetable-synth`) load and run without errors.
- [x] `[V1-04]` External project cards link accurately to external repositories
  and documentation.
- [ ] `[V1-05]` Test fixtures (`resampler`, `setsinkid`, `pannernode`, bug
  repros) serve and execute properly on the local test server.

---

## Milestone 2: Advanced Platform & Polish

Milestone 2 extends the platform with educational curriculum, complex
standalone development applications, and end-to-end automated multi-browser
CI testing.

### 1. Developer Portal: Music 220A Coursework (`@agent-portal`)
- [ ] `[PORTAL-09]` Ingest Stanford CCRMA Music 220A curriculum into
  `dev-portal/src/content/learn/`.
- [ ] `[PORTAL-10]` Implement interactive code exercises and playground
  integration for Music 220A course modules.

### 2. Apps and Demos: Advanced Standalone SPAs (`@agent-projects`)
- [ ] `[APP-01]` Migrate Rainfly (`src/rainfly/`) to `projects/rainfly/` with
  modernized SvelteKit/Vite autonomous build.
- [ ] `[APP-02]` Scaffold and integrate Canopy Web Audio live-coding and
  visual debugger in `projects/canopy/`.
- [ ] `[APP-03]` Scaffold and integrate Johan's visual graph editor in
  `projects/graph-editor/`.
- [ ] `[APP-04]` Implement one-click "Open in Rainfly / Canopy" deep links from
  portal guides and demos.

### 3. Test and Benchmark: Automated Playwright Testing & CI (`@agent-qa`)
- [ ] `[QA-05]` Configure root Playwright multi-browser test matrix (Chromium,
  Firefox, WebKit).
- [ ] `[QA-06]` Migrate and modernize Playwright test runner and specs from
  `src/tests/playwright/`.
- [ ] `[QA-07]` Implement automated audio signal verification (assert non-zero
  audio buffers and no silent clipping).
- [ ] `[QA-08]` Implement audio graph fuzzing and boundary stress test suite.
- [ ] `[QA-09]` Configure GitHub Actions CI/CD workflows for automated PR
  testing and regression checks.

### 🛡️ Milestone 2 Verification & Release Gate
- [ ] `[V2-01]` Playwright tests pass on Chromium, Firefox, and WebKit in CI.
- [ ] `[V2-02]` `route-diff-auditor.js` dry-run shows 100% route coverage
  against legacy site.
- [ ] `[V2-03]` `asset-checksum-diff.js` dry-run confirms 100% SHA-256 match on
  sound and WASM files.
- [ ] `[V2-04]` Canopy, Graph Editor, and Rainfly mount cleanly to their root
  subpaths and build autonomously.
- [ ] `[V2-05]` COOP/COEP isolation headers verified on staging deployment.
- [ ] `[V2-06]` Cutover: legacy `src/` directory archived and `v4-dev` PR
  merged to `main`.
