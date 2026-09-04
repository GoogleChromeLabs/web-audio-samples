---
title: BitCrusher with AudioParam
description: >
  BitCrusher example demonstrating dynamic AudioParam automations.
category: basic
order: 3
tags:
  - basic
  - bitcrusher
  - audioparam
  - audioworklet
demoTitle: BitCrusher with AudioParam
demoDescription: Click START to run the 8-second demo.
---

## Overview

Implements a non-linear bit-depth and sample-rate reduction processor based on
the W3C Web Audio API specification, demonstrating dynamic `AudioParam`
automation.

The audio graph connects a 5 kHz sawtooth `OscillatorNode` through the
`AudioWorkletNode` (`bit-crusher-processor`), which connects directly to
`AudioContext.destination`.

During playback, the main thread schedules linear and exponential automation
curves on the `frequencyReduction` parameter, while the processor performs
sample quantization and sample-and-hold downsampling on the audio thread.

## Technical Details

### Architecture & Implementation

1. **Parameter Registration**: Custom `AudioParam` descriptors are declared
   in the processor:
   ```javascript
   static get parameterDescriptors() {
     return [
       { name: 'bitDepth', defaultValue: 12, minValue: 1, maxValue: 16 },
       {
         name: 'frequencyReduction',
         defaultValue: 0.5,
         minValue: 0,
         maxValue: 1,
       },
     ];
   }
   ```
2. **Scheduling Automation**: The main thread schedules ramps via native
   `AudioParam` methods:
   ```javascript
   paramReduction.setValueAtTime(0.01, now);
   paramReduction.linearRampToValueAtTime(0.1, now + 4);
   paramReduction.exponentialRampToValueAtTime(0.01, now + 8);
   ```
3. **Handling Variable Rates**: Inside `process()`, check whether parameter
   arrays are constant (length 1) or automated per frame (length 128):
   ```javascript
   const isReductionConstant = parameters.frequencyReduction.length === 1;
   for (let i = 0; i < inputChannel.length; ++i) {
     const reduction = isReductionConstant
       ? parameters.frequencyReduction[0]
       : parameters.frequencyReduction[i];
     this.phase_ += reduction;
     // ...
   }
   ```

### Parameter Specifications

| Parameter | Type | Default | Range | Automation Rate |
| :--- | :--- | :--- | :--- | :--- |
| `bitDepth` | Float32 | 12 | [1, 16] | k-rate |
| `frequencyReduction` | Float32 | 0.5 | [0, 1] | a-rate (128 frames) |

### Additional Notes

- **Quantization Math**: Sample quantization uses uniform midpoint step
  sizing: `step = Math.pow(0.5, bitDepth)`.
- **Parameter Array Allocation**: The browser allocates a single 128-element
  typed array per automated parameter per quantum, avoiding runtime garbage
  collection.
- **Specification**:
  [W3C Web Audio API: BitCrusher Example][spec-link].

[spec-link]: https://www.w3.org/TR/webaudio/#the-bitcrusher-node
