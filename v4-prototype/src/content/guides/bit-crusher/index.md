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

A BitCrusher example from the Web Audio API specification, but modified to
demonstrate `AudioParam` automations. The sound source is a sawtooth oscillator
at 5000 Hz. The demo runs for 8 seconds.

This simple Web Audio graph connects three core components:
1. **`OscillatorNode`**: Generates a 5,000 Hz sawtooth wave tone.
2. **`AudioWorkletNode`** and **`AudioWorkletProcessor`**: Processes input
   audio using `BitCrusherProcessor` (in `bit-crusher-processor.js`) with
   `bitDepth` and `frequencyReduction` AudioParams.
3. **`AudioDestinationNode`**: Browser audio output (speakers / headphones).

### Main Thread Setup

On the main thread, the `AudioWorkletProcessor` module is loaded
asynchronously using `audioContext.audioWorklet.addModule()`, and then
connected into the Web Audio graph:

```javascript
// main.js
let audioContext = null;
let oscillatorNode = null;
let bitCrusherNode = null;
let paramBitDepth = null;
let paramReduction = null;

// 1. Setup audio graph and return AudioContext to runner
export const setup = async () => {
  audioContext = new AudioContext();
  await audioContext.suspend();

  const processorUrl =
    new URL('bit-crusher-processor.js', import.meta.url).href;
  await audioContext.audioWorklet.addModule(processorUrl);

  oscillatorNode = new OscillatorNode(audioContext, {
    type: 'sawtooth',
    frequency: 5000,
  });
  bitCrusherNode =
    new AudioWorkletNode(audioContext, 'bit-crusher-processor');

  paramBitDepth = bitCrusherNode.parameters.get('bitDepth');
  paramReduction = bitCrusherNode.parameters.get('frequencyReduction');

  oscillatorNode.connect(bitCrusherNode).connect(audioContext.destination);
  return audioContext;
};

// 2. Start rendering and apply AudioParam automations upon user gesture
export const start = async (context) => {
  if (oscillatorNode) {
    const now = context.currentTime;
    paramBitDepth.setValueAtTime(1, now);

    // `frequencyReduction` parameters will be automated and changing over
    // time. Thus its parameter array will have 128 values.
    paramReduction.setValueAtTime(0.01, now);
    paramReduction.linearRampToValueAtTime(0.1, now + 4);
    paramReduction.exponentialRampToValueAtTime(0.01, now + 8);

    try {
      oscillatorNode.start();
      oscillatorNode.stop(now + 8);
    } catch {
      // Node was already started.
    }
  }
};
```

### Audio Thread Setup

This `AudioWorkletProcessor` script runs on the audio rendering thread.

```javascript
// bit-crusher-processor.js
class BitCrusherProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {name: 'bitDepth', defaultValue: 12, minValue: 1, maxValue: 16},
      {
        name: 'frequencyReduction',
        defaultValue: 0.5,
        minValue: 0,
        maxValue: 1,
      },
    ];
  }

  constructor() {
    super();
    this.phase_ = 0;
    this.lastSampleValue_ = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    // AudioParam array can be either length of 1 or 128. Generally, the code
    // should prepare for both cases. In this particular example, |bitDepth|
    // AudioParam is constant but |frequencyReduction| is being automated.
    const bitDepth = parameters.bitDepth;
    const frequencyReduction = parameters.frequencyReduction;
    const isBitDepthConstant = bitDepth.length === 1;
    const isReductionConstant = frequencyReduction.length === 1;

    for (let channel = 0; channel < input.length; ++channel) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      let step = Math.pow(0.5, bitDepth[0]);
      for (let i = 0; i < inputChannel.length; ++i) {
        // Recalculate step size if bitDepth is being automated.
        if (!isBitDepthConstant) {
          step = Math.pow(0.5, bitDepth[i]);
        }
        const reduction = isReductionConstant
          ? frequencyReduction[0]
          : frequencyReduction[i];
        this.phase_ += reduction;
        if (this.phase_ >= 1.0) {
          this.phase_ -= 1.0;
          this.lastSampleValue_ =
              step * Math.floor(inputChannel[i] / step + 0.5);
        }
        outputChannel[i] = this.lastSampleValue_;
      }
    }

    return true;
  }
}

registerProcessor('bit-crusher-processor', BitCrusherProcessor);
```

For more background on the architecture, see the
[Chrome Developers article on AudioWorklet][article-link].

[article-link]: https://developer.chrome.com/blog/audio-worklet/
