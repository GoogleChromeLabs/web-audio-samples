// Copyright (c) 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import Module from './simple-kernel.wasmmodule.js';
import {
  RENDER_QUANTUM_FRAMES,
  MAX_CHANNEL_COUNT,
  FreeQueue,
} from './free-queue.js';

/**
 * A demonstration of a WASM-powered AudioWorkletProcessor.
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

    Module().then((module) => {
      this.module = module;

      // Allocate buffer for heap access.
      this._heapInputBuffer = new FreeQueue(
        this.module,
        RENDER_QUANTUM_FRAMES,
        2,
        MAX_CHANNEL_COUNT
      );
      this._heapOutputBuffer = new FreeQueue(
        this.module,
        RENDER_QUANTUM_FRAMES,
        2,
        MAX_CHANNEL_COUNT
      );
      this._kernel = new this.module.SimpleKernel();
    });
  }

  /**
   * System-invoked process callback function.
   * @param {Array} inputs Incoming audio stream.
   * @param {Array} outputs Outgoing audio stream.
   * @param {object} parameters AudioParam data.
   * @return {boolean} Active source flag.
   */
  process(inputs, outputs, parameters) {
    if (this.module === undefined) {
      // Wait for WASM module to finish loading.
      return true;
    }

    const input = inputs[0];
    const output = outputs[0];
    if (!input || !output || input.length === 0 || output.length === 0) {
      return true;
    }

    const channelCount = input.length;

    // Adapt HeapAudioBuffer for channel count changes.
    this._heapInputBuffer.adaptChannel(channelCount);
    this._heapOutputBuffer.adaptChannel(channelCount);

    // Copy-in, process in WASM kernel, and copy-out.
    for (let channel = 0; channel < channelCount; ++channel) {
      this._heapInputBuffer.getChannelData(channel).set(input[channel]);
    }

    this._kernel.process(
      this._heapInputBuffer.getHeapAddress(),
      this._heapOutputBuffer.getHeapAddress(),
      channelCount
    );

    for (let channel = 0; channel < channelCount; ++channel) {
      output[channel].set(this._heapOutputBuffer.getChannelData(channel));
    }

    return true;
  }
}

registerProcessor('wasm-worklet-processor', WASMWorkletProcessor);
