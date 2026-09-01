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
demoDescription: Click START to run the demo.
---

`AudioWorklet` lets you run custom audio processing off the main thread,
greatly reducing the risk of audio glitches and dropouts from heavy UI work.

This starter example is a basic bypass node that takes an incoming 440 Hz sine
tone and forwards it straight to your speakers unchanged.

This simple Web Audio graph connects three core components:
1. **`OscillatorNode`**: Generates a 440 Hz sine wave tone.
2. **`AudioWorkletNode`** and **`AudioWorkletProcessor`**: Forwards input
   channels directly to output channels using `BypassProcessor`
   (in `bypass-processor.js`).
3. **`AudioDestinationNode`**: Browser audio output (speakers / headphones).

### Main Thread Setup

On the main thread, the `AudioWorkletProcessor` module is loaded
asynchronously using `audioContext.audioWorklet.addModule()`, and then
connected into the Web Audio graph:

```javascript
// main.js
let audioContext = null;
let oscillatorNode = null;

// 1. Setup audio graph and return AudioContext to runner
export const setup = async () => {
  audioContext = new AudioContext();
  await audioContext.suspend();
  const processorUrl =
    new URL('bypass-processor.js', import.meta.url).href;
  await audioContext.audioWorklet.addModule(processorUrl);

  oscillatorNode = new OscillatorNode(audioContext);
  const bypasser = new AudioWorkletNode(audioContext, 'bypass-processor');

  oscillatorNode.connect(bypasser).connect(audioContext.destination);
  return audioContext;
};

// 2. Start rendering upon user gesture
export const start = async (context) => {
  oscillatorNode.start();
};
```

### Audio Thread Setup

This `AudioWorkletProcessor` script runs on the audio rendering thread.

```javascript
// bypass-processor.js
class BypassProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    for (let channel = 0; channel < output.length; ++channel) {
      output[channel].set(input[channel]);
    }

    return true;
  }
}

registerProcessor('bypass-processor', BypassProcessor);
```

For more background on the architecture, see the
[Chrome Developers article on AudioWorklet][article-link].

[article-link]: https://developer.chrome.com/blog/audio-worklet/
