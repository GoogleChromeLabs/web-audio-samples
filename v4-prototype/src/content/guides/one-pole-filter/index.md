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

A one-pole IIR lowpass filter implementation using `AudioWorkletNode`. An audio
source connects to the one-pole filter, and an `AudioParam` automation ramps the
cutoff frequency across the audio spectrum.

This Web Audio graph connects three core components:
1. **`OscillatorNode`**: A sawtooth wave oscillator rich in harmonics to
   demonstrate the filter sweep effect.
2. **`AudioWorkletNode`** and **`AudioWorkletProcessor`**: Implements the
   one-pole IIR filter algorithm in `OnePoleProcessor` (in
   `one-pole-processor.js`), accepting a dynamic `frequency` `AudioParam`.
3. **`AudioDestinationNode`**: Browser audio output (speakers / headphones).

### Main Thread Setup

On the main thread, the `AudioWorkletProcessor` module is loaded
asynchronously using `audioContext.audioWorklet.addModule()`. When playback
starts, the cutoff frequency is automated with exponential ramps:

```javascript
// main.js
let audioContext = null;
let oscillatorNode = null;
let filterNode = null;

// 1. Setup audio graph and register processor
export const setup = async () => {
  audioContext = new AudioContext();
  await audioContext.suspend();

  const processorUrl =
    new URL('one-pole-processor.js', import.meta.url).href;
  await audioContext.audioWorklet.addModule(processorUrl);

  oscillatorNode = new OscillatorNode(audioContext, {type: 'sawtooth'});
  filterNode = new AudioWorkletNode(audioContext, 'one-pole-processor');

  oscillatorNode.connect(filterNode).connect(audioContext.destination);
  return audioContext;
};

// 2. Start rendering and trigger frequency automation on user gesture
export const start = async (context) => {
  if (oscillatorNode && filterNode) {
    const frequencyParam = filterNode.parameters.get('frequency');
    const now = context.currentTime;

    frequencyParam.cancelScheduledValues(now);
    frequencyParam
      .setValueAtTime(200, now)
      .exponentialRampToValueAtTime(context.sampleRate * 0.5, now + 4.0)
      .exponentialRampToValueAtTime(200, now + 8.0);

    try {
      oscillatorNode.start();
    } catch {
      // Node was already started.
    }
  }
};
```

### Audio Thread Setup

This `AudioWorkletProcessor` script runs on the audio rendering thread,
updating filter coefficients and applying the difference equation
$y[n] = x[n] \cdot a_0 + y[n-1] \cdot b_1$:

```javascript
// one-pole-processor.js
class OnePoleProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{
      name: 'frequency',
      defaultValue: 250,
      minValue: 0,
      maxValue: 0.5 * sampleRate,
    }];
  }

  constructor() {
    super();
    this.updateCoefficientsWithFrequency_(250);
  }

  updateCoefficientsWithFrequency_(frequency) {
    this.b1_ = Math.exp(-2 * Math.PI * frequency / sampleRate);
    this.a0_ = 1.0 - this.b1_;
    this.z1_ = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || input.length === 0) return true;

    const frequency = parameters.frequency;
    const isFrequencyConstant = frequency.length === 1;

    for (let channel = 0; channel < output.length; ++channel) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      if (!inputChannel) continue;

      if (isFrequencyConstant) {
        this.updateCoefficientsWithFrequency_(frequency[0]);
      }

      for (let i = 0; i < outputChannel.length; ++i) {
        if (!isFrequencyConstant) {
          this.updateCoefficientsWithFrequency_(frequency[i]);
        }
        this.z1_ = inputChannel[i] * this.a0_ + this.z1_ * this.b1_;
        outputChannel[i] = this.z1_;
      }
    }

    return true;
  }
}

registerProcessor('one-pole-processor', OnePoleProcessor);
```

For more background on the architecture, see the
[Chrome Developers article on AudioWorklet][article-link].

[article-link]: https://developer.chrome.com/blog/audio-worklet/
