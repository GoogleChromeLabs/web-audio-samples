# V3 to V4 Migration Mapping Specification

This document provides an exhaustive mapping of all existing files, samples,
libraries, tests, and assets in **v3.x (`src/`)** to the **v4** repository
architecture.

---

## 1. Architectural Pillar Mapping Overview

```
v3.x Location                  v4 Pillar Target            Description
──────────────────────────────────────────────────────────────────────────────
src/library/                -> packages/core/              Typed Core Audio Lib
src/lib/free-queue/         -> packages/core/free-queue/   Lock-free SAB ring buffer
src/audio-worklet/          -> dev-portal/audio-worklet/   AudioWorklet Guides/Demos
src/demos/                  -> dev-portal/demos/ &         Curated Demos &
                               projects/                   Standalone SPAs
src/experiments/            -> dev-portal/experiments/     Experimental Labs
src/rainfly/                -> projects/rainfly/           In-browser Worklet IDE
src/tests/playwright/pages/ -> tests/perf/ & tests/latency Node benchmarks & I/O
src/tests/resampler-smoke/  -> tests/smoke/resampler/      Fuzz & edge testing
src/tests/setsinkid/        -> tests/idl/setsinkid/        IDL spec compliance
src/sounds/                 -> dev-portal/public/sounds/   Static audio assets
src/styles/                 -> dev-portal/src/styles/      Tailwind v4 styles
src/_includes/ & _data/     -> dev-portal/src/components/  Layouts & Content
──────────────────────────────────────────────────────────────────────────────
```

---

## 2. Detailed Mapping by Subsystem

### 2.1 Core Shared Libraries -> `packages/core/` (`@chrome-web-audio/core`)

All reusable utilities are migrated to TypeScript, bundled with Vite/tsup, and
equipped with unit tests and `.d.ts` declaration files.

| V3 Source Path | V4 Target Path | Description & Enhancements |
| :--- | :--- | :--- |
| `src/library/FIFO.js` | `packages/core/src/fifo/` | Audio buffer FIFO queue with TS types |
| `src/library/VUMeter.js` | `packages/core/src/meters/` | Canvas & DOM-based VU / Peak meter |
| `src/library/Waveform.js` | `packages/core/src/waveform/` | Modern logarithmic dB Waveform display |
| `src/lib/free-queue/` | `packages/core/src/free-queue/` | Lock-free SharedArrayBuffer ring buffer |

---

### 2.2 AudioWorklet Guides & Samples -> `dev-portal/src/pages/audio-worklet/`

Migrated to Astro static pages with client-side vanilla ES6 scripts.

| V3 Source Path | V4 Target Path | Topic / Design Pattern |
| :--- | :--- | :--- |
| `src/audio-worklet/basic/hello-audio-worklet/` | `dev-portal/src/pages/audio-worklet/basic/hello/` | First AudioWorklet processor |
| `src/audio-worklet/basic/noise-generator/` | `dev-portal/src/pages/audio-worklet/basic/noise/` | White noise generator node |
| `src/audio-worklet/basic/bit-crusher/` | `dev-portal/src/pages/audio-worklet/basic/bit-crusher/` | Custom AudioParam bitcrusher |
| `src/audio-worklet/basic/one-pole-filter/` | `dev-portal/src/pages/audio-worklet/basic/one-pole/` | Low-pass filter DSP |
| `src/audio-worklet/basic/volume-meter/` | `dev-portal/src/pages/audio-worklet/basic/volume-meter/` | Real-time RMS volume metering |
| `src/audio-worklet/basic/message-port/` | `dev-portal/src/pages/audio-worklet/basic/message-port/` | Bi-directional worker messaging |
| `src/audio-worklet/basic/handling-errors/` | `dev-portal/src/pages/audio-worklet/basic/errors/` | Onprocessorerror diagnostics |
| `src/audio-worklet/basic/audio-worklet-node-options/` | `dev-portal/src/pages/audio-worklet/basic/node-options/` | Constructor options usage |
| `src/audio-worklet/design-pattern/shared-buffer/` | `dev-portal/src/pages/audio-worklet/design-pattern/shared-buffer/` | SharedArrayBuffer audio streaming |
| `src/audio-worklet/design-pattern/wasm/` | `dev-portal/src/pages/audio-worklet/design-pattern/wasm/` | C++/Rust WASM DSP in worklet |
| `src/audio-worklet/design-pattern/wasm-ring-buffer/` | `dev-portal/src/pages/audio-worklet/design-pattern/wasm-ring-buffer/` | WASM memory ring buffering |
| `src/audio-worklet/design-pattern/wasm-supersaw/` | `dev-portal/src/pages/audio-worklet/design-pattern/wasm-supersaw/` | Polyphonic supersaw synth |
| `src/audio-worklet/free-queue/` | `dev-portal/src/pages/audio-worklet/free-queue/` | High-performance lock-free queue |
| `src/audio-worklet/migration/spn-recorder/` | `dev-portal/src/pages/audio-worklet/migration/spn-recorder/` | ScriptProcessorNode migration |
| `src/audio-worklet/migration/worklet-recorder/` | `dev-portal/src/pages/audio-worklet/migration/worklet-recorder/` | Modern worklet-based audio recorder |

---

### 2.3 Interactive Demos -> Split: `dev-portal/demos/` & `projects/`

