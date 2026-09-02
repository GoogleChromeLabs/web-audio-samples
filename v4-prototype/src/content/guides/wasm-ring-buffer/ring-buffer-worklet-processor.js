/**
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import Module from './variable-buffer-kernel.wasmmodule.js';
import { FreeQueue } from './free-queue.js';

/**
 * An example AudioWorkletProcessor using an internal RingBuffer to bridge
 * differing block sizes between the C++ audio kernel (1024 frames) and the
 * AudioWorklet rendering quantum (128 frames).
 *
 * @class RingBufferWorkletProcessor
 * @extends AudioWorkletProcessor
 */
class RingBufferWorkletProcessor extends AudioWorkletProcessor {
  /**
   * @constructor
   * @param {object} options
   */
  constructor(options) {
    super();

    this._kernelBufferSize =
      options?.processorOptions?.kernelBufferSize ?? 1024;
    this._channelCount = options?.processorOptions?.channelCount ?? 1;

    this._inputAudioBuffer = new FreeQueue(
      Module,
      this._kernelBufferSize,
      this._channelCount
    );
    this._outputAudioBuffer = new FreeQueue(
      Module,
      this._kernelBufferSize,
      this._channelCount
    );

    this._heapInputBuffer = new FreeQueue(
      Module,
      this._kernelBufferSize,
      this._channelCount
    );
    this._heapOutputBuffer = new FreeQueue(
      Module,
      this._kernelBufferSize,
      this._channelCount
    );

    // WASM audio processing kernel.
    this._kernel = new Module.VariableBufferKernel(this._kernelBufferSize);
  }

  /**
   * System-invoked process callback function.
   * @param {Array} inputs Incoming audio stream.
   * @param {Array} outputs Outgoing audio stream.
   * @param {object} parameters AudioParam data.
   * @return {boolean} Active source flag.
   */
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !output || input.length === 0 || output.length === 0) {
      return true;
    }

    // AudioWorkletProcessor always receives 128 frames in and 128 frames out.
    // Push 128 frames into the ring buffer.
    this._inputAudioBuffer.push(input);

    // Process only if we have enough frames for the kernel.
    if (this._inputAudioBuffer.framesAvailable >= this._kernelBufferSize) {
      this._inputAudioBuffer.pull(this._inputAudioBuffer.getChannelData());

      this._kernel.process(
        this._inputAudioBuffer.getHeapAddress(),
        this._outputAudioBuffer.getHeapAddress(),
        this._channelCount
      );

      this._outputAudioBuffer.push(this._outputAudioBuffer.getChannelData());
    }

    // Always pull 128 frames out.
    this._outputAudioBuffer.pull(output);

    return true;
  }
}

registerProcessor('ring-buffer-worklet-processor', RingBufferWorkletProcessor);
