# AudioWorklet Guide Migration Playbook (v4 Standalone Pattern)

This playbook outlines the standard procedure for converting legacy
AudioWorklet samples (from `src/audio-worklet/`) into modular, self-contained
guide directories under `v4-prototype/src/content/guides/`.

---

## 1. Directory Structure

Every guide lives in its own dedicated folder containing all technical
documentation, runnable JavaScript, processor modules, WebAssembly binaries,
audio assets, and diagrams:

```text
v4-prototype/src/content/guides/<guide-slug>/
├── index.md                 # Guide markdown & frontmatter
├── main.js                  # AudioContext setup & lifecycle exports
├── <name>-processor.js      # AudioWorkletProcessor script
└── [assets]                 # Optional .wasm, .wav, .mp3, images, etc.
```

> [!NOTE]
> Do NOT place scripts in `public/audio-worklet/`. The custom integration in
> [`astro.config.mjs`][astro-config] automatically serves and bundles
> co-located assets directly from the guide directory.

---

## 2. Step-by-Step Migration Procedure

### Step 1: Create the Standalone Directory
Create `v4-prototype/src/content/guides/<guide-slug>/`.

### Step 2: Create Documentation (`index.md`)
Extract conceptual write-ups and node relationships into `index.md`. Preserve
the concise, authentic description from the original sample (e.g. `index.njk`
or W3C specification). Do not generate invented text or ASCII diagrams.
Include the standard Astro frontmatter schema:

```yaml
---
title: Sample Title
description: Concise one-sentence summary of the sample.
category: basic # 'basic' | 'design-pattern' | 'migration'
order: 1 # Display sort order within category
tags:
  - basic
  - audioworklet
demoTitle: Sample Title
demoDescription: Click START to run this sample.
---
```

### Step 3: Modernize `main.js`
The portal's `InteractiveDemoBox` and `AudioControlPanel` control the audio
lifecycle and telemetry. `main.js` must adhere to this standard contract:

```javascript
let audioContext = null;
let sourceNode = null;

/**
 * Initializes the AudioContext, registers the worklet, and builds graph.
 * @return {Promise<AudioContext>}
 */
export const setup = async () => {
  audioContext = new AudioContext();
  await audioContext.suspend();

  // Always resolve processor paths relative to this module:
  const processorUrl =
    new URL('my-processor.js', import.meta.url).href;
  await audioContext.audioWorklet.addModule(processorUrl);

  const workletNode =
    new AudioWorkletNode(audioContext, 'my-processor');
  workletNode.connect(audioContext.destination);

  return audioContext;
};

/**
 * Starts playback or rendering triggered by user gesture.
 * @param {AudioContext} context
 */
export const start = async (context) => {
  if (sourceNode) {
    try {
      sourceNode.start();
    } catch {
      // Ignore if already started.
    }
  }
};
```

### Step 4: Co-locate Processors and Media Assets
* Move `<name>-processor.js` into the guide folder.
* Add any associated sample files (`.wav`, `.mp3`), WebAssembly modules
  (`.wasm`), or image flowcharts directly into the folder.
* Load them in JavaScript using `new URL('./asset.ext', import.meta.url).href`.

### Step 5: Clean Up Legacy & Duplicate Files
* If a flat markdown file existed (e.g., `src/content/guides/<slug>.md`),
  delete it to prevent duplicate ID collisions.
* Remove any duplicate copies under `public/audio-worklet/`.

### Step 6: Validate Build & Runtime
* Run `npm run build` inside `v4-prototype/` to confirm 0 errors.
* Verify files emit to `dist/audio-worklet/<category>/<slug>/`.
* Verify the dev server returns `HTTP 200 OK` and `application/javascript`
  via `curl -I http://localhost:4321/audio-worklet/<category>/<slug>/main.js`
  or `python3 _agents/scripts/check-endpoints.py`.

---

## 3. Key "Gotchas" & Solutions

