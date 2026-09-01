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

A simple noise generator with a user-defined `AudioParam` modulated by an
`OscillatorNode`. The modulation on a gain parameter creates a tremolo effect.

This simple Web Audio graph connects three core components:
1. **`OscillatorNode`**: A 0.5 Hz low-frequency oscillator (LFO) acting as a
   modulator.
2. **`GainNode`**: Scales the modulator depth (gain of 0.75) before connecting
   to the worklet's `amplitude` parameter.
3. **`AudioWorkletNode`** and **`AudioWorkletProcessor`**: Generates white noise
   using `NoiseGenerator` (in `noise-generator.js`), scaling sample values by
   its `amplitude` `AudioParam`.
4. **`AudioDestinationNode`**: Browser audio output (speakers / headphones).

### Main Thread Setup

On the main thread, the `AudioWorkletProcessor` module is loaded
asynchronously using `audioContext.audioWorklet.addModule()`, and then
connected into the Web Audio graph:

```javascript
// main.js
let audioContext = null;
let modulatorNode = null;
let modGainNode = null;
let noiseGeneratorNode = null;

// 1. Setup audio graph and return AudioContext to runner
export const setup = async () => {
  audioContext = new AudioContext();
  await audioContext.suspend();

  const processorUrl =
    new URL('noise-generator.js', import.meta.url).href;
  await audioContext.audioWorklet.addModule(processorUrl);

  modulatorNode = new OscillatorNode(audioContext, {
    frequency: 0.5,
  });
  modGainNode = new GainNode(audioContext, {
    gain: 0.75,
  });
  noiseGeneratorNode =
    new AudioWorkletNode(audioContext, 'noise-generator');

  noiseGeneratorNode.connect(audioContext.destination);

  // Connect the oscillator to 'amplitude' AudioParam.
  const paramAmp = noiseGeneratorNode.parameters.get('amplitude');
  modulatorNode.connect(modGainNode).connect(paramAmp);

  return audioContext;
};

// 2. Start rendering upon user gesture
export const start = async (context) => {
  if (modulatorNode) {
    try {
      modulatorNode.start();
    } catch {
      // Node was already started.
    }
  }
};
```

### Audio Thread Setup

This `AudioWorkletProcessor` script runs on the audio rendering thread.

```javascript
// noise-generator.js
class NoiseGenerator extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'amplitude', defaultValue: 0.25, minValue: 0, maxValue: 1 },
    ];
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const amplitude = parameters.amplitude;
    const isAmplitudeConstant = amplitude.length === 1;

    for (let channel = 0; channel < output.length; ++channel) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; ++i) {
        outputChannel[i] = 2 * (Math.random() - 0.5) *
            (isAmplitudeConstant ? amplitude[0] : amplitude[i]);
      }
    }

    return true;
  }
}

registerProcessor('noise-generator', NoiseGenerator);
```

For more background on the architecture, see the
[Chrome Developers article on AudioWorklet][article-link].

[article-link]: https://developer.chrome.com/blog/audio-worklet/
