#include "emscripten/bind.h"

using namespace emscripten;

// A multi-channel processing kernel. To handle multiple inputs or outputs,
// simply use multiple instances of this kernel. The design assumes:
//   1. The kernel size (processing frame size) is static after construction.
//   2. The channel count can be changed dynamically.
//   3. The given channel count must be smaller than the size of the array
//      being passed in.
class RingBufferWorkletProcessorKernel {
 public:
  RingBufferWorkletProcessorKernel(unsigned kernel_buffer_size)
      : kernel_buffer_size_(kernel_buffer_size),
        bytes_per_channel_(kernel_buffer_size * sizeof(float)) {}

  void Process(uintptr_t input_ptr, uintptr_t output_ptr,
               unsigned channel_count) {
    float* input_buffer = reinterpret_cast<float*>(input_ptr);
    float* output_buffer = reinterpret_cast<float*>(output_ptr);

    // Bypasses the data. If the input channel is smaller than the output
    // channel, it fills the output channel with zero.
    for (unsigned channel = 0; channel < channel_count; ++channel) {
      float* destination = output_buffer + channel * kernel_buffer_size_;
      if (channel < channel_count) {
        float* source = input_buffer + channel * kernel_buffer_size_;
        memcpy(destination, source, bytes_per_channel_);
      } else {
        memset(destination, 0, bytes_per_channel_);
      }
    }
  }

 private:
  unsigned kernel_buffer_size_ = 0;
  unsigned bytes_per_channel_ = 0;
};

EMSCRIPTEN_BINDINGS(CLASS_RingBufferWorkletProcessorKernel) {
  class_<RingBufferWorkletProcessorKernel>("RingBufferWorkletProcessorKernel")
      .constructor<unsigned>()
      .function("process",
                &RingBufferWorkletProcessorKernel::Process,
                allow_raw_pointers());
}