### 1. `src/content/` is Private in Astro
> [!IMPORTANT]
> Astro treats `src/` as private source code. Companion scripts are NOT served
> over HTTP by default.
>
> **Solution**: [`astro.config.mjs`][astro-config] includes
> `guideAssetsIntegration()`, which intercepts dev requests via Vite
> middleware and copies assets to `dist/` during `astro:build:done`. Never
> duplicate assets into `public/`.

### 2. Duplicate Collection IDs
> [!WARNING]
> Astro 5's glob loader strips `/index` from `hello/index.md` to produce
> `id: "hello"`.
> If `hello.md` and `hello/index.md` exist concurrently, Astro warns about
> duplicate IDs and produces undefined build ordering.
>
> **Solution**: Always delete the old flat `.md` file immediately upon creating
> `index.md`.

### 3. Absolute Paths vs. `import.meta.url`
> [!CAUTION]
> Do NOT use absolute URLs like `/audio-worklet/.../processor.js` or bare
> filenames like `'processor.js'` in `audioWorklet.addModule()`. They fail
> under subdirectory hosting (e.g. GitHub Pages preview deployments).
>
> **Solution**: Always construct asset and processor URLs with:
> `new URL('processor.js', import.meta.url).href`

### 4. Collection Glob Trapping Non-Markdown Files
> [!NOTE]
> The loader pattern in [`content.config.ts`][content-config] must strictly
> match `**/*.{md,mdx}` so Astro does not attempt to parse `.js`, `.wasm`, or
> `.wav` files as Markdown entries.

### 5. No Direct DOM Manipulation in `main.js`
> [!IMPORTANT]
> Do NOT query `document.querySelector('#start-btn')` or bind click handlers
> inside `main.js`.
>
> **Solution**: Export `setup()` and `start()`. The unified
> `InteractiveDemoBox` and `AudioControlPanel` manage transport buttons, state
> toggling, and telemetry collection automatically.

### 6. AudioParam Array Length & `NaN` State Poisoning (Silent Audio)
> [!CAUTION]
> In legacy samples, authors frequently assumed an AudioParam would always be
> automated, writing code like `this.phase_ += frequencyReduction[i]`.
>
> In the v4 two-phase lifecycle, `setup()` initializes the graph at page load,
> while `start()` applies runtime automations on user gesture. In the resting
> state before gesture (or whenever an AudioParam is constant), the parameter
> array has length **1** (`parameters.paramName.length === 1`).
>
> Indexing `paramName[i]` for `i > 0` returns `undefined`, which turns numeric
> state accumulators (e.g. `this.phase_ += undefined`) into `NaN`. Once a DSP
> variable becomes `NaN`, conditional checks like `phase >= 1.0` permanently
> fail, resulting in total silence even after `start()` runs.
>
> **Solution**: Never assume an AudioParam array has length 128. Always branch
> on `param.length === 1`:
> ```javascript
> const isReductionConstant = frequencyReduction.length === 1;
> for (let i = 0; i < inputChannel.length; ++i) {
>   const reduction = isReductionConstant
>     ? frequencyReduction[0]
>     : frequencyReduction[i];
>   this.phase_ += reduction;
> }
> ```

### 7. Authentic Content & No Hallucinated Diagrams
> [!IMPORTANT]
> Do NOT generate random explanations, verbose text essays, or ASCII/text-based
> architecture diagrams in `index.md`.
>
> **Solution**: Preserve the authentic, concise conceptual summary from the
> legacy sample (`index.njk` / W3C spec). Detail the core Web Audio components
> succinctly, show the exact runnable code snippets used in the demo (`main.js`
> and processor), and link to official specifications and developer articles.

### 8. Premature Audio Playback (Auto-start on Page Load)
> [!CAUTION]
> If the user has already interacted with the browser tab or localhost origin
> during development, Chrome may create `new AudioContext()` in the `running`
> state instead of `suspended`.
>
> For autonomous sound generators (such as white noise generators or active
> oscillators) connected to `destination`, audio will immediately begin blasting
> on page load before the user clicks START. Furthermore, when START is later
> clicked, parameters or modulators starting mid-stream can cause sudden,
> jarring jumps in loudness.
>
> **Solution**: Always explicitly call `await audioContext.suspend()` inside
> `setup()` immediately after instantiating `AudioContext`:
> ```javascript
> export const setup = async () => {
>   audioContext = new AudioContext();
>   await audioContext.suspend();
>   // ...
> };
> ```