Smaller showcase demos live directly in `dev-portal/`, while full-featured
applications live in `projects/` as standalone top-level SPAs.

| V3 Source Path | V4 Target Path | Classification & Notes |
| :--- | :--- | :--- |
| `src/demos/mld-drum-sampler/` | `dev-portal/src/pages/demos/mld-drum-sampler/` | Machine Learning drum sampler demo |
| `src/demos/shiny-drum-machine/` | `dev-portal/src/pages/demos/shiny-drum-machine/` | Classic 16-step drum sequencer |
| `src/demos/panning-reverberation/` | `dev-portal/src/pages/demos/panning-reverberation/` | Spatial audio & Convolver demo |
| `src/demos/visualizer/` | `dev-portal/src/pages/demos/visualizer/` | WebGL 3D audio frequency visualizer |
| `src/demos/dj/` | `dev-portal/src/pages/demos/dj/` | Dual-deck crossfader DJ sample |
| `src/demos/pool/` | `dev-portal/src/pages/demos/pool/` | Interactive physical audio space |
| `src/demos/wavetable-synth/` | `projects/synth/` (or `dev-portal/demos/`) | Standalone wavetable synthesizer |
| `src/demos/wavetable-synth-2/` | `projects/synth/` | Modernized wavetable synth UI |
| `src/demos/pwa-audio-recorder/` | `projects/audio-recorder/` | Offline PWA audio recording app |

---

### 2.4 Standalone Projects -> `projects/` (Top-Level SPAs)

Each tool is an autonomous project built with Vite mounted to `/<project_name>/`.

| Project Name | V4 Target Path | Stack / Description |
| :--- | :--- | :--- |
| **rainfly** | `projects/rainfly/` | In-browser AudioWorklet IDE (SvelteKit + Monaco) |
| **canopy** | `projects/canopy/` | Web Audio graph & node inspector / testbed |
| **graph-editor** | `projects/graph-editor/` | Johan's visual Web Audio node patcher |
| **synth** | `projects/synth/` | Modular / wavetable interactive synth |

---

### 2.5 Tests & Benchmarks -> `tests/`

Consolidates performance tests, device latency harnesses, IDL validation, and
smoke tests into four dedicated subdirectories orchestrated by Playwright.

| V3 Source Path | V4 Target Path | Testing Category |
| :--- | :--- | :--- |
| `src/tests/playwright/pages/realtime-sine.html` | `tests/latency/realtime-sine.html` | Device output latency & timing |
| `src/tests/playwright/pages/chuck-realtime-sine.html` | `tests/latency/chuck-realtime-sine.html` | ChucK/WASM audio latency |
| `src/tests/playwright/pages/perf-*.html` (9 files) | `tests/perf/nodes/` | Per-node throughput benchmarks |
| `src/demos/stress-box/` | `tests/perf/stress-box/` | Graph complexity stress testing |
| `src/tests/pannernode/` | `tests/perf/panner/` | PannerNode performance harness |
| `src/tests/resampler/` | `tests/perf/resampler/` | Resampler throughput benchmark |
| `src/tests/resampler-smoke/` | `tests/smoke/resampler/` | Fuzzing & extreme parameter checks |
| `src/tests/setsinkid/` | `tests/idl/setsinkid/` | AudioContext.setSinkId() IDL test |
| `src/tests/playwright/runner.spec.ts` | `tests/perf/playwright.spec.ts` | Automated CI runner spec |

---

### 2.6 Assets, Styles, and Site Shell

| V3 Source Path | V4 Target Path | Migration Action |
| :--- | :--- | :--- |
| `src/sounds/**` | `dev-portal/public/sounds/` | Unified static asset directory (auto-served) |
| `src/styles/styles.css` | `dev-portal/src/styles/global.css` | Native Tailwind CSS v4 |
| `src/index.njk` | `dev-portal/src/pages/index.astro` | Modern Astro landing page |
| `src/_includes/base.njk` | `dev-portal/src/layouts/Layout.astro` | Base layout template |
| `src/_includes/header.njk` | `dev-portal/src/components/Header.astro` | Top navigation component |
| `src/_includes/footer.njk` | `dev-portal/src/components/Footer.astro` | Footer component with build metadata |
| `src/_data/*.yaml` | `dev-portal/src/content/` | Type-safe Astro Content Collections |

---

## 3. Phased Migration Execution Plan

To ensure a smooth transition with zero disruption:

1. **Phase 1: Shared Core (`packages/core`)**
   - Extract `FIFO`, `VUMeter`, `Waveform`, and `FreeQueue` to TypeScript.
   - Set up build (`tsup`/Vite) to output ESM and `.d.ts`.
2. **Phase 2: Developer Portal (`dev-portal/`)**
   - Migrate layouts, landing page, and AudioWorklet guides to Astro.
   - Move static audio assets to `dev-portal/public/sounds/`.
3. **Phase 3: Testing Suite (`tests/`)**
   - Reorganize `tests/latency/`, `tests/perf/`, `tests/idl/`, `tests/smoke/`.
   - Update Playwright config and GitHub Actions CI workflow.
4. **Phase 4: Standalone Projects (`projects/`)**
   - Move Rainfly to `projects/rainfly/`.
   - Integrate Canopy, Graph Editor, and Synth.
5. **Phase 5: Monorepo Orchestration & Deprecation of `src/`**
   - Configure root `package.json` build scripts.
   - Archive legacy v3 files and update deployment CI.
