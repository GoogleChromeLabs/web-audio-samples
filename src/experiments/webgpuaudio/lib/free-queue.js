/**
 * Copyright 2019 Google LLC
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


/* global Atomics SharedArrayBuffer:true */


/**
 * An index set for shared state fields. Requires atomic access.
 * @enum {number}
 */
const States = {
  /** @type {number} A shared index for reading from the queue. (consumer) */
  Read: 0,
  /** @type {number} A shared index for writing into the queue. (producer) */
  Write: 1,
};


/**
 * A shared storage for FreeQueue operation backed by SharedArrayBuffer.
 *
 * @typedef SharedBuffer
 * @property {Uint32Array} states Backed by SharedArrayBuffer.
 * @property {Array<Float32Array>} channelData The length must be > 0.
 * @property {number} length The frame buffer length. Should be identical
 *   throughout channels.
 * @property {number} channelCount same with channelData.length
 */


/**
 * A single-producer/single-consumer lock-free FIFO backed by SharedArrayBuffer.
 * In a typical pattern is that a worklet pulls the data from the queue and a
 * worker renders audio data to fill in the queue.
 */
class FreeQueue {
  /**
   * A static SharedBuffer factory. A shared buffer created by this factory
   * will be shared between two threads.
   *
   * @param {number} length Frame buffer length.
   * @param {number} channelCount Total channel count.
   * @return {SharedBuffer}
   */
  static createSharedBuffer(length, channelCount) {
    const states = new Uint32Array(new SharedArrayBuffer(
        Object.keys(States).length * Uint32Array.BYTES_PER_ELEMENT));
    // Priming the buffer by moving the write index to the middle of buffer.
    states[States.Write] = Math.ceil(length * 0.5);
    const channelData = [];
    for (let i = 0; i < channelCount; ++i) {
      // Use one extra bin to distinguish between the read and write indices
      // when full. See Tim Blechmann's |boost::lockfree::spsc_queue|
      // implementation.
      channelData.push(new Float32Array(new SharedArrayBuffer(
          (length + 1) * Float32Array.BYTES_PER_ELEMENT)));
    }
    return {states, channelData, length, channelCount};
  }

  /**
   * @param {!SharedBuffer} sharedBuffer A backing SharedBuffer object.
   */
  constructor(sharedBuffer) {
    this._states = sharedBuffer.states;
    this._channelData = sharedBuffer.channelData;
    // Note that the allocated buffer has one extra bin.
    this._bufferLength = sharedBuffer.length + 1;
    this._channelCount = sharedBuffer.channelCount;
  }

  _reset() {
    for (let channel = 0; channel < this._channelCount; ++channel) {
      this._channelData[channel].fill(0);
    }
    Atomics.store(this._states, States.Read, 0);
    Atomics.store(this._states, States.Write, 0);
  }

  /**
   * Pushes the data into queue. Used by producer.
   *
   * @param {Array<Float32Array>} input Its length must match with the channel
   *   count of this queue.
   * @param {number} blockLength Input block frame length. It must be identical
   *   throughout channels.
   * @return {boolean} False if the operation fails.
   */
  push(input, blockLength) {
    const currentWrite = Atomics.load(this._states, States.Write);
    const currentRead = Atomics.load(this._states, States.Read);
    if (this._getAvailableWrite(currentWrite, currentRead) < blockLength) {
      return false;
    }

    let nextWrite = currentWrite + blockLength;
    if (this._bufferLength < nextWrite) {
      nextWrite -= this._bufferLength;
      for (let channel = 0; channel < this._channelCount; ++channel) {
        const blockA = this._channelData[channel].subarray(currentWrite);
        const blockB = this._channelData[channel].subarray(0, nextWrite);
        blockA.set(input[channel].subarray(0, blockA.length));
        blockB.set(input[channel].subarray(blockA.length));
      }
    } else {
      for (let channel = 0; channel < this._channelCount; ++channel) {
        this._channelData[channel]
            .subarray(currentWrite, nextWrite).set(input[channel]);
      }
      if (nextWrite === this._bufferLength) {
        nextWrite = 0;
      }
    }

    Atomics.store(this._states, States.Write, nextWrite);
    return true;
  }

  /**
   * Pulls data out of the queue. Used by consumer.
   *
   * @param {Array<Float32Array>} output Its length must match with the channel
   *   count of this queue.
   * @param {number} blockLength output block length. It must be identical
   *   throughout channels.
   * @return {boolean} False if the operation fails.
   */
  pull(output, blockLength) {
    const currentWrite = Atomics.load(this._states, States.Write);
    const currentRead = Atomics.load(this._states, States.Read);
    if (this._getAvailableRead(currentWrite, currentRead) < blockLength) {
      return false;
    }

    let nextRead = currentRead + blockLength;
    if (this._bufferLength < nextRead) {
      nextRead -= this._bufferLength;
      for (let channel = 0; channel < this._channelCount; ++channel) {
        const blockA = this._channelData[channel].subarray(currentRead);
        const blockB = this._channelData[channel].subarray(0, nextRead);
        output[channel].set(blockA);
        output[channel].set(blockB, blockA.length);
      }
    } else {
      for (let channel = 0; channel < this._channelCount; ++channel) {
        output[channel].set(
            this._channelData[channel].subarray(currentRead, nextRead));
      }
      if (nextRead === this._bufferLength) {
        nextRead = 0;
      }
    }

    Atomics.store(this._states, States.Read, nextRead);
    return true;
  }

  /**
   * @return {number}
   */
  getBufferLength() {
    // Returns the buffer length for external use.
    return this._bufferLength - 1;
  }

  _getAvailableWrite(writeIndex, readIndex) {
    const availableWrite = readIndex - writeIndex - 1;
    return (availableWrite <= -1)
        ? availableWrite + this._bufferLength : availableWrite;
  }

  _getAvailableRead(writeIndex, readIndex) {
    const availableRead = writeIndex - readIndex;
    return (availableRead >= 0)
        ? availableRead : availableRead + this._bufferLength;
  }
}

export default FreeQueue;