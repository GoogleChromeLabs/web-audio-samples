// Copyright (c) 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import Module from './simple-kernel.wasmmodule.js';
import { RENDER_QUANTUM_FRAMES , MAX_CHANNEL_COUNT , FreeQueue } from '../lib/FreeQueue.js';

/**
 * A simple demonstration of WASM-powered AudioWorkletProcessor.
 *
 * @class WASMWorkletProcessor
 * @extends AudioWorkletProcessor
 */
class WASMWorkletProcessor extends AudioWorkletProcessor {
  /**
   * @constructor
   */
  constructor() {
    super();

    // Allocate the buffer for the heap access. Start with stereo, but it can
    // be expanded up to 32 channels.
    this._freeQueue = new FreeQueue(RENDER_QUANTUM_FRAMES, MAX_CHANNEL_COUNT);
    this._kernel = new Module.SimpleKernel();
  }

  /**
   * System-invoked process callback function.
   * @param  {Array} inputs Incoming audio stream.
   * @param  {Array} outputs Outgoing audio stream.
   * @param  {Object} parameters AudioParam data.
   * @return {Boolean} Active source flag.
   */
  process(inputs, outputs, parameters) {
    // Use the 1st input and output only to make the example simpler. |input|
    // and |output| here have the similar structure with the AudioBuffer
    // interface. (i.e. An array of Float32Array)
    const input = inputs[0];
    const output = outputs[0];

    // For this given render quantum, the channel count of the node is fixed
    // and identical for the input and the output.
    const channelCount = input.length;

    // Prepare HeapAudioBuffer for the channel count change in the current
    // render quantum.
    this._freeQueue.adaptChannel(channelCount);

    // Copy-in, process and copy-out.
    for (let channel = 0; channel < channelCount; ++channel) {
      this._freeQueue.push(input[channel], RENDER_QUANTUM_FRAMES);
    }
    this._kernel.process(this._freeQueue, channelCount);
    for (let channel = 0; channel < channelCount; ++channel) {
      this._freeQueue.pull(output[channel], RENDER_QUANTUM_FRAMES);
    }

    return true;
  }
}

registerProcessor('wasm-worklet-processor', WASMWorkletProcessor);
