---
title: Hello Audio Worklet!
description: A simple AudioWorkletNode that bypasses incoming audio to output.
category: basic
order: 1
tags:
  - basic
  - bypass
  - audioworklet
---

<div
  id="demo-box"
  class="my-6 rounded-xl border border-blue-400/60 bg-blue-50/20 shadow-sm
    overflow-hidden transition-all duration-200"
>
  <div class="p-5 flex flex-col justify-between gap-6 min-h-[110px]">
    <div class="space-y-1">
      <h3 class="text-sm font-semibold text-slate-900">
        Audio Playback Check
      </h3>
      <p class="text-xs text-slate-500">
        Click START to run the bypass worklet node.
      </p>
    </div>
    <div class="flex justify-end items-center">
      <div
        id="demo-pill-group"
        class="inline-flex items-stretch rounded-full bg-blue-600 shadow-sm
          text-white transition-colors duration-150 overflow-hidden"
      >
        <button
          id="button-start"
          type="button"
          class="w-20 py-1.5 text-center text-xs font-semibold tracking-wide
            transition hover:bg-black/10 cursor-pointer disabled:opacity-50"
        >
          START
        </button>
        <div class="w-px bg-white/30 my-1"></div>
        <button
          id="button-toggle-telemetry"
          type="button"
          class="px-2.5 py-1.5 flex items-center justify-center transition
            hover:bg-black/10 cursor-pointer text-xs"
          aria-label="Toggle Audio Diagnostics"
          title="Toggle Audio Diagnostics"
        >
          <svg
            class="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
  <div
    id="telemetry-panel"
    class="hidden border-t border-blue-200/60 bg-white/60 px-5 py-3 text-xs
      text-slate-600"
  >
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <div>
        <span class="block text-[10px] uppercase font-semibold text-slate-400">
          Context State
        </span>
        <span
          id="telemetry-context-state"
          class="font-mono font-semibold text-slate-500"
        >
          uninitialized
        </span>
      </div>
      <div>
        <span class="block text-[10px] uppercase font-semibold text-slate-400">
          Sample Rate
        </span>
        <span id="telemetry-sample-rate" class="font-mono text-slate-800">
          --
        </span>
      </div>
      <div>
        <span class="block text-[10px] uppercase font-semibold text-slate-400">
          Base Latency
        </span>
        <span id="telemetry-base-latency" class="font-mono text-slate-800">
          --
        </span>
      </div>
      <div>
        <span class="block text-[10px] uppercase font-semibold text-slate-400">
          Output Latency
        </span>
        <span id="telemetry-output-latency" class="font-mono text-slate-800">
          --
        </span>
      </div>
      <div>
        <span class="block text-[10px] uppercase font-semibold text-slate-400">
          Glitch Status
        </span>
        <span id="telemetry-glitch-status" class="font-mono text-emerald-600">
          0 detected
        </span>
      </div>
    </div>
  </div>
</div>

<script
  type="module"
  src="./main.js"
></script>

<div class="overview-teaser-wrapper relative">
  <div id="overview-content" class="overview-teaser-content is-collapsed">

## Overview

`AudioWorklet` lets you run custom audio processing off the main thread,
greatly reducing the risk of audio glitches and dropouts from heavy UI work.

This starter example is a basic bypass node that takes an incoming 440 Hz sine
tone and forwards it straight to your speakers unchanged.

This simple Web Audio graph connects three core components:
1. **`OscillatorNode`**: Generates a 440 Hz sine wave tone.
2. **`AudioWorkletNode`** and **`AudioWorkletProcessor`**: Forwards input
   channels directly to output channels using `BypassProcessor`
   (in `bypass-processor.js`).
3. **`AudioDestinationNode`**: Browser audio output (speakers / headphones).

### Main Thread Setup

On the main thread, the `AudioWorkletProcessor` module is loaded
asynchronously using `audioContext.audioWorklet.addModule()`, and then
connected into the Web Audio graph:

```javascript
// main.js
const audioContext = new AudioContext();

// 1. Load the processor script into the audio worklet thread
await audioContext.audioWorklet.addModule('bypass-processor.js');

// 2. Instantiate the custom AudioWorkletNode
const bypasser = new AudioWorkletNode(audioContext, 'bypass-processor');

// 3. Connect nodes: Oscillator -> BypassWorklet -> Destination
const oscillator = new OscillatorNode(audioContext);
oscillator.connect(bypasser).connect(audioContext.destination);
oscillator.start();
```

### Audio Thread Setup

This `AudioWorkletProcessor` script runs on the audio rendering thread.

```javascript
// bypass-processor.js
class BypassProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    for (let channel = 0; channel < output.length; ++channel) {
      output[channel].set(input[channel]);
    }

    return true;
  }
}

registerProcessor('bypass-processor', BypassProcessor);
```

For more background on the architecture, see the
[Chrome Developers article on AudioWorklet][article-link].

[article-link]: https://developer.chrome.com/blog/audio-worklet/

  </div>
  <div id="overview-fade-overlay" class="overview-fade-overlay">
    <button
      id="overview-toggle-btn"
      type="button"
      class="overview-chip-btn"
      aria-expanded="false"
    >
      <span class="btn-text">See more</span>
      <svg
        class="btn-icon w-3.5 h-3.5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0
            111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0
            01.02-1.06z"
          clip-rule="evenodd"
        />
      </svg>
    </button>
  </div>
</div>
