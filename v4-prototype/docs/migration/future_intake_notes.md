# V4 Future Intake & Integration Notes

This document provides architectural intake notes for integrating external
specialized Web Audio repositories into the **v4** ecosystem:

1. **[Canopy](https://github.com/hoch/canopy)** (Debugging & Inspection Suite)
2. **[Spiral Repositories](https://github.com/hoch?tab=repositories&q=spiral)**
   (Audio UI Web Components)
3. **[WAAX](https://github.com/hoch/WAAX)** (Web Audio API eXtension & Plugin
   Architecture)
4. **[CCRMA Music 220A](https://github.com/ccrma/music220a)** (Pedagogical
   Computer Music Curriculum)

---

## 1. Canopy (`hoch/canopy`) -> `projects/canopy/`

### Profile
- **Original Stack**: Gulp, Polymer 1.0, Ace/CodeMirror editor, Web Audio.
- **Key Features**:
  - Interactive multi-channel Waveform inspector with smooth zoom/pan.
  - Live interactive AudioGraph node visualizer and connection mapper.
  - In-browser code editor with Gist sharing, looped playback, and 16-bit WAV
    export.

### V4 Modernization Path
- **Target Location**: `projects/canopy/` (Standalone Top-Level SPA).
- **Toolchain Upgrade**:
  - Replace Gulp + Polymer with **Vite + Vanilla TypeScript** or **Svelte 5**.
  - Replace old editor with modern **Monaco Editor** (sharing the Monaco
    foundation with Rainfly).
  - Use Canvas2D / WebGPU for 60fps waveform zoom and graph rendering.
- **Integration**:
  - Accessible directly at `https://.../canopy/`.
  - Share core DSP and buffer helpers from `@chrome-web-audio/core`.

---

## 2. Spiral Components (`hoch/spiral-*`) -> `packages/core/ui/`

### Profile
- **Original Stack**: Polymer custom elements (`spiral-audiograph`,
  `spiral-knob`, `spiral-meter`, `spiral-waveform`).
- **Key Features**:
  - Specialized musical user interface elements (rotary knobs, dual sliders,
    LED VU meters, graph nodes).

### V4 Modernization Path
- **Target Location**: `packages/core/src/ui/` (or `@chrome-web-audio/ui`).
- **Toolchain Upgrade**:
  - Modernize from Polymer 1.0 to **Standard Framework-Agnostic Web
    Components (Custom Elements v1)** with zero external dependencies.
- **Value to V4**:
  - Can be embedded inside `dev-portal` markdown guides with simple custom
    tags: `<audio-knob min="20" max="20000" param="cutoff"></audio-knob>`.
  - Used directly across `projects/synth`, `projects/graph-editor`, and
    `dev-portal/demos/`.

---

## 3. WAAX (`hoch/WAAX`) -> `packages/core/` & `projects/synth/`

### Profile
- **Original Stack**: Web Audio API eXtension, WAPL (Web Audio Plug-in),
  MUI (Musical User Interface).
- **Key Features**:
  - High-level audio graph abstractions (DSP chains, voice management).
  - Event sequencer and musical transport timeline.
  - Parameter automation curves and preset management.
  - Rich synthesizer and sound design algorithms.

### V4 Modernization Path
- **Target Location**:
  - **DSP & Transport Core**: Extracted into `@chrome-web-audio/core`
    (`sequencer/`, `transport/`, `dsp/`).
  - **Modular Synthesizer App**: Powers the new `projects/synth/` standalone
    application.
- **Toolchain Upgrade**:
  - Modernize legacy `ScriptProcessorNode` code to native **`AudioWorklet`**.
  - Convert OOP JavaScript patterns to modern TypeScript classes and pure DSP
    functions.

---

## 4. CCRMA Music 220A (`ccrma/music220a`) -> `dev-portal/learn/`

### Profile
- **Original Stack**: Stanford University Music 220A course materials.
- **Key Features**: 9 progressive modules from audio basics to FM synthesis,
  spatialization, nonlinear waveshaping, and WebChuck.

### V4 Modernization Path
- **Target Location**: `dev-portal/src/content/learn/music220a/`.
- **Synergy with Rainfly**:
  - Every lesson gets an **"Open in Rainfly IDE"** button.
  - Course assignments (`starters/`) become pre-packaged Rainfly templates.

---

## 5. Intake Summary & Repository Mapping

| Repository | Origin Source | V4 Destination | Key Deliverable |
| :--- | :--- | :--- | :--- |
| **Canopy** | `hoch/canopy` | `projects/canopy/` | Modern Web Audio graph/waveform inspector |
| **Spiral UI** | `hoch/spiral-*` | `packages/core/src/ui/` | Standard Web Components for audio controls |
| **WAAX** | `hoch/WAAX` | `packages/core/` & `projects/synth/` | DSP helpers, sequencer transport & synth app |
| **Music 220A**| `ccrma/music220a` | `dev-portal/learn/` | 9-module computer music curriculum |
