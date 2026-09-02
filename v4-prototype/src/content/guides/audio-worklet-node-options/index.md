---
title: AudioWorkletNode Options
description: >
  Pass custom initialization options to AudioWorkletProcessor constructors.
category: basic
order: 8
tags:
  - basic
  - options
  - audioworklet
demoTitle: AudioWorkletNode Options
demoDescription: >
  Select a waveform type and frequency, then click START to instantiate
  the node.
---

## Overview

Demonstrates passing arbitrary initialization options from the main thread
into an `AudioWorkletProcessor` constructor using `processorOptions`.

The audio graph consists of the `AudioWorkletNode` (`oscillator-processor`)
synthesizing audio with user-selected waveform and frequency values, routing
directly into `AudioContext.destination`.

Constructor options eliminate the latency of establishing a secondary handshake
over `MessagePort` just to pass startup parameters to a newly spawned worklet.

## Technical Details

### Architecture & Implementation

1. **Main Thread Instantiation**: Pass configuration inside
   `processorOptions`:
   ```javascript
   workletNode = new AudioWorkletNode(context, 'oscillator-processor', {
     processorOptions: {
       waveformType: 'sawtooth',
       frequency: 440,
     },
   });
   workletNode.connect(context.destination);
   ```
2. **Audio Thread Reception**: The options object is delivered directly to the
   `AudioWorkletProcessor` constructor:
   ```javascript
   class OscillatorProcessor extends AudioWorkletProcessor {
     constructor(options) {
       super();
       const { waveformType, frequency } =
         options?.processorOptions || {};
       this.frequency = frequency || 440;
       this.outputFunction = getWaveformGenerator(waveformType);
     }
     // ...
   }
   ```

### Constructor Options Schema

| Option Field | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `waveformType` | String | `'sine'` | Waveform generator mode |
| `frequency` | Number | 440 | Fundamental frequency (Hz) |

### Additional Notes

- **Structured Cloning**: `processorOptions` is cloned via the structured clone
  algorithm. Non-cloneable entities (functions, DOM nodes) will throw a
  `DataCloneError`.
- **One-Time Initialization**: Unlike `AudioParam`, `processorOptions` cannot
  be modified after instantiation. Dynamic changes require `MessagePort` or
  parameters.
- **Specification Reference**:
  [W3C Web Audio API: AudioWorkletNodeOptions][spec-link].

[spec-link]: https://www.w3.org/TR/webaudio/#AudioWorkletNodeOptions
