---
title: Resampler Smoke Test (A/B Stream Comparison)
description: >
  Real-time stress test comparing an 8,000 Hz resampled AudioContext stream
  against an unresampled AudioElement stream.
category: benchmark
order: 1
tags:
  - benchmark
  - resampler
  - a-b-test
  - smoke-test
testTitle: 8 kHz Resampler Smoke Test
testDescription: Compare 8 kHz resampled AudioContext and native AudioElement.
---

## Overview

The Web Audio API resampler converts sample rates dynamically when an
`AudioContext` runs at a rate distinct from the output device. This smoke test
evaluates the stability and sound quality of extreme downsampling (8,000 Hz)
compared directly to native unresampled audio.

Two synchronized audio elements loop a human speech vocal sample:
- **Stream A (Resampled)**: Routed into an `AudioContext` configured at
  `sampleRate: 8000` via `MediaElementAudioSourceNode`, then sent to
  `AudioContext.destination`.
- **Stream B (Native)**: Played directly through the browser's native
  `HTMLAudioElement` pipeline at system rate.

The A/B toggle switch instantly crossfades between the two streams so
developers can evaluate frequency cutoff, anti-aliasing filter slope, and
potential glitch artifacts.

## How to Test

1. Click **START TEST** to start synchronized playback of both streams.
2. Toggle the switch to alternate between **Native AudioElement** and
   **8 kHz AudioContext**.
3. **Listen for**:
   - The 8 kHz stream should sound bandwidth-limited (telephony quality, ~4 kHz
     Nyquist cutoff) without harmonic distortion or aliasing foldback.
   - Transitions between streams should be instantaneous and click-free.
4. Click **STOP** to halt playback and release the audio contexts.

## Implementation Details

The test constructs an 8 kHz `AudioContext` and wraps the first media element:

```javascript
const context = new AudioContext({ sampleRate: 8000 });
const elementA = new Audio('sounds/fx/human-voice.mp3');
elementA.loop = true;

const sourceNode = context.createMediaElementSource(elementA);
const gainNode = new GainNode(context, { gain: 0.0 });
sourceNode.connect(gainNode).connect(context.destination);

// Synchronized native stream
const elementB = new Audio('sounds/fx/human-voice.mp3');
elementB.loop = true;
elementB.volume = 1.0;
```

## References

- [W3C Web Audio API: MediaElementAudioSourceNode][media-source-spec]
- [W3C Web Audio API: AudioContextOptions][options-spec]

[media-source-spec]:
  https://webaudio.github.io/web-audio-api/#MediaElementAudioSourceNode
[options-spec]: https://webaudio.github.io/web-audio-api/#AudioContextOptions
