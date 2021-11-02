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

 import Module from './synth.wasm.js';
 import WASMAudioBuffer from './util/WASMAudioBuffer.js';
 
 // Web Audio API's render block size
 const NUM_FRAMES = 128;
 
 class SynthProcessor extends AudioWorkletProcessor {
   constructor() {
     super();
     // Create an instance of Synthesizer and WASM memory helper. Then set up an
     // event handler for MIDI data from the main thread.
     this._synth = new Module.Synthesizer(sampleRate);
     this._wasmBuffer = new WASMAudioBuffer(Module, NUM_FRAMES, 1, 1);
     this.port.onmessage = this._playTone.bind(this);
   }
 
   process(inputs, outputs) {
     // The output buffer (mono) provided by Web Audio API.
     const outputBuffer = outputs[0][0];
 
     // Call the render function to fill the WASM buffer. Then clone the
     // rendered data to process() callback's output buffer.
     this._synth.render(this._wasmBuffer.getPointer(), NUM_FRAMES);
     outputBuffer.set(this._wasmBuffer.getF32Array());
 
     return true;
   }
 
   _playTone(event) {
     const isDown = event.data;
     isDown ? this._synth.noteOn(60) : this._synth.noteOff(60);
   }
 }
 
 registerProcessor('wasm-synth', SynthProcessor);
 