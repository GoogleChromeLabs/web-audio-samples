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

## Overview

Measures real-time audio volume from microphone input by computing Root
Mean Square (RMS) power inside an `AudioWorkletProcessor` and posting smoothed
levels to the main thread via `MessagePort`.

The audio graph routes a `MediaStreamAudioSourceNode` capturing live
microphone input into the `AudioWorkletNode` (`volume-meter`), which connects
to `AudioContext.destination`. Connecting to the destination ensures the audio
engine continuously pulls render quanta through the node.

AudioWorklet processes 128 frames per quantum, while postMessage notifications
are throttled to 60 fps to prevent main-thread event queue saturation during
live metering.

## Technical Details

### Architecture & Implementation

1. **RMS Calculation & Throttling**: Inside `process()`, calculate RMS and
   throttle `postMessage` calls to 60 fps to prevent main-thread queue
   saturation:
   ```javascript
   const FRAME_INTERVAL = 1 / 60;

   process(inputs, outputs) {
     const channel = inputs[0]?.[0];
     if (channel && currentTime - this._lastUpdate > FRAME_INTERVAL) {
       let sum = 0;
       for (let i = 0; i < channel.length; i++) {
         sum += channel[i] * channel[i];
       }
       const rms = Math.sqrt(sum / channel.length);
       this._volume = Math.max(rms, this._volume * 0.8);
       this.port.postMessage(this._volume);
       this._lastUpdate = currentTime;
     }
     return true;
   }
   ```
2. **Main Thread Reception & Canvas Display**: The main thread listens to
   `port.onmessage` and updates the `VUMeter` canvas visualizer:
   ```javascript
   volumeMeterNode.port.onmessage = ({ data }) => {
     vuMeter.draw(data);
   };
   ```

### Messaging Protocol

| Direction | Trigger | Payload | Rate |
| :--- | :--- | :--- | :--- |
| Processor → Node | Interval elapsed | `Float` (RMS 0–1) | 60 Hz |

### Additional Notes

- **Message Decimation**: Audio rendering runs at ~375 quanta/second (at
  48 kHz). Decimating `postMessage` down to 60 Hz reduces IPC message count
  by 84%, protecting main-thread UI smoothness.
- **Audio Destination**: The worklet connects to `destination` to maintain
  active pulling through the audio engine, even if no audio is output.
- **Specification**:
  [W3C Web Audio API: MessagePort][spec-link].

[spec-link]: https://www.w3.org/TR/webaudio/#dom-audioworkletnode-port
