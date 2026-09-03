---
title: Resampler Verification (Issue 331682035)
description: >
  Regression verification fixture for sample rate conversion stability
  and click artifact detection at 16,000 Hz.
category: regression
order: 1
tags:
  - regression
  - resampler
  - bug-repro
  - crbug-331682035
testTitle: 16 kHz AudioContext Resampler Test
testDescription: Generates an audio stream to verify resampling stability.
---

## Overview

In Chromium's Web Audio implementation, when an `AudioContext` is constructed
with a custom sample rate different from the underlying hardware device rate
(e.g., 16,000 Hz context playing to a 44,100 Hz or 48,000 Hz output), the audio
stream is processed through an internal sample rate converter (resampler).

In [Chromium Issue 331682035](https://crbug.com/331682035), users reported
audible clicks, glitches, and audio buffer stuttering when routing audio
through certain Bluetooth headsets or external DACs under 16 kHz context
resampling.

This test fixture reproduces the audio graph configuration from the bug report
to verify that audio playback remains clean and free of resampling artifacts.

## How to Test

1. Connect headphones, earbuds, or an external audio device.
2. Click **START TEST** to instantiate an `AudioContext` configured at
   `sampleRate: 16000`.
3. Listen to the continuous 440 Hz tone.
4. **Expected Result**: Smooth, clean sine wave playback without periodic
   clicks, dropouts, or buffer underrun noise.
5. Click **STOP** to close the context and terminate the test.

## Implementation Details

The audio graph creates an `AudioContext` with an explicit 16 kHz sample rate:

```javascript
const audioContext = new AudioContext({
  latencyHint: 'interactive',
  sampleRate: 16000,
});

const osc = new OscillatorNode(audioContext, {
  type: 'sine',
  frequency: 440,
});
const gain = new GainNode(audioContext, { gain: 0.2 });

osc.connect(gain).connect(audioContext.destination);
osc.start();
```

## References

- <a
    href="https://crbug.com/331682035"
    target="_blank"
    rel="noopener"
  >Chromium Issue 331682035: Audio glitches in resampler</a>
- <a
    href="https://webaudio.github.io/web-audio-api/#AudioContextOptions"
    target="_blank"
    rel="noopener"
  >W3C Web Audio API: AudioContextOptions.sampleRate</a>
