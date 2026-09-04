---
title: Hello Audio Worklet!
description: A simple AudioWorkletNode that bypasses incoming audio to output.
category: basic
order: 1
tags:
  - basic
  - bypass
  - audioworklet
demoTitle: Hello Audio Worklet!
demoDescription: Click START to run the bypass processor.
---

## Overview

Demonstrates the minimal configuration required to instantiate an
`AudioWorkletNode` and pass audio through a custom `AudioWorkletProcessor`.
This is the canonical entry point for Web Audio off-thread audio processing.

The audio graph consists of an `OscillatorNode` generating a 440 Hz sine wave
that routes directly into the `AudioWorkletNode` (`bypass-processor`). The
bypasser copies incoming PCM samples untouched to its output, which connects
to `AudioContext.destination`.

AudioWorklet decouples audio processing from the browser main thread, ensuring
glitch-free rendering unaffected by DOM operations, layout recalculations, or
garbage collection pauses.

## Technical Details

### Architecture & Implementation

1. **Main Thread**: The processor script is registered asynchronously via
   `audioContext.audioWorklet.addModule()`. Once registered, the node is
   instantiated and connected to the graph:
   ```javascript
   const processorUrl =
     new URL('bypass-processor.js', import.meta.url).href;
   await audioContext.audioWorklet.addModule(processorUrl);
   const bypasser = new AudioWorkletNode(audioContext, 'bypass-processor');
   oscillatorNode.connect(bypasser).connect(audioContext.destination);
   ```
2. **Audio Rendering Thread**: The `process()` callback executes synchronously
   every 128 sample frames on the dedicated audio thread:
   ```javascript
   process(inputs, outputs) {
     const input = inputs[0];
     const output = outputs[0];
     for (let channel = 0; channel < output.length; ++channel) {
       output[channel].set(input[channel]);
     }
     return true;
   }
   ```

### Additional Notes

- **Render Quantum**: AudioWorklet operates on fixed 128-frame render quanta
  (2.67 ms at 48 kHz, 2.90 ms at 44.1 kHz).
- **Processor Lifetime**: Returning `true` from `process()` keeps the processor
  alive. Returning `false` disposes the processor instance.
- **Specification**:
  [W3C Web Audio API: AudioWorkletProcessor][spec-link].

[spec-link]: https://www.w3.org/TR/webaudio/#AudioWorkletProcessor
