# Web Audio Samples v4 Site Map

## 1. Overview & Architecture

The **v4** release of `web-audio-samples` unifies all developer content,
educational guides, standalone applications, and testing suites under a
coherent URL routing hierarchy.

Routing is split across two core operational models:
1. **Developer Portal (`dev-portal/`)**: Static, highly optimized Astro pages
   for guides and canonical code examples equipped with `GuideAudioControl`.
2. **Standalone Projects (`projects/`)**: Full-window autonomous applications
   mounted at top-level root subpaths.

---

## 2. Complete URL Route Specification

### 2.1 Core Portal & Educational Content

- **`/`**: Portal landing page & interactive audio check.
  - Source: `dev-portal/src/pages/index.astro`
- **`/getting-started/`**: Web Audio setup & quickstart guide.
  - Source: `dev-portal/src/pages/getting-started.astro`
- **`/learn/`**: Stanford CCRMA Music 220A course overview.
  - Source: `dev-portal/src/content/learn/index.md`
- **`/learn/synthesis/`**: Additive, subtractive, & FM synthesis.
  - Source: `dev-portal/src/content/learn/synthesis.md`
- **`/learn/dsp-filters/`**: Digital filter theory & convolution.
  - Source: `dev-portal/src/content/learn/dsp-filters.md`
- **`/learn/spatial/`**: Spatial audio, HRTF, & binaural panning.
  - Source: `dev-portal/src/content/learn/spatial.md`

---

### 2.2 AudioWorklet Guides & Samples (`/audio-worklet/`)

All pages in this section feature co-located, presentable ES6 source code and
the floating `GuideAudioControl` transport dock.

#### Basic Samples (`/audio-worklet/basic/`)

- **`/audio-worklet/`**: AudioWorklet catalog & index.
  - Source: `dev-portal/src/pages/audio-worklet/index.astro`
- **`/audio-worklet/basic/hello-audio-worklet/`**: Bypass processor & tone.
  - Source: `dev-portal/src/pages/audio-worklet/basic/hello-audio-worklet/`
- **`/audio-worklet/basic/noise-generator/`**: White noise math & quantum.
  - Source: `dev-portal/src/pages/audio-worklet/basic/noise-generator/`
- **`/audio-worklet/basic/bit-crusher/`**: Bit depth & sample rate reduction.
  - Source: `dev-portal/src/pages/audio-worklet/basic/bit-crusher/`
- **`/audio-worklet/basic/volume-meter/`**: RMS & peak level meter worklet.
  - Source: `dev-portal/src/pages/audio-worklet/basic/volume-meter/`
- **`/audio-worklet/basic/one-pole-filter/`**: One-pole lowpass filter DSP.
  - Source: `dev-portal/src/pages/audio-worklet/basic/one-pole-filter/`
- **`/audio-worklet/basic/message-port/`**: Bi-directional MessagePort IPC.
  - Source: `dev-portal/src/pages/audio-worklet/basic/message-port/`
- **`/audio-worklet/basic/handling-errors/`**: `onprocessorerror` diagnostics.
  - Source: `dev-portal/src/pages/audio-worklet/basic/handling-errors/`
- **`/audio-worklet/basic/audio-worklet-node-options/`**: Custom node options.
  - Source: `dev-portal/.../basic/audio-worklet-node-options/`

#### Design Patterns (`/audio-worklet/design-pattern/`)

- **`/audio-worklet/design-pattern/shared-buffer/`**: Lock-free SAB audio.
  - Source: `dev-portal/.../design-pattern/shared-buffer/`
- **`/audio-worklet/design-pattern/wasm/`**: C++/Rust WASM kernel in worklet.
  - Source: `dev-portal/.../design-pattern/wasm/`
- **`/audio-worklet/design-pattern/wasm-ring-buffer/`**: Variable ring buffer.
  - Source: `dev-portal/.../design-pattern/wasm-ring-buffer/`
- **`/audio-worklet/design-pattern/wasm-supersaw/`**: Polyphonic supersaw.
  - Source: `dev-portal/.../design-pattern/wasm-supersaw/`
- **`/audio-worklet/design-pattern/free-queue/`**: Lock-free FreeQueue.
  - Source: `dev-portal/.../design-pattern/free-queue/`

#### Migration Guides (`/audio-worklet/migration/`)

- **`/audio-worklet/migration/spn-recorder/`**: Legacy ScriptProcessor.
  - Source: `dev-portal/src/pages/audio-worklet/migration/spn-recorder/`
- **`/audio-worklet/migration/worklet-recorder/`**: AudioWorklet recorder.
  - Source: `dev-portal/.../migration/worklet-recorder/`

---

### 2.3 Standalone Applications & Demos (`projects/`)

Autonomous applications built as top-level single-page applications:

- **`/rainfly/`**: In-browser AudioWorklet IDE (SvelteKit + Monaco).
  - Source: `projects/rainfly/`
- **`/canopy/`**: Web Audio graph & node inspector.
  - Source: `projects/canopy/`
- **`/graph-editor/`**: Visual node patching playground.
  - Source: `projects/graph-editor/`
- **`/synth/`**: Interactive modular / wavetable synthesizer.
  - Source: `projects/synth/`
- **`/shiny-drum-machine/`**: 16-step vintage drum sequencer.
  - Source: `projects/shiny-drum-machine/`
- **`/visualizer/`**: Three.js / WebGL 3D frequency visualizer.
  - Source: `projects/visualizer/`
- **`/dj/`**: Dual-deck crossfader mixing demo.
  - Source: `projects/dj/`

---

### 2.4 Test & Benchmarking Suites (`tests/`)

Accessible during local development and automated CI testing:

- **`/tests/latency/`**: Hardware I/O roundtrip latency measurement.
  - Source: `tests/latency/`
- **`/tests/perf/`**: Per-node audio throughput benchmarks.
  - Source: `tests/perf/`
- **`/tests/idl/`**: W3C Web Audio IDL & WPT compliance suite.
  - Source: `tests/idl/`
- **`/tests/smoke/`**: Audio graph fuzzing & resampler stress.
  - Source: `tests/smoke/`

---

## 3. Visual URL Hierarchy

```
/ (Portal Root)
├── getting-started/
├── learn/
│   ├── synthesis/
│   ├── dsp-filters/
│   └── spatial/
│
├── audio-worklet/
│   ├── basic/
│   │   ├── hello-audio-worklet/
│   │   ├── noise-generator/
│   │   ├── bit-crusher/
│   │   ├── volume-meter/
│   │   ├── one-pole-filter/
│   │   ├── message-port/
│   │   ├── handling-errors/
│   │   └── audio-worklet-node-options/
│   │
│   ├── design-pattern/
│   │   ├── shared-buffer/
│   │   ├── wasm/
│   │   ├── wasm-ring-buffer/
│   │   ├── wasm-supersaw/
│   │   └── free-queue/
│   │
│   └── migration/
│       ├── spn-recorder/
│       └── worklet-recorder/
│
├── [Standalone Apps]
│   ├── rainfly/
│   ├── canopy/
│   ├── graph-editor/
│   ├── synth/
│   ├── shiny-drum-machine/
│   ├── visualizer/
│   └── dj/
│
└── [Tests & Benchmarks]
    ├── tests/latency/
    ├── tests/perf/
    ├── tests/idl/
    └── tests/smoke/
```
