---
title: AudioWorklet and WebAssembly
description: >
  Execute compiled C/C++ audio processing kernels inside AudioWorklet with
  WebAssembly.
category: design-pattern
order: 2
tags:
  - design-pattern
  - webassembly
  - wasm
  - emscripten
  - audioworklet
demoTitle: AudioWorklet and WebAssembly
demoDescription: >
  Click START to run the WebAssembly audio processing kernel.
---

## Overview

Demonstrates hosting a compiled C++ audio DSP kernel inside an
`AudioWorkletProcessor` using WebAssembly (WASM) and typed linear heap views.

The audio graph connects a 440 Hz sine wave `OscillatorNode` into the
`AudioWorkletNode` (`wasm-worklet-processor`), which connects directly to
`AudioContext.destination`.

Incoming Web Audio `Float32Array` sample buffers are copied directly into the
WebAssembly linear memory heap (`HEAPF32`) at a pre-allocated input pointer.
The C++ processing kernel executes in-place, writing transformed audio into an
output heap buffer that is copied back to the Web Audio output channels.

## Technical Details

### Architecture & Implementation

1. **WASM Module Loading**: The processor dynamically loads and compiles
   the Emscripten module upon instantiation:
   ```javascript
   Module().then((module) => {
     this.module = module;
     this._heapInput = new FreeQueue(module, 128, 2);
     this._heapOutput = new FreeQueue(module, 128, 2);
     this._kernel = new module.SimpleKernel();
   });
   ```
2. **Synchronous Kernel Execution**: In `process()`, channel data is written
   to the heap, processed by the kernel, and read back:
   ```javascript
   for (let ch = 0; ch < channelCount; ++ch) {
     this._heapInput.getChannelData(ch).set(inputs[0][ch]);
   }
   this._kernel.process(
     this._heapInput.getHeapAddress(),
     this._heapOutput.getHeapAddress(),
     channelCount
   );
   for (let ch = 0; ch < channelCount; ++ch) {
     outputs[0][ch].set(this._heapOutput.getChannelData(ch));
   }
   ```

### Memory Architecture

| Component | Space | Allocation Lifecycle |
| :--- | :--- | :--- |
| `SimpleKernel` | C++ heap | Instantiated once on initialization |
| `FreeQueue` Views | `HEAPF32` | Pre-allocated typed views via `_malloc` |
| Render Buffers | Audio thread | Fixed 128-frame render quanta |

### Additional Notes

- **Zero Realtime Allocations**: Memory allocation (`_malloc`) is strictly
  confined to the constructor. Invoking `_malloc` or `new` inside `process()`
  causes garbage collection pauses and audio dropouts.
- **Memory Pointer Alignment**: DSP kernels require 32-bit aligned float
  pointers when accessing linear memory.
- **Reference**:
  [Chrome Developers: AudioWorklet Design Patterns][article-link].

[article-link]: https://developer.chrome.com/blog/audio-worklet-design-pattern/
