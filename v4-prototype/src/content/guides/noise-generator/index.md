---
title: Noise Generator with Modulation
description: >
  A noise generator with a user-defined AudioParam modulated by an
  OscillatorNode.
category: basic
order: 2
tags:
  - basic
  - noise
  - audioparam
  - modulation
  - audioworklet
demoTitle: Noise Generator with Modulation
demoDescription: Click START to run the noise generator demo.
---

## Overview

Demonstrates defining a custom `AudioParam` within an `AudioWorkletProcessor`
and modulating its value with native Web Audio API nodes.

The audio graph sets up an `OscillatorNode` running at 0.5 Hz that routes
through a `GainNode` to modulate the `amplitude` AudioParam of the
`AudioWorkletNode` (`noise-generator`). The noise generator produces white
noise multiplied by the dynamic amplitude value and connects directly to
`AudioContext.destination`.

This pattern demonstrates how custom worklet parameters seamlessly integrate
into the Web Audio graph, allowing sample-accurate automation without manual
thread synchronization.

## Technical Details

### Architecture & Implementation

1. **Parameter Registration**: The processor registers custom parameters via
   the static `parameterDescriptors` getter:
   ```javascript
   static get parameterDescriptors() {
     return [
       { name: 'amplitude', defaultValue: 0.25, minValue: 0, maxValue: 1 },
     ];
   }
   ```
2. **Audio-Rate Modulation**: An `OscillatorNode` connects directly to the
   worklet's `amplitude` parameter through a `GainNode`:
   ```javascript
   const paramAmp = noiseGeneratorNode.parameters.get('amplitude');
   modulatorNode.connect(modGainNode).connect(paramAmp);
   ```
3. **Dynamic Evaluation**: Inside `process()`, check whether `amplitude` is
   constant (`length === 1`, k-rate) or automated (`length === 128`, a-rate):
   ```javascript
   const amplitude = parameters.amplitude;
   const isConstant = amplitude.length === 1;
   for (let i = 0; i < outputChannel.length; ++i) {
     const amp = isConstant ? amplitude[0] : amplitude[i];
     outputChannel[i] = (Math.random() * 2 - 1) * amp;
   }
   ```

### Parameter Specifications

| Parameter | Type | Default | Range | Automation Rate |
| :--- | :--- | :--- | :--- | :--- |
| `amplitude` | Float32 | 0.25 | [0, 1] | a-rate (128 frames) / k-rate |

### Additional Notes

- **Direct Modulation**: Connecting an audio node to an `AudioParam` performs
  sample-accurate summing on the audio rendering thread at full sample rate.
- **Specification**:
  [W3C Web Audio API: AudioParam][spec-link].

[spec-link]: https://www.w3.org/TR/webaudio/#AudioParam
