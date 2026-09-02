---
title: AudioWorklet, SharedArrayBuffer, and Worker
description: >
  Lock-free SharedArrayBuffer communication between AudioWorklet and
  DedicatedWorker.
category: design-pattern
order: 1
tags:
  - design-pattern
  - sharedarraybuffer
  - worker
  - atomics
  - audioworklet
demoTitle: SharedArrayBuffer Worker Pattern
demoDescription: >
  Click START to run the lock-free SharedArrayBuffer audio pipeline.
---

## Overview

Demonstrates a lock-free, zero-copy audio pipeline combining an
`AudioWorkletProcessor` with a backend `DedicatedWorker` using
`SharedArrayBuffer` and `Atomics`.

Audio samples synthesized inside the `DedicatedWorker` are transferred to the
`AudioWorkletProcessor` through a shared circular ring buffer allocated inside a
`SharedArrayBuffer`. The worklet routes the decoded audio stream directly to
`AudioContext.destination`.

Synchronization is coordinated using atomic state flags via `Atomics.wait()` and
`Atomics.notify()`. This isolates intensive computations on a background worker
thread while maintaining deterministic 128-frame delivery on the audio thread.

## Technical Details

### Architecture & Implementation

1. **Audio Thread Wakeup**: The worklet processor notifies the worker when
   additional frames are required:
   ```javascript
   // Wake worker if space is available:
   Atomics.store(States, STATE.REQUEST_RENDER, 1);
   Atomics.notify(States, STATE.REQUEST_RENDER, 1);
   ```
2. **Worker Synchronization**: The dedicated worker sleeps via
   `Atomics.wait()` until woken by the audio thread:
   ```javascript
   function waitOnRenderRequest() {
     while (Atomics.wait(States, STATE.REQUEST_RENDER, 0) === 'ok') {
       processKernel();
       States[STATE.OB_FRAMES_AVAILABLE] += CONFIG.kernelLength;
       Atomics.store(States, STATE.REQUEST_RENDER, 0);
     }
   }
   ```

### Shared Memory Layout

| Buffer Region | TypedArray View | Purpose |
| :--- | :--- | :--- |
| `States` | `Int32Array` | Atomic sync flags (`REQUEST_RENDER`, frame counts) |
| `AudioData` | `Float32Array` | Circular lock-free audio sample storage |

### Additional Notes

- **Cross-Origin Isolation**: `SharedArrayBuffer` requires `COOP: same-origin`
  and `COEP: require-corp` HTTP response headers.
- **Zero Realtime Blocking**: `Atomics.wait()` blocks the worker thread, but
  is strictly forbidden on the audio rendering thread. The processor uses
  non-blocking atomic stores and notifies.
- **Reference**:
  [Chrome Developers: AudioWorklet Design Patterns][article-link].

[article-link]: https://developer.chrome.com/blog/audio-worklet-design-pattern/
