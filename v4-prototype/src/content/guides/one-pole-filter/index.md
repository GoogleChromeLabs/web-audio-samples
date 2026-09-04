---
title: One Pole Filter
description: >
  A one-pole filter implementation with AudioWorkletNode demonstrating
  filter parameter sweeps.
category: basic
order: 5
tags:
  - basic
  - filter
  - audioparam
  - one-pole
  - audioworklet
demoTitle: One Pole Filter
demoDescription: Click START to run the one-pole filter frequency sweep.
---

## Overview

Implements a one-pole Infinite Impulse Response (IIR) lowpass filter with a
dynamic, audio-rate cutoff frequency `AudioParam`.

The audio graph connects a sawtooth `OscillatorNode` into the `AudioWorkletNode`
(`one-pole-processor`), which connects directly to `AudioContext.destination`.
The rich harmonic content of the sawtooth wave makes the cutoff filter sweeps
prominently audible.

During playback, the main thread schedules continuous exponential sweeps of the
cutoff frequency across the spectrum, recalculating filter coefficients per
sample frame directly on the audio thread.

## Technical Details

### Architecture & Implementation

1. **Automation Ramp**: The main thread schedules exponential sweeps across
   the spectrum:
   ```javascript
   const freq = filterNode.parameters.get('frequency');
   freq.setValueAtTime(200, now)
     .exponentialRampToValueAtTime(context.sampleRate * 0.5, now + 4.0)
     .exponentialRampToValueAtTime(200, now + 8.0);
   ```
2. **Audio Thread Processing**: When automated, coefficients recalculate per
   sample frame, updating the recursive delay state
   <math><msub><mi>z</mi><mn>1</mn></msub></math>:
   ```javascript
   for (let i = 0; i < outputChannel.length; ++i) {
     if (!isFrequencyConstant) {
       this.updateCoefficientsWithFrequency_(frequency[i]);
     }
     this.z1_ = inputChannel[i] * this.a0_ + this.z1_ * this.b1_;
     outputChannel[i] = this.z1_;
   }
   ```

### Filter Difference Equation

The discrete-time one-pole lowpass filter difference equation is:

<div class="math-block">
  <math display="block">
    <mrow>
      <mi>y</mi>
      <mo stretchy="false">[</mo>
      <mi>n</mi>
      <mo stretchy="false">]</mo>
      <mo>=</mo>
      <mi>x</mi>
      <mo stretchy="false">[</mo>
      <mi>n</mi>
      <mo stretchy="false">]</mo>
      <mo>&sdot;</mo>
      <msub><mi>a</mi><mn>0</mn></msub>
      <mo>+</mo>
      <mi>y</mi>
      <mo stretchy="false">[</mo>
      <mi>n</mi>
      <mo>&minus;</mo>
      <mn>1</mn>
      <mo stretchy="false">]</mo>
      <mo>&sdot;</mo>
      <msub><mi>b</mi><mn>1</mn></msub>
    </mrow>
  </math>
</div>

Where filter coefficients are derived per cutoff frequency
<math><msub><mi>f</mi><mi>c</mi></msub></math> and sample rate
<math><msub><mi>f</mi><mi>s</mi></msub></math>:

<div class="math-block">
  <math display="block">
    <mrow>
      <msub><mi>b</mi><mn>1</mn></msub>
      <mo>=</mo>
      <msup>
        <mi>e</mi>
        <mrow>
          <mo>&minus;</mo>
          <mn>2</mn>
          <mi>&pi;</mi>
          <mo stretchy="false">(</mo>
          <msub><mi>f</mi><mi>c</mi></msub>
          <mo>/</mo>
          <msub><mi>f</mi><mi>s</mi></msub>
          <mo stretchy="false">)</mo>
        </mrow>
      </msup>
    </mrow>
  </math>
</div>

<div class="math-block">
  <math display="block">
    <mrow>
      <msub><mi>a</mi><mn>0</mn></msub>
      <mo>=</mo>
      <mn>1.0</mn>
      <mo>&minus;</mo>
      <msub><mi>b</mi><mn>1</mn></msub>
    </mrow>
  </math>
</div>

### Parameter Specifications

| Parameter | Type | Default | Range | Automation Rate |
| :--- | :--- | :--- | :--- | :--- |
| `frequency` | Float32 | 250 | [0, 0.5 * sampleRate] | a-rate (128 frames) |

### Additional Notes

- **State Continuity**: The delay state `this.z1_` persists across 128-frame
  render quanta to avoid boundary discontinuities.
- **Nyquist Limit**: The cutoff frequency must not exceed half the sample
  rate (<math><msub><mi>f</mi><mi>s</mi></msub><mo>/</mo><mn>2</mn></math>)
  to preserve filter stability.
- **Specification**:
  [W3C Web Audio API: AudioWorkletProcessor][spec-link].

[spec-link]: https://www.w3.org/TR/webaudio/#AudioWorkletProcessor
