---
title: Ring Buffer in AudioWorkletProcessor
description: >
  Handle mismatched buffer sizes between C++ audio kernels and AudioWorklet
  with RingBuffer.
category: design-pattern
order: 3
tags:
  - design-pattern
  - webassembly
  - ringbuffer
  - emscripten
  - audioworklet
demoTitle: RingBuffer with WebAssembly
demoDescription: >
  Click START to run the 1024-frame WebAssembly processing kernel.
---

## Overview

Accommodates block size disparities between native C++ audio processing kernels
(e.g. 1024 frames for FFTs or convolution) and the Web Audio API fixed
128-sample render quantum using a lock-free FIFO ring buffer.

The audio graph routes an `OscillatorNode` into the `AudioWorkletNode`
(`ring-buffer-worklet-processor`), which connects to
`AudioContext.destination`.

Incoming 128-frame render quanta are pushed into an input FIFO ring buffer.
When the ring buffer accumulates 1024 frames, the WebAssembly kernel pulls the
full block, executes native processing, and pushes the result into an output
ring buffer. The output ring buffer supplies 128 frames per quantum to the
destination.

## Technical Details

### Architecture & Implementation

Inside `process()`, incoming 128-frame quanta are pushed to the input FIFO.
When 1024 frames accumulate, the WASM kernel executes and fills the output
FIFO:

```javascript
process(inputs, outputs) {
  // 1. Accumulate 128 frames into input ring buffer:
  this._inputRingBuffer.push(inputs[0]);

  // 2. Execute kernel once the 1024-frame threshold is reached:
  if (this._inputRingBuffer.framesAvailable >= this._kernelBufferSize) {
    this._inputRingBuffer.pull(this._kernelInputView);
    this._kernel.process(
      this._kernelInputView.byteOffset,
      this._kernelOutputView.byteOffset,
      this._channelCount
    );
    this._outputRingBuffer.push(this._kernelOutputView);
  }

  // 3. Always pull exactly 128 frames for current render quantum:
  this._outputRingBuffer.pull(outputs[0]);
  return true;
}
```

### Buffer Rate Metrics

| Layer | Frame Quantum | Invocation Rate (48 kHz) |
| :--- | :--- | :--- |
| AudioWorklet `process()` | 128 frames | ~375 Hz (every 2.67 ms) |
| WASM `Kernel.process()` | 1024 frames | ~47 Hz (every 8 quanta) |
| FIFO Buffer Size | 2048 frames | Continuous circular storage |

### Additional Notes

- **Algorithmic Latency**: Buffering 1024 frames introduces 21.3 ms of latency
  at 48 kHz (23.2 ms at 44.1 kHz).
- **Lock-Free Concurrency**: Ring buffers on the audio thread must avoid locks
  or dynamic memory allocation to prevent priority inversion.
- **Reference**:
  [Chrome Developers: AudioWorklet Design Patterns][article-link].

[article-link]: https://developer.chrome.com/blog/audio-worklet-design-pattern/
