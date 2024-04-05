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



const BYTES_PER_SAMPLE = Float32Array.BYTES_PER_ELEMENT;
const BYTES_PER_UNIT = Uint16Array.BYTES_PER_ELEMENT;
const MAX_CHANNEL_COUNT = 32;
const RENDER_QUANTUM_FRAMES = 128;

/**
 * A single-producer/single-consumer lock-free FIFO backed by SharedArrayBuffer.
 * In a typical pattern, a worklet pulls the data from the queue, and a
 * worker renders audio data to fill in the queue.
 */
class FreeQueue {
  constructor(size, channelCount = 1) {
    // Initialize shared states using SharedArrayBuffer
    this.states = new Uint32Array(
      new SharedArrayBuffer(
        Object.keys(this.States).length * Uint32Array.BYTES_PER_ELEMENT
      )
    );
    this.bufferLength = size + 1;
    this.channelCount = channelCount;
    this.channelData = [];
    // Create shared buffers for each channel
    for (let i = 0; i < channelCount; i++) {
      this.channelData.push(
        new Float32Array(
          new SharedArrayBuffer(
            this.bufferLength * Float32Array.BYTES_PER_ELEMENT
          )
        )
      );
    }
  }

  // Method to create FreeQueue instance from pointers
  static fromPointers(queuePointers) {
    const queue = new FreeQueue(0, 0);
    const HEAPU32 = new Uint32Array(queuePointers.memory.buffer);
    const HEAPF32 = new Float32Array(queuePointers.memory.buffer);
    const bufferLength = HEAPU32[queuePointers.bufferLengthPointer / 4];
    const channelCount = HEAPU32[queuePointers.channelCountPointer / 4];
    const states = HEAPU32.subarray(
      HEAPU32[queuePointers.statePointer / 4] / 4,
      HEAPU32[queuePointers.statePointer / 4] / 4 + 2
    );
    const channelData = [];
    for (let i = 0; i < channelCount; i++) {
      channelData.push(
        HEAPF32.subarray(
          HEAPU32[HEAPU32[queuePointers.channelDataPointer / 4] / 4 + i] / 4,
          HEAPU32[HEAPU32[queuePointers.channelDataPointer / 4] / 4 + i] / 4 +
            bufferLength
        )
      );
    }
    queue.bufferLength = bufferLength;
    queue.channelCount = channelCount;
    queue.states = states;
    queue.channelData = channelData;
    return queue;
  }

  // Method to push data into the queue
  push(input, blockLength) {
    // Get current read and write indices
    const currentRead = Atomics.load(this.states, this.States.READ);
    const currentWrite = Atomics.load(this.states, this.States.WRITE);
    // Check if there is enough space in the queue to push the data
    if (this._getAvailableWrite(currentRead, currentWrite) < blockLength) {
      return false;
    }
    // Calculate next write index
    let nextWrite = currentWrite + blockLength;
    // Copy data to wrapped part of buffer
    if (this.bufferLength < nextWrite) {
      nextWrite -= this.bufferLength;
      for (let channel = 0; channel < this.channelCount; channel++) {
        const blockA = this.channelData[channel].subarray(currentWrite);
        const blockB = this.channelData[channel].subarray(0, nextWrite);
        blockA.set(input[channel].subarray(0, blockA.length));
        blockB.set(input[channel].subarray(blockA.length));
      }
    } else {
      // Copy data to non-wrapped part of buffer
      for (let channel = 0; channel < this.channelCount; channel++) {
        this.channelData[channel]
          .subarray(currentWrite, nextWrite)
          .set(input[channel].subarray(0, blockLength));
      }
      if (nextWrite === this.bufferLength) nextWrite = 0;
    }
    // Updated the write index
    Atomics.store(this.states, this.States.WRITE, nextWrite);
    return true;
  }

  // Method to pull data from the queue
  pull(output, blockLength) {
    // Get current read and write indices
    const currentRead = Atomics.load(this.states, this.States.READ);
    const currentWrite = Atomics.load(this.states, this.States.WRITE);
    // Check if there is enough data in the queue to pull
    if (this._getAvailableRead(currentRead, currentWrite) < blockLength) {
      return false;
    }
    // Calculate next read index
    let nextRead = currentRead + blockLength;
    if (this.bufferLength < nextRead) {
      // Wrap around if next read index exceeds buffer length
      nextRead -= this.bufferLength;
      // Copy data from wrapped part of buffer
      for (let channel = 0; channel < this.channelCount; channel++) {
        const blockA = this.channelData[channel].subarray(currentRead);
        const blockB = this.channelData[channel].subarray(0, nextRead);
        output[channel].set(blockA);
        output[channel].set(blockB, blockA.length);
      }
    } else {
      // Copy data from non-wrapped part of buffer
      for (let channel = 0; channel < this.channelCount; ++channel) {
        output[channel].set(
          this.channelData[channel].subarray(currentRead, nextRead)
        );
      }
      if (nextRead === this.bufferLength) {
        nextRead = 0;
      }
    }
    // Updated the read index
    Atomics.store(this.states, this.States.READ, nextRead);
    return true;
  }

  // Method to print available read and write indices
  printAvailableReadAndWrite() {
    const currentRead = Atomics.load(this.states, this.States.READ);
    const currentWrite = Atomics.load(this.states, this.States.WRITE);
    console.log(this, {
      availableRead: this._getAvailableRead(currentRead, currentWrite),
      availableWrite: this._getAvailableWrite(currentRead, currentWrite),
    });
  }

  // Method to print available read and write indices
  getAvailableSamples() {
    const currentRead = Atomics.load(this.states, this.States.READ);
    const currentWrite = Atomics.load(this.states, this.States.WRITE);
    return this._getAvailableRead(currentRead, currentWrite);
  }

  // Method to check if a frame of specified size is available in the queue
  isFrameAvailable(size) {
    return this.getAvailableSamples() >= size;
  }

  // Method to get buffer length
  getBufferLength() {
    return this.bufferLength - 1;
  }

  // Helper method to calculate available write space
  _getAvailableWrite(readIndex, writeIndex) {
    if (writeIndex >= readIndex)
      return this.bufferLength - writeIndex + readIndex - 1;
    return readIndex - writeIndex - 1;
  }

  // Helper method to calculate available read space
  _getAvailableRead(readIndex, writeIndex) {
    if (writeIndex >= readIndex) return writeIndex - readIndex;
    return writeIndex + this.bufferLength - readIndex;
  }

  // Method to reset queue state
  _reset() {
    for (let channel = 0; channel < this.channelCount; channel++) {
      this.channelData[channel].fill(0);
    }
    Atomics.store(this.states, this.States.READ, 0);
    Atomics.store(this.states, this.States.WRITE, 0);
  }
}


export { MAX_CHANNEL_COUNT,
  RENDER_QUANTUM_FRAMES,FreeQueue };