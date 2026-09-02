---
title: ScriptProcessorNode Audio Recorder
description: >
  Legacy audio recording implementation using the deprecated
  ScriptProcessorNode.
category: migration
order: 1
tags:
  - migration
  - scriptprocessornode
  - recorder
  - legacy
demoTitle: ScriptProcessorNode Audio Recorder
demoDescription: >
  Click START to record microphone input with ScriptProcessorNode.
---

## Overview

This guide demonstrates capturing and recording microphone audio using the
legacy `ScriptProcessorNode`. While deprecated in favor of `AudioWorklet`,
`ScriptProcessorNode` is retained here as a historical reference and benchmark
for evaluating audio glitch vulnerabilities on the main UI thread.

The audio graph captures live microphone input via `MediaStreamAudioSourceNode`
and branches into an `AnalyserNode` for real-time waveform rendering on a
canvas, as well as a `ScriptProcessorNode` configured to capture stereo PCM
buffers. The processor output connects to a `GainNode` set to zero gain before
reaching `AudioDestinationNode` to prevent acoustic speaker feedback.

Because `ScriptProcessorNode` executes its processing callback on the main UI
thread, any heavy JavaScript execution, DOM reflow, or garbage collection pause
can block the audio pipeline and cause audible dropouts or buffer underruns.

## Technical Details

### Architecture & Implementation

The processor is instantiated with a buffer size (e.g., 512 frames) and stereo
channels. Inside `onaudioprocess`, incoming buffer slices are copied and stored
for later assembly:

```javascript
const spNode = context.createScriptProcessor(512, 2, 2);

spNode.onaudioprocess = (event) => {
  const inputBuffer = event.inputBuffer;
  for (let ch = 0; ch < inputBuffer.numberOfChannels; ++ch) {
    recordedBuffers[ch].push(
      new Float32Array(inputBuffer.getChannelData(ch))
    );
  }
};
```

When recording finishes, buffered `Float32Array` chunks are combined into an
`AudioBuffer` and encoded into a standard 16-bit PCM WAV file for download or
playback.

### ScriptProcessorNode vs AudioWorkletNode

| Feature | ScriptProcessorNode (Legacy) | AudioWorkletNode (Modern) |
|---|---|---|
| Thread | Main UI thread | Dedicated audio thread |
| Quantum | 256–16384 frames (variable) | 128 frames (fixed) |
| Latency | High (large buffer required) | Low (deterministic) |
| Glitch risk | High (blocked by UI, GC, layout) | Low (isolated thread) |
| Status | Deprecated | W3C Recommendation |

### Additional Notes

- **Modern alternative**: See the
  [AudioWorklet Audio Recorder][worklet-recorder] for the recommended modern
  pattern.
- **Specification Reference**:
  [W3C Web Audio API: ScriptProcessorNode (Deprecated)][spn-spec].

[worklet-recorder]: ../worklet-recorder/
[spn-spec]: https://www.w3.org/TR/webaudio/#ScriptProcessorNode

