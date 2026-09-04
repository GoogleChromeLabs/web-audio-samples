---
title: AudioWorklet Audio Recorder
description: >
  Modern, glitch-free audio recording using AudioWorklet on a dedicated audio
  thread.
category: migration
order: 2
tags:
  - migration
  - audioworklet
  - recorder
  - modern
demoTitle: AudioWorklet Audio Recorder
demoDescription: >
  Click START to record microphone input with AudioWorklet.
---

## Overview

This guide demonstrates capturing and buffering raw PCM audio samples on a
dedicated audio thread using `AudioWorkletNode` and `AudioWorkletProcessor`.
Audio recording on the dedicated audio render thread eliminates dropout risks
caused by main-thread UI reflows, garbage collection, and heavy event handling.

The audio graph captures live microphone input with
`MediaStreamAudioSourceNode` and branches into an `AnalyserNode` for real-time
canvas waveform visualization and an `AudioWorkletNode` (`recording-processor`)
to buffer raw audio data. The processor output connects to a `GainNode` with
gain set to zero before terminating at `AudioDestinationNode` to prevent
acoustic speaker feedback.

Because processing occurs synchronously in 128-frame render quanta on the audio
thread, samples are recorded with low, deterministic latency. Once the user
stops recording, the accumulated PCM chunks are dispatched back to the main
thread for WAV packaging.

## Technical Details

### Architecture & Implementation

Inside `process()`, the processor checks whether recording is active and copies
incoming channel frames directly into pre-allocated storage:

```javascript
process(inputs, outputs, params) {
  const input = inputs[0];
  if (!this.isRecording || !input || !input[0]) {
    return true;
  }

  for (let ch = 0; ch < this.numberOfChannels; ++ch) {
    const channelData = input[ch];
    for (let i = 0; i < channelData.length; ++i) {
      this.recordingBuffer[ch][this.recordedFrames + i] = channelData[i];
    }
  }
  this.recordedFrames += 128;
  return true;
}
```

### Control Protocol (MessagePort)

The main thread coordinates recording states with the processor via
bidirectional messages on `port`:

| Command | Direction | Description |
|---|---|---|
| `SET_BUFFER_SIZE` | Main -> Worklet | Allocates the recording buffer |
| `START_RECORDING` | Main -> Worklet | Starts accumulating samples |
| `STOP_RECORDING` | Main -> Worklet | Stops recording |
| `RECORDING_COMPLETE` | Worklet -> Main | Transmits recorded `Float32Array` |

### Additional Notes

- **Real-Time Memory Allocation**: Audio processing callbacks run under strict
  real-time deadlines. Allocating buffers inside `process()` risks triggering
  garbage collection pauses. Pre-allocate recording storage when recording
  starts and transfer the typed array buffers via `postMessage` upon completion.
- **Legacy Comparison**: See the
  [ScriptProcessorNode Audio Recorder][spn-recorder] for the legacy pattern.
- **Specification**:
  [W3C Web Audio API: AudioWorkletProcessor][worklet-spec].

[spn-recorder]: ../spn-recorder/
[worklet-spec]: https://www.w3.org/TR/webaudio/#AudioWorkletProcessor

