---
title: Volume Meter
description: Measures microphone volume with an AudioWorkletProcessor.
category: basic
order: 4
tags:
  - basic
  - volume-meter
  - microphone
  - rms
  - audioworklet
demoTitle: Volume Meter
demoDescription: Click START to begin measuring microphone input level.
---

This example demonstrates measuring audio volume from a microphone input
using an `AudioWorkletProcessor`. The processor computes Root Mean Square
(RMS) values over input samples and posts the volume metrics back to the
main thread at a 60 fps interval.

This Web Audio graph connects four core components:
1. **`MediaStreamAudioSourceNode`**: Captures raw live audio input from the
   user's microphone via `navigator.mediaDevices.getUserMedia()`.
2. **`AudioWorkletNode`** and **`AudioWorkletProcessor`**: Calculates real-time
   RMS levels in `VolumeMeter` (in `volume-meter-processor.js`) and transmits
   the smoothed level via `MessagePort`.
3. **`VUMeter` (`VUMeter.js`)**: Visualizes real-time levels on a canvas using
   a logarithmic dB scale and a smoothed FIFO queue.
4. **`AudioDestinationNode`**: Kept connected to pull audio through the worklet
   without rendering sound directly to output.

### Main Thread Setup

On the main thread, the `AudioWorkletProcessor` module is loaded
asynchronously using `audioContext.audioWorklet.addModule()`. Upon user
gesture, the microphone stream is requested and connected into the graph:

```javascript
// main.js
import VUMeter from './VUMeter.js';

let audioContext = null;
let micNode = null;
let volumeMeterNode = null;
let mediaStream = null;
let vuMeter = null;

// 1. Setup audio graph and register processor
export const setup = async () => {
  audioContext = new AudioContext();
  await audioContext.suspend();

  const processorUrl =
    new URL('volume-meter-processor.js', import.meta.url).href;
  await audioContext.audioWorklet.addModule(processorUrl);

  volumeMeterNode = new AudioWorkletNode(audioContext, 'volume-meter');

  const canvas = document.getElementById('vu-meter');
  vuMeter = new VUMeter(canvas, {
    minDecibel: -40,
    fifoSize: 6,
    backgroundColor: 'transparent',
  });
  vuMeter.reset();

  audioContext.addEventListener('statechange', () => {
    if (audioContext.state === 'suspended' && vuMeter) {
      vuMeter.reset();
    }
  });

  volumeMeterNode.port.onmessage = ({ data }) => {
    vuMeter.draw(data);
  };

  volumeMeterNode.connect(audioContext.destination);
  return audioContext;
};

// 2. Request microphone access and connect upon user gesture
export const start = async (context) => {
  if (!micNode && navigator.mediaDevices?.getUserMedia) {
    try {
      mediaStream =
        await navigator.mediaDevices.getUserMedia({ audio: true });
      micNode = context.createMediaStreamSource(mediaStream);
      micNode.connect(volumeMeterNode);
    } catch (err) {
      console.warn('Microphone access denied or unavailable:', err);
    }
  }
};
```

### Audio Thread Setup

This `AudioWorkletProcessor` script runs on the audio rendering thread,
calculating the smoothed RMS power of incoming samples:

```javascript
// volume-meter-processor.js
const SMOOTHING_FACTOR = 0.8;
const FRAME_PER_SECOND = 60;
const FRAME_INTERVAL = 1 / FRAME_PER_SECOND;

class VolumeMeter extends AudioWorkletProcessor {
  constructor() {
    super();
    this._lastUpdate = currentTime;
    this._volume = 0;
  }

  calculateRMS(inputChannelData) {
    let sum = 0;
    for (let i = 0; i < inputChannelData.length; i++) {
      sum += inputChannelData[i] * inputChannelData[i];
    }
    const rms = Math.sqrt(sum / inputChannelData.length);
    this._volume = Math.max(rms, this._volume * SMOOTHING_FACTOR);
  }

  process(inputs, outputs) {
    const inputChannelData = inputs[0] && inputs[0][0];

    if (inputChannelData && currentTime - this._lastUpdate > FRAME_INTERVAL) {
      this.calculateRMS(inputChannelData);
      this.port.postMessage(this._volume);
      this._lastUpdate = currentTime;
    }

    return true;
  }
}

registerProcessor('volume-meter', VolumeMeter);
```

For more background on the architecture, see the
[Chrome Developers article on AudioWorklet][article-link].

[article-link]: https://developer.chrome.com/blog/audio-worklet/
