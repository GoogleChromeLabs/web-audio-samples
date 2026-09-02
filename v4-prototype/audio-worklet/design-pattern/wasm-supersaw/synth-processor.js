// Copyright (c) 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import Module from './synth.wasm.js';
import { FreeQueue } from './free-queue.js';

/* global sampleRate */

// Web Audio API's render quantum size.
const NUM_FRAMES = 128;

/**
 * AudioWorkletProcessor that hosts a multi-voice C++ supersaw synthesizer
 * compiled to WebAssembly.
 *
 * @class SynthProcessor
 * @extends AudioWorkletProcessor
 */
class SynthProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._synth = new Module.Synthesizer(sampleRate);
    this._wasmHeapBuffer = new FreeQueue(Module, NUM_FRAMES, 1, 1);
    this.port.onmessage = this._handleMessage.bind(this);
  }

  process(inputs, outputs) {
    const output = outputs[0];
    if (!output || output.length === 0) return true;

    // Render synthesizer audio into WASM heap buffer.
    this._synth.render(this._wasmHeapBuffer.getHeapAddress(), NUM_FRAMES);
    const renderedData = this._wasmHeapBuffer.getChannelData(0);

    for (let channel = 0; channel < output.length; ++channel) {
      output[channel].set(renderedData);
    }

    return true;
  }

  _handleMessage(event) {
    const data = event.data;
    if (typeof data === 'boolean') {
      data ? this._synth.noteOn(60) : this._synth.noteOff(60);
    } else if (typeof data === 'object' && data !== null) {
      const note = data.note ?? 60;
      data.isDown ? this._synth.noteOn(note) : this._synth.noteOff(note);
    }
  }
}

registerProcessor('wasm-synth', SynthProcessor);
