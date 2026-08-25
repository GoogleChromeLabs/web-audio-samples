# W3C Web Audio API - Agenda Issue Buckets Analysis

This report organizes the 76 open enhancements and new features of the Web Audio API repository into strategic categories. This categorization helps the Working Group prioritize discussions for TPAC, highlighting immediate wins, high-impact enhancements, and design proposals.

---

## 🚨 1. Urgent / Soon (High Priority)

These issues are labeled with **Priority: Urgent** or **Priority: Soon** and address critical architecture alignment, safety, or pressing WG deliverables.

| Issue ID | Title | Focus Area | Rationale |
| :--- | :--- | :--- | :--- |
| [#2442](https://github.com/WebAudio/web-audio-api/issues/2442) | Bring Your Own Buffer style of memory management | WebAssembly / Performance | **Urgent:** Critical WebAssembly integration step. Eliminates array copying by allowing custom WASM-compatible buffers in `AudioWorklet`, optimizing high-performance compiled subsystems. |
| [#2423](https://github.com/WebAudio/web-audio-api/issues/2423) | Worker support for BaseAudioContext | Architecture / Workers | **Urgent:** Enables executing the entire audio graph controls off the main thread inside standard Web Workers, securing smooth UI frame rendering. |
| [#2445](https://github.com/WebAudio/web-audio-api/issues/2445) | Incremental delivery of audio data from OfflineAudioContext | Memory / Streaming | **Urgent:** Prevents severe out-of-memory browser crashes when rendering very long audio durations (e.g. 4 hours) by streaming buffer segments progressively. |
| [#2570](https://github.com/WebAudio/web-audio-api/issues/2570) | Mono audio plays on only the left speaker with ChannelSplitterNode | Channel Routing / UX | **Soon:** Fixes a major audio panning bug where mono signals default to the front-left hardware channel rather than upmixing symmetrically. |
| [#2402](https://github.com/WebAudio/web-audio-api/issues/2402) | Phase-offset of oscillator nodes | Audio Synthesis | **Soon:** High developer demand. Standardizes phase modulation parameters, which are required for DX7-style FM synthesis and Pulse Width Modulation. |
| [#469](https://github.com/WebAudio/web-audio-api/issues/469) | Audio nodes should expose their intrinsic latency | Timing / Latency | **Soon:** Critical for timeline alignment. Exposes internal node latency values to enable accurate delay compensation during offline mixing. |

---

## 🕰️ 2. Old, but Highly Valuable for Developers

These issues date back several years (some to the inception of Web Audio) and represent long-standing pain points that developers frequently have to implement complex userspace workarounds to solve.

*   **[Issue #2397](https://github.com/WebAudio/web-audio-api/issues/2397): Exposing a `playbackPosition` property on `AudioBufferSourceNode` (2014)**
    *   *Developer Benefit*: The absolute holy grail for audio players and DAWs. Currently, tracking playback time during active pitch automation requires complex, inaccurate integrations in JavaScript. Exposing this read-only time value natively simplifies pause/resume states and multi-buffer sync.
    *   *Hashtags*: #AudioBufferSourceNode #playbackPosition #timeline-sync
*   **[Issue #2396](https://github.com/WebAudio/web-audio-api/issues/2396): Storing AudioBuffers in native sample bit depth (2014)**
    *   *Developer Benefit*: Modern web games and rich audio apps consume hundreds of megabytes of audio assets. Forcing all buffers to 32-bit float arrays in RAM double memory footprint. Allowing native 16-bit integer storage in RAM cuts memory usage by **50%**.
    *   *Hashtags*: #AudioBuffer #16-bit-audio #MemoryOptimization
*   **[Issue #2395](https://github.com/WebAudio/web-audio-api/issues/2395): Add a native `NoiseGate` / `Expander` Node (2012)**
    *   *Developer Benefit*: Crucial for recording apps and microphonic filters. Developers currently must write heavy custom script nodes or worklets to gate microphone silence, which adds processing latency. A native node solves this instantly.
    *   *Hashtags*: #NoiseGate #DynamicsControl #MicrophoneInput
*   **[Issue #469](https://github.com/WebAudio/web-audio-api/issues/469): Audio nodes should expose their intrinsic latency (2015)**
    *   *Developer Benefit*: Multi-stage effects chains (compressors, waveshapers, spatializers) add subtle rendering delays, throwing off sub-sample track alignment. Exposing this value allows DAWs to calculate and compensate for signal delays perfectly.
    *   *Hashtags*: #intrinsic-latency #latency-compensation #offline-rendering

---

## ⚡ 3. Essential Enhancements (Most Important 3~4)

High-impact improvements to existing node classes and structures that correct major resource leaks, performance locks, or routing design limitations.

*   **[Issue #2658](https://github.com/WebAudio/web-audio-api/issues/2658): Disconnected `AudioWorkletNode` continues to run `process()`**
    *   *Impact*: A major silent battery and CPU drain. When a worklet node is disconnected from the active destination graph, browser engines continue to call its internal `process()` loop. Standardizing a suspended state for disconnected nodes prevents massive resource leaks.
    *   *Hashtags*: #AudioWorkletNode #ResourceLeak #PerformanceOptimization
*   **[Issue #2446](https://github.com/WebAudio/web-audio-api/issues/2446): Use `SharedArrayBuffer` for `getChannelData`**
    *   *Impact*: Crucial for heavy number-crunching (reverb synthesis, peak detection). Currently, copying massive 200MB buffers to Web Workers blocks the main UI thread. Returning shared backing arrays enables lightning-fast background processing.
    *   *Hashtags*: #SharedArrayBuffer #WebWorkers #Performance
*   **[Issue #2449](https://github.com/WebAudio/web-audio-api/issues/2449): Allow setting Convolver buffer asynchronously**
    *   *Impact*: Prevents UI stutter. Setting impulse buffers on `ConvolverNode` is currently synchronous, blocking the main UI thread for up to 35ms for large room impulses. An async promise-based setter allows off-main-thread impulse configuration safely.
    *   *Hashtags*: #ConvolverNode #AsynchronousAPI #MainThreadStutter
*   **[Issue #2438](https://github.com/WebAudio/web-audio-api/issues/2438): Change `outputChannelCount` dynamically after instantiation**
    *   *Impact*: Advanced spatializers and mixing nodes must dynamically scale their channel topologies (e.g., stereo to quad or 5.1 surround) in real time. Allowing dynamic output channel modifications avoids having to tear down and reinstantiate worklets.
    *   *Hashtags*: #AudioWorkletNode #outputChannelCount #DynamicRouting

---

## 🚀 4. Priority New Features (Most Important 3~4)

Major architectural additions that expand the platform's capabilities, introducing modern web standards and modular paradigms.

*   **[Issue #2423](https://github.com/WebAudio/web-audio-api/issues/2423): Worker support for `BaseAudioContext`**
    *   *Impact*: Decouples audio thread execution entirely from DOM and Window lifecycles. This is the single most important architectural step for professional audio development on the web, bringing desktop-class reliability to audio apps.
    *   *Hashtags*: #WebWorkers #OffscreenAudio #Architecture
*   **[Issue #2651](https://github.com/WebAudio/web-audio-api/issues/2651): Create a `DecoderSourceNode` integrating WebCodecs**
    *   *Impact*: Solves latency and race conditions when decoding compressed audio. Instead of manually slicing and decoding audio chunks in JavaScript (which causes stutter gaps), the native audio thread handles just-in-time decoding directly from WebCodecs streams.
    *   *Hashtags*: #DecoderSourceNode #WebCodecs #AsynchronousStreaming
*   **[Issue #2436](https://github.com/WebAudio/web-audio-api/issues/2436): Support Nesting AudioNodes (`ContainerNode`)**
    *   *Impact*: Introduces a modular component paradigm. Standardizing an outer container interface enables developers to package complex node sub-graphs (e.g. a complete custom synthesizer with reverb, filters, and delays) and share them via npm cleanly.
    *   *Hashtags*: #ContainerNode #AudioNode-nesting #ModularComponents
*   **[Issue #2487](https://github.com/WebAudio/web-audio-api/issues/2487): Playback rate adjustment without altering pitch (Time-Stretching)**
    *   *Impact*: Replicates the standard pitch-preservation behaviors of `<video>` and `<audio>` tags. Native time-stretching on `AudioBufferSourceNode` eliminates the need for developers to load heavy, complex userspace DSP libraries to change speed cleanly.
    *   *Hashtags*: #playbackRate #TimeStretching #DSP

---

## 🧪 5. Ideal for AudioWorklet Prototyping

These proposed nodes can be completely implemented and tested as userspace libraries using `AudioWorkletNode` (and optionally compiled WebAssembly) before standardizing native implementations.

1.  **[Issue #2395](https://github.com/WebAudio/web-audio-api/issues/2395): NoiseGate / Expander Node**
    *   *Prototyping*: Envelope analysis (attack/decay/hold times) and threshold attenuation parameters are easy to model mathematically inside an `AudioWorkletProcessor` to find perfect default curve constants.
2.  **[Issue #2416](https://github.com/WebAudio/web-audio-api/issues/2416): NoiseGenerator Node (White/Pink noise)**
    *   *Prototyping*: White noise (random distributions) and pink noise (filtered decay curves) generators are simple, lightweight mathematical functions that can be written in standard JS worklet scripts in under 20 lines of code.
3.  **[Issue #2418](https://github.com/WebAudio/web-audio-api/issues/2418): Bandlimited pulse oscillator with `a-rate` pulseWidth**
    *   *Prototyping*: Modeling mark-space ratios and resolving aliasing transients via band-limiting filters (e.g. DPW method) is ideal for testing in compiled C++/Wasm within a worklet before committing to a native engine pipeline.
4.  **[Issue #2443](https://github.com/WebAudio/web-audio-api/issues/2443): Real-time pitch shifting (Pitch adjustment)**
    *   *Prototyping*: Pitch shifting algorithms (like Phase Vocoders or PSOLA) have highly subjective acoustic quality and CPU cost. Prototyping distinct models in a worklet enables testing subjective trade-offs before standardizing one.

---

## 🍏 6. Low-Hanging Fruits (Easiest Wins)

These 10 issues are minor spec typos, enum updates, or straightforward parameters that can be drafted, edited, and integrated with minimal debate.

1.  **[Issue #2319](https://github.com/WebAudio/web-audio-api/issues/2319): `AudioNode.connect()` Parameter Description Typo**
    *   *Fix*: Update the parameter description table to state that the `input` parameter is optional, aligning it perfectly with the actual WebIDL definition.
2.  **[Issue #2668](https://github.com/WebAudio/web-audio-api/issues/2668): `AudioBufferSourceOptions.buffer` default value**
    *   *Fix*: Adjust the dictionary spec so that the `buffer` parameter defaults to `null` instead of throwing or needing custom validation code when missing.
3.  **[Issue #2663](https://github.com/WebAudio/web-audio-api/issues/2663): Add `renderSizeHint` to `AudioContext` constructor**
    *   *Fix*: Add constructor parameter mappings for `renderSizeHint` to `AudioContextOptions` (mirroring `OfflineAudioContextOptions`) to ensure constructor parity.
4.  **[Issue #2599](https://github.com/WebAudio/web-audio-api/issues/2599): Standardize `"HRTF"` casing in enums**
    *   *Fix*: Rename `"HRTF"` to `"hrtf"` in the `PanningModelType` enum to comply with standard Web Design Principles requiring lowercase hyphen-separated tags.
5.  **[Issue #2598](https://github.com/WebAudio/web-audio-api/issues/2598): Restrict constructor `sinkId` in insecure contexts**
    *   *Fix*: Add spec text indicating that instantiating `AudioContext` with a custom `sinkId` in an insecure context throws a `NotAllowedError` (aligning with `setSinkId`).
6.  **[Issue #2566](https://github.com/WebAudio/web-audio-api/issues/2566): Handle unconnected `AudioWorkletNode` outputs**
    *   *Fix*: Extend disconnected input logic to outputs, updating the spec to state that a disconnected output returns a zero-length channel array.
7.  **[Issue #2553](https://github.com/WebAudio/web-audio-api/issues/2553): Add `atob()` to `AudioWorkletGlobalScope`**
    *   *Fix*: Expose the standard utility `atob()` inside the worklet scope, inheriting it directly from `WorkletGlobalScope` where it is already supported.
8.  **[Issue #2412](https://github.com/WebAudio/web-audio-api/issues/2412): Extend `DynamicsCompressorNode` release maximum limit**
    *   *Fix*: Increase the maximum limit of the compressor's `release` parameter from 1.0s to 5.0s to support slower gain-recovery profiles.
9.  **[Issue #2405](https://github.com/WebAudio/web-audio-api/issues/2405): Add `detune` parameter to `ConstantSourceNode`**
    *   *Fix*: Standardize a `detune` AudioParam on `ConstantSourceNode` to match the modulation capabilities of other source nodes (`OscillatorNode`, `AudioBufferSourceNode`).
10. **[Issue #2403](https://github.com/WebAudio/web-audio-api/issues/2403): Expose array parameters on `PeriodicWave`**
    *   *Fix*: Expose read-only, immutable copies of the `real` and `imag` arrays used to create `PeriodicWave` to support state serialization and debugging.
