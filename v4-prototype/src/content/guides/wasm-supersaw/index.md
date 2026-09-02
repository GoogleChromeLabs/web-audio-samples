---
title: WebAssembly Supersaw Synthesizer
description: >
  Multi-oscillator virtual analog supersaw synthesizer ported via
  WebAssembly.
category: design-pattern
order: 4
tags:
  - design-pattern
  - webassembly
  - synthesizer
  - supersaw
  - emscripten
  - audioworklet
demoTitle: WebAssembly Supersaw Synthesizer
demoDescription: >
  Click START to activate the audio engine and trigger Middle C.
---

## Overview

Hosts a multi-voice C++ virtual analog supersaw synthesizer compiled to
WebAssembly and rendered directly on the audio thread.

MIDI or UI note-on/note-off events post from the main thread over
`MessagePort` to `SynthProcessor`. The processor invokes the compiled C++
synthesizer engine inside WebAssembly, rendering multi-voice detuned sawtooth
oscillators with ADSR envelopes into linear heap memory (`HEAPF32`). Output
samples route through a `GainNode` into `AudioContext.destination`.

The demo showcases zero-copy synthesis where native C++ DSP generates stereo
audio frames directly into typed array views accessed by the Web Audio engine.

## Technical Details

### Architecture & Implementation

Inside `process()`, the processor dispatches rendering directly into the
pre-allocated WASM heap buffer:

```javascript
process(inputs, outputs) {
  const output = outputs[0];

  // 1. Render synthesizer frame into WASM heap:
  this._synth.render(this._wasmHeapBuffer.getHeapAddress(), 128);
  const renderedData = this._wasmHeapBuffer.getChannelData(0);

  // 2. Transfer rendered samples to outputs:
  for (let channel = 0; channel < output.length; ++channel) {
    output[channel].set(renderedData);
  }
  return true;
}
```

### Synthesizer Architecture

| Module | Algorithm | Function |
| :--- | :--- | :--- |
| `SawtoothOscillatorDPW` | Parabolic differencing | Bandlimited sawtooth |
| `EnvelopeADSR` | Piecewise exponential | Attack, decay, sustain, release |
| Voice Allocator | Polyphonic cluster | Multi-voice detuned unison |

### Additional Notes

- **Anti-Aliased Oscillators**: Differentiated Parabolic Waveform (DPW)
  suppresses aliasing harmonics above the Nyquist frequency
  (<math><msub><mi>f</mi><mi>s</mi></msub><mo>/</mo><mn>2</mn></math>).
- **Deterministic Rendering**: Synthesis executes synchronously within the
  128-frame render quantum without memory allocation or GC interruptions.
- **Reference**:
  [Chrome Developers: AudioWorklet Design Patterns][article-link].

[article-link]: https://developer.chrome.com/blog/audio-worklet-design-pattern/
