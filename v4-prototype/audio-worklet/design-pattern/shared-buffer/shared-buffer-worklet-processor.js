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

// Description of shared states. See shared-buffer-worker.js for details.
const STATE = {
  REQUEST_RENDER: 0,
  IB_FRAMES_AVAILABLE: 1,
  IB_READ_INDEX: 2,
  IB_WRITE_INDEX: 3,
  OB_FRAMES_AVAILABLE: 4,
  OB_READ_INDEX: 5,
  OB_WRITE_INDEX: 6,
  RING_BUFFER_LENGTH: 7,
  KERNEL_LENGTH: 8,
};

/**
 * @class SharedBufferWorkletProcessor
 * @extends AudioWorkletProcessor
 */
class SharedBufferWorkletProcessor extends AudioWorkletProcessor {
  /**
   * @constructor
   * @param {AudioWorkletNodeOptions} nodeOptions
   */
  constructor(nodeOptions) {
    super();

    this._initialized = false;
    this.port.onmessage = this._initializeOnEvent.bind(this);
  }

  /**
   * Initializes upon the event from the worker backend.
   * @param {Event} eventFromWorker
   */
  _initializeOnEvent(eventFromWorker) {
    const sharedBuffers = eventFromWorker.data;

    // Get the states buffer.
    this._states = new Int32Array(sharedBuffers.states);

    // Worker's input/output buffers (mono channel in this demo).
    this._inputRingBuffer = [new Float32Array(sharedBuffers.inputRingBuffer)];
    this._outputRingBuffer = [new Float32Array(sharedBuffers.outputRingBuffer)];

    this._ringBufferLength = this._states[STATE.RING_BUFFER_LENGTH];
    this._kernelLength = this._states[STATE.KERNEL_LENGTH];

    this._initialized = true;
    this.port.postMessage({
      message: 'PROCESSOR_READY',
    });
  }

  /**
   * Push 128 samples to the shared input buffer.
   * @param {Float32Array} inputChannelData
   */
  _pushInputChannelData(inputChannelData) {
    const inputWriteIndex = this._states[STATE.IB_WRITE_INDEX];

    if (inputWriteIndex + inputChannelData.length < this._ringBufferLength) {
      this._inputRingBuffer[0].set(inputChannelData, inputWriteIndex);
      this._states[STATE.IB_WRITE_INDEX] += inputChannelData.length;
    } else {
      const splitIndex = this._ringBufferLength - inputWriteIndex;
      const firstHalf = inputChannelData.subarray(0, splitIndex);
      const secondHalf = inputChannelData.subarray(splitIndex);
      this._inputRingBuffer[0].set(firstHalf, inputWriteIndex);
      this._inputRingBuffer[0].set(secondHalf);
      this._states[STATE.IB_WRITE_INDEX] = secondHalf.length;
    }

    this._states[STATE.IB_FRAMES_AVAILABLE] += inputChannelData.length;
  }

  /**
   * Pull data out of shared output buffer to fill outputChannelData
   * (128 frames).
   * @param {Float32Array} outputChannelData
   */
  _pullOutputChannelData(outputChannelData) {
    const outputReadIndex = this._states[STATE.OB_READ_INDEX];
    const nextReadIndex = outputReadIndex + outputChannelData.length;

    if (nextReadIndex < this._ringBufferLength) {
      outputChannelData.set(
        this._outputRingBuffer[0].subarray(outputReadIndex, nextReadIndex)
      );
      this._states[STATE.OB_READ_INDEX] += outputChannelData.length;
    } else {
      const overflow = nextReadIndex - this._ringBufferLength;
      const firstHalf = this._outputRingBuffer[0].subarray(outputReadIndex);
      const secondHalf = this._outputRingBuffer[0].subarray(0, overflow);
      outputChannelData.set(firstHalf);
      outputChannelData.set(secondHalf, firstHalf.length);
      this._states[STATE.OB_READ_INDEX] = secondHalf.length;
    }
  }

  /**
   * AWP's process callback.
   * @param {Array} inputs
   * @param {Array} outputs
   * @return {boolean}
   */
  process(inputs, outputs) {
    if (!this._initialized) {
      return true;
    }

    const inputChannelData = inputs[0][0];
    const outputChannelData = outputs[0][0];

    if (!inputChannelData || !outputChannelData) {
      return true;
    }

    this._pushInputChannelData(inputChannelData);
    this._pullOutputChannelData(outputChannelData);

    if (this._states[STATE.IB_FRAMES_AVAILABLE] >= this._kernelLength) {
      Atomics.notify(this._states, STATE.REQUEST_RENDER, 1);
    }

    return true;
  }
}

registerProcessor(
  'shared-buffer-worklet-processor',
  SharedBufferWorkletProcessor
);