### 9. LFO Modulator Discontinuity & Dynamic Range Surges
> [!NOTE]
> When modulating an `AudioParam` (e.g. `amplitude`) with an `OscillatorNode`,
> the effective parameter value equals its base `value` plus the incoming
> signal. If an autonomous source (like white noise) was already playing at its
> resting level (`0.25`), starting the modulator mid-stream swings the peak
> amplitude up to $0.25 + 0.75 = 1.0$ (+12 dB surge).
>
> **Solution**: Ensure the `AudioContext` is suspended until user gesture so
> that audio rendering and modulator oscillation start synchronously from
> silence without jarring loudness discontinuities.

### 10. Automated Companion Asset Endpoint Testing
> [!TIP]
> Do not manually test individual assets with `curl`. Use the automated CLI
> verification tool to validate all companion assets in one command:
> ```bash
> python3 _agents/scripts/check-endpoints.py \
>   v4-prototype/src/content/guides/<guide-slug>
> ```
> The script parses frontmatter category and slug, discovers all companion
> files (`main.js`, processors, audio files), and asserts that all dev server
> endpoints return `HTTP 200 OK` with the expected MIME type.

### 11. Prefer Constructor Options Over Property Setters
> [!IMPORTANT]
> Pass audio node initial properties via the standard constructor options
> dictionary instead of mutating properties after instantiation:
> ```javascript
> // Preferred:
> const osc = new OscillatorNode(audioContext, {
>   type: 'sawtooth',
>   frequency: 440,
> });
>
> // Avoid:
> const osc = new OscillatorNode(audioContext);
> osc.type = 'sawtooth';
> osc.frequency.value = 440;
> ```

---

## 4. Subagent Conversion Checklist

Copy and use this checklist for each migrated guide:

- [ ] **1. Scaffolding**: Created `src/content/guides/<slug>/`.
- [ ] **2. Authentic Documentation**: Created `index.md` with schema
      frontmatter (`title`, `description`, `category`, `order`, `tags`,
      `demoTitle`, `demoDescription`). Preserved concise legacy descriptions
      without invented text or ASCII diagrams.
- [ ] **3. Lifecycle Exports**: `main.js` exports `setup()` (suspends context
      by default and returns `AudioContext`) and `start(context)`.
- [ ] **4. Decoupled UI**: Removed all button listeners and DOM queries from
      `main.js`.
- [ ] **5. URL Resolution**: Used `new URL('...', import.meta.url).href` for
      all worklets, WASM binaries, and audio samples.
- [ ] **6. Safe AudioParam Handling**: Handled both constant (length 1) and
      automated (length 128) states for all parameters in `process()` to
      prevent `NaN` state poisoning and silent audio.
- [ ] **7. Asset Co-location**: Placed all processor scripts, audio, and WASM
      files inside the guide folder.
- [ ] **8. Cleanup**: Deleted legacy `src/content/guides/<slug>.md` and any
      `public/audio-worklet/` mirrors.
- [ ] **9. 80-Column Rule**: Verified line lengths $\le$ 80 characters for all
      touched `.md` and `.js` files.
- [ ] **10. Build & Endpoint Verification**: Ran `npm run build` with 0
      warnings and verified all endpoints with
      `python3 _agents/scripts/check-endpoints.py`.
- [ ] **11. Constructor Options**: Used standard options dictionaries in node
      constructors (e.g. `new OscillatorNode(ctx, {type: 'sawtooth'})`) rather
      than mutating property setters.

[astro-config]:
file:///Users/hongchan/a/web-audio-samples/v4-prototype/astro.config.mjs
[content-config]:
file:///Users/hongchan/a/web-audio-samples/v4-prototype/src/content.config.ts
