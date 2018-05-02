#include "emscripten/bind.h"

using namespace emscripten;

const unsigned kRenderQuantumFrames = 128;
const unsigned kBytesPerChannel = kRenderQuantumFrames * sizeof(float);

// A kernel corresponds to an input or an output of the processor. An single
// input or an output can have multiple channels. It operates based on
// 128-frames, which is the render quantum size of Web Audio API. Since the
// frame size is aligned with the WebAudio's rendering enging, no additional
// latency (buffering) is introduced.
class AudioWorkletProcessorKernel {
 public:
  AudioWorkletProcessorKernel() {}

  void Process(uintptr_t input_ptr, uintptr_t output_ptr,
               unsigned channel_count) {
    float* input_buffer = reinterpret_cast<float*>(input_ptr);
    float* output_buffer = reinterpret_cast<float*>(output_ptr);

    // Bypasses the data. If the input channel is smaller than the output
    // channel, it fills the output channel with zero.
    for (unsigned channel = 0; channel < channel_count; ++channel) {
      float* destination = output_buffer + channel * kRenderQuantumFrames;
      if (channel < channel_count) {
        float* source = input_buffer + channel * kRenderQuantumFrames;
        memcpy(destination, source, kBytesPerChannel);
      } else {
        memset(destination, 0, kBytesPerChannel);
      }
    }
  }
};

EMSCRIPTEN_BINDINGS(CLASS_AudioWorkletProcessorKernel) {
  class_<AudioWorkletProcessorKernel>("AudioWorkletProcessorKernel")
      .constructor()
      .function("process",
                &AudioWorkletProcessorKernel::Process,
                allow_raw_pointers());
}
