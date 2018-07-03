/**
 * Copyright (c) 2018 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#include "emscripten/bind.h"

using namespace emscripten;

const unsigned kRenderQuantumFrames = 128;
const unsigned kBytesPerChannel = kRenderQuantumFrames * sizeof(float);

// The "kernel" is an object that processes a audio stream, which contains
// one or more channels. It is supposed to obtain the frame data from an
// |input|, process and fill an |output| of the AudioWorkletProcessor.
//
//       AudioWorkletProcessor Input(multi-channel, 128-frames)
//                                 |
//                                 V
//                               Kernel
//                                 |
//                                 V
//       AudioWorkletProcessor Output(multi-channel, 128-frames)
//
// In this implementation, the kernel operates based on 128-frames, which is
// the render quantum size of Web Audio API.
class SimpleKernel {
 public:
  SimpleKernel() {}

  void Process(uintptr_t input_ptr, uintptr_t output_ptr,
               unsigned channel_count) {
    float* input_buffer = reinterpret_cast<float*>(input_ptr);
    float* output_buffer = reinterpret_cast<float*>(output_ptr);

    // Bypasses the data. By design, the channel count will always be the same
    // for |input_buffer| and |output_buffer|.
    for (unsigned channel = 0; channel < channel_count; ++channel) {
      float* destination = output_buffer + channel * kRenderQuantumFrames;
      float* source = input_buffer + channel * kRenderQuantumFrames;
      memcpy(destination, source, kBytesPerChannel);
    }
  }
};

EMSCRIPTEN_BINDINGS(CLASS_SimpleKernel) {
  class_<SimpleKernel>("SimpleKernel")
      .constructor()
      .function("process",
                &SimpleKernel::Process,
                allow_raw_pointers());
}
