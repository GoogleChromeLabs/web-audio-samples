/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <emscripten/bind.h>
#include "Synthesizer.h"

using namespace emscripten;

class SynthesizerWrapper : public Synthesizer {
 public:
  SynthesizerWrapper(int32_t sampleRate)
      : Synthesizer(sampleRate) {}

  void render(uintptr_t output_ptr, int32_t numFrames) {
    // Use type cast to hide the raw pointer in function arguments.
    float* output_array = reinterpret_cast<float*>(output_ptr);
    Synthesizer::render(output_array, numFrames);
  }
};

EMSCRIPTEN_BINDINGS(CLASS_Synthesizer) {
  // First, bind the original Synthesizer class.
  class_<Synthesizer>("SynthesizerBase")
      .constructor<int32_t>()
      .function("noteOff", &Synthesizer::noteOff)
      .function("noteOn", &Synthesizer::noteOn);

  // Then expose the overridden `render` method from the wrapper class.
  class_<SynthesizerWrapper, base<Synthesizer>>("Synthesizer")
      .constructor<int32_t>()
      .function("render", &SynthesizerWrapper::render, allow_raw_pointers());
}
