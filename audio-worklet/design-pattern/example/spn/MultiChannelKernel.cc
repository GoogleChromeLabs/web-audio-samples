#include "emscripten/bind.h"

#include <stdio.h>

using namespace emscripten;

class MultiChannelKernel {
 public:
  MultiChannelKernel(unsigned buffer_size)
      : buffer_size_(buffer_size) {}

  // |input_ptr| and |output_ptr| are <float*> 1D array with channel data in a
  // sequence.
  void Process(uintptr_t input_ptr, unsigned input_channel_count,
               uintptr_t output_ptr, unsigned output_channel_count) {
    float* input_buffer = reinterpret_cast<float*>(input_ptr);
    float* output_buffer = reinterpret_cast<float*>(output_ptr);
    unsigned number_of_bytes = buffer_size_ * sizeof(float);

    for (unsigned channel = 0; channel < output_channel_count; ++channel) {
      // Float-pointer arithmetic.
      float* destination = output_buffer + channel * buffer_size_;
      if (channel < input_channel_count) {
        // If both the output channel and the input channel are valid, clone
        // the data.
        float* source = input_buffer + channel * buffer_size_;
        memcpy(destination, source, number_of_bytes);
      } else {
        // Otherwise slience the output.
        memset(destination, 0, number_of_bytes);
      }
    }
  }

 private:
  unsigned buffer_size_;
};

EMSCRIPTEN_BINDINGS(CLASS_MultiChannelKernel) {
  class_<MultiChannelKernel>("MultiChannelKernel")
      .constructor<unsigned>()
      .function("process", &MultiChannelKernel::Process, allow_raw_pointers());
}
