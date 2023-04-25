# WebGPUAudio Experiment

*NOTE: This experiment was developed and tested in Chrome M114. It may not work
correctly in other versions of Chrome or other browsers.*

This project aims to integrate the Web Audio API and WebGPU. The sprint team
created a prototype audio pipeline powered by several cutting-edge components,
including AudioWorklet, SharedArrayBuffer, Atomics, WebGPU, and WGSL. This
prototype demonstrates the potential of integrating these two APIs to create
more powerful and efficient audio experiences in the browser.

## Design

The proof-of-concept for this project has a simple audio pipeline consisting of
a serial graph of 3 AudioNodes. The entry point for WebGPU integration is the
AudioWorkletProcessor (AWP). However, the actual audio processing does not take
place within the AWP because of the following constraints:

- The audio callback in AWP has a very tight deadline (~2ms) and is a
synchronous function.
- The WebGPU API is not available in AudioWorkletGlobalScope.
- The AudioWorkletGlobalScope is driven by a high-priority realtime audio
thread, and it can't be blocked by Atomics and can be impacted by memory
allocation/garbage collection (i.e. unbound operation).

These constraints necessitate a separate space for flexible audio processing. As
a result, the actual audio processing with WebGPU is done in a separate worker
thread. The AWP will simply function as a producer/consumer in the audio
pipeline by pushing input data and pulling output results via FIFO.

## How to run the experiment

- Go to the [live demo link](https://googlechromelabs.github.io/web-audio-samples/experiments/webgpuaudio/).
- To start the experiment, click the "Start" button. If the button is disabled,
it means that your browser does not meet the requirements for the experiment.
Follow the instruction on the experiment page.

## Support

If you have found an error in this library, please file an issue at: 
https://github.com/GoogleChromeLabs/web-audio-samples/issues.

## Contribution

Patches are encouraged, and may be submitted by forking this project and
submitting a pull request through GitHub. See CONTRIBUTING.md for more detail.

## License

See [LICENSE](https://github.com/GoogleChromeLabs/web-audio-samples/blob/main/LICENSE).