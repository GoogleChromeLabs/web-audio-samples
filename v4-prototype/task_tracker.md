# V4 Migration Task Tracker

This tracker coordinates the execution of tasks across the **4 Autonomous
Subagents** during the **v4** migration of `web-audio-samples`.

---

## Status Legend
- `[ ]` **Not Started**: Task is pending prerequisite or sprint activation.
- `[/]` **In Progress**: Actively being worked on by the assigned agent.
- `[x]` **Completed**: Merged and verified against acceptance criteria.
- `[!]` **Blocked**: Blocked by an unresolved dependency or upstream gate.

---

## Summary Dashboard

| Workstream / Pillar | Assigned Agent | Tasks | Done | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Pillar 1: Shared Packages** | `@agent-core` | 8 | 8 | `[x]` Completed |
| **Pillar 2: Dev Portal** | `@agent-portal` | 21 | 21 | `[x]` Completed |
| **Pillar 3: Tests & CI/CD** | `@agent-qa` | 8 | 0 | `[ ]` Pending |
| **Pillar 4: Projects** | `@agent-projects` | 7 | 0 | `[ ]` Pending |
| **Sprint Verification Gates** | All Agents | 17 | 7 | `[/]` In Progress |

---

## Sprint 0: Foundation & Package Scaffolding (Days 1–2)

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

### 🛡️ Sprint 0 Verification & Test Gate
- [x] `[V0-01]` `npm run build` succeeds in `packages/core` (emits ESM &
  `.d.ts`).
- [x] `[V0-02]` `npm run build` succeeds in `packages/ui` (emits ESM & `.d.ts`).
- [x] `[V0-03]` Vitest unit tests pass for `FreeQueue` (SAB concurrency
  push/pull).
- [x] `[V0-04]` Vitest unit tests pass for `FIFO` buffer queue operations.
- [x] `[V0-05]` Vitest component unit tests pass for `packages/ui` (Custom
  Element lifecycle, property reflection, event dispatching, and `rAF` cleanup).

---

## Sprint 1: Parallel Pillar Migration (Days 3–5)

### `@agent-portal` (Developer Portal)
- [x] `[PORTAL-01]` Initialize `dev-portal/` with Astro 5 and Tailwind CSS v4.
- [x] `[PORTAL-02]` Build base responsive layouts (`Layout.astro`, `Header`,
  `Footer`).
- [x] `[PORTAL-03]` Define Astro Content Collections schemas for docs and
  guides.
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
  `assets/sounds/` (shared across portal, tests, and projects).

### `@agent-qa` (Tests & Benchmarking)
- [ ] `[QA-01]` Scaffold `tests/` directory structure (`latency/`, `perf/`,
  `idl/`, `smoke/`).
- [ ] `[QA-02]` Migrate realtime latency fixtures to `tests/latency/`.
- [ ] `[QA-03]` Reorganize 9 per-node performance benchmarks to `tests/perf/`.
- [ ] `[QA-04]` Move `src/tests/pannernode/` and `resampler/` to `tests/perf/`.

### `@agent-projects` (Standalone Applications)
- [ ] `[PROJ-01]` Move `src/rainfly/` to `projects/rainfly/`.
- [ ] `[PROJ-02]` Modernize Rainfly build scripts to output to root
  `dist/rainfly/`.
- [ ] `[PROJ-03]` Consolidate `wavetable-synth` and `wavetable-synth-2` to
  `projects/synth/`.

### 🛡️ Sprint 1 Verification & Test Gate
- [x] `[V1-01]` `npm run build` in `dev-portal` builds all AudioWorklet pages
  cleanly.
- [ ] `[V1-02]` `projects/rainfly` builds autonomously without root
  dependencies.
- [ ] `[V1-03]` `tests/latency/` and `tests/perf/` fixtures serve on local test
  server.
- [x] `[V1-04]` Zero broken internal relative links in migrated AudioWorklet
  pages.

---

## Sprint 2: Integration & Advanced Tooling (Days 6–8)

### `@agent-portal` (Developer Portal)
- [ ] `[PORTAL-08]` Port curated demos (`mld-drum-sampler`,
  `shiny-drum-machine`, `dj`, `pool`, `visualizer`).
- [ ] `[PORTAL-09]` Ingest Stanford CCRMA Music 220A curriculum into
  `dev-portal/src/content/learn/`.
- [ ] `[PORTAL-10]` Implement one-click "Open in Rainfly IDE" integration
  buttons.

### `@agent-qa` (Tests & Benchmarking)
- [ ] `[QA-05]` Implement `tests/smoke/resampler/` and general audio graph
  fuzzing suite.
- [ ] `[QA-06]` Migrate `src/tests/setsinkid/` to `tests/idl/setsinkid/`.
- [ ] `[QA-07]` Configure root Playwright multi-browser test matrix (Chromium,
  Firefox, WebKit).
- [ ] `[QA-08]` Build `route-diff-auditor.js` and `asset-checksum-diff.js`
  verification scripts.

### `@agent-projects` (Standalone Applications)
- [ ] `[PROJ-04]` Scaffold Canopy inspector in `projects/canopy/` with Vite and
  Monaco.
- [ ] `[PROJ-05]` Scaffold Johan's visual node patcher in
  `projects/graph-editor/`.
- [ ] `[PROJ-06]` Integrate `@chrome-web-audio/core` and `ui` into subprojects.
- [ ] `[PROJ-07]` Verify standalone subproject routing and full-window
  execution.

### 🛡️ Sprint 2 Verification & Test Gate
- [ ] `[V2-01]` Playwright tests pass on Chromium, Firefox, and WebKit in CI.
- [ ] `[V2-02]` `route-diff-auditor.js` dry-run shows 100% route coverage.
- [ ] `[V2-03]` `asset-checksum-diff.js` dry-run confirms 0 missing sound/WASM
  files.
- [ ] `[V2-04]` Canopy, Graph Editor, and Synth mount cleanly to their root
  subpaths.

---

## Sprint 3: Verification, Staging & Cutover (Days 9–10)

### `@agent-em` & Team Final Cutover Gate
- [ ] `[V3-01]` **Route Parity Check**: `route-diff-auditor.js` reports 0
  missing routes.
- [ ] `[V3-02]` **Asset Checksum Check**: 100% SHA-256 match on all sound and
  WASM files.
- [ ] `[V3-03]` **Audio Signal Validation**: Playwright smoke tests confirm
  non-zero audio output and zero console errors.
- [ ] `[V3-04]` **SAB Headers**: `COOP`/`COEP` isolation headers verified on
  staging deployment.
- [ ] `[V3-05]` **Cutover**: Legacy `src/` directory archived and `v4-dev` PR
  merged to `main`.
