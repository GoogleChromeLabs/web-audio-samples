/**
 * A shared storage for FreeQueue operation backed by SharedArrayBuffer.
 *
 * @typedef SharedRingBuffer
 * @property {Uint32Array} states Backed by SharedArrayBuffer.
 * @property {number} bufferLength The frame buffer length. Should be identical
 * throughout channels.
 * @property {Array<Float32Array>} channelData The length must be > 0.
 * @property {number} channelCount same with channelData.length
 */

/**
 * A single-producer/single-consumer lock-free FIFO backed by SharedArrayBuffer.
 * In a typical pattern is that a worklet pulls the data from the queue and a
 * worker renders audio data to fill in the queue.
 */

class FreeQueueSAB {

    /**
     * An index set for shared state fields. Requires atomic access.
     * @enum {number}
     */
    States = {
      /** @type {number} A shared index for reading from the queue. (consumer) */
      READ: 0,
      /** @type {number} A shared index for writing into the queue. (producer) */
      WRITE: 1,  
    }
    
    /**
     * FreeQueue constructor. A shared buffer created by this constuctor
     * will be shared between two threads.
     *
     * @param {number} size Frame buffer length.
     * @param {number} channelCount Total channel count.
     */
    constructor(size, channelCount = 1) {
      this.states = new Uint32Array(
        new SharedArrayBuffer(
          Object.keys(this.States).length * Uint32Array.BYTES_PER_ELEMENT
        )
      );
      /**
       * Use one extra bin to distinguish between the read and write indices 
       * when full. See Tim Blechmann's |boost::lockfree::spsc_queue|
       * implementation.
       */
      this.bufferLength = size + 1;
      this.channelCount = channelCount;
      this.channelData = [];
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
  
    /**
     * Helper function for creating FreeQueue from pointers.
     * @param {FreeQueuePointers} queuePointers 
     * An object containing various pointers required to create FreeQueue
     *
     * interface FreeQueuePointers {
     *   memory: WebAssembly.Memory;   // Reference to WebAssembly Memory
     *   bufferLengthPointer: number;
     *   channelCountPointer: number;
     *   statePointer: number;
     *   channelDataPointer: number;
     * }
     * @returns FreeQueue
     */
    static fromPointers(queuePointers) {
      const queue = new FreeQueueSAB(0, 0);
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
  
    /**
     * Pushes the data into queue. Used by producer.
     *
     * @param {Float32Array[]} input Its length must match with the channel
     *   count of this queue.
     * @param {number} blockLength Input block frame length. It must be identical
     *   throughout channels.
     * @return {boolean} False if the operation fails.
     */
    push(input, blockLength) {
      const currentRead = Atomics.load(this.states, this.States.READ);
      const currentWrite = Atomics.load(this.states, this.States.WRITE);
      if (this._getAvailableWrite(currentRead, currentWrite) < blockLength) {
        return false;
      }
      let nextWrite = currentWrite + blockLength;
      if (this.bufferLength < nextWrite) {
        nextWrite -= this.bufferLength;
        for (let channel = 0; channel < this.channelCount; channel++) {
          const blockA = this.channelData[channel].subarray(currentWrite);
          const blockB = this.channelData[channel].subarray(0, nextWrite);
          blockA.set(input[channel].subarray(0, blockA.length));
          blockB.set(input[channel].subarray(blockA.length));
        }
      } else {
        for (let channel = 0; channel < this.channelCount; channel++) {
          this.channelData[channel]
              .subarray(currentWrite, nextWrite)
              .set(input[channel].subarray(0, blockLength));
        }
        if (nextWrite === this.bufferLength) nextWrite = 0;
      }
      Atomics.store(this.states, this.States.WRITE, nextWrite);
      return true;
    }
  
    /**
     * Pulls data out of the queue. Used by consumer.
     *
     * @param {Float32Array[]} output Its length must match with the channel
     *   count of this queue.
     * @param {number} blockLength output block length. It must be identical
     *   throughout channels.
     * @return {boolean} False if the operation fails.
     */
    pull(output, blockLength) {
      const currentRead = Atomics.load(this.states, this.States.READ);
      const currentWrite = Atomics.load(this.states, this.States.WRITE);
      if (this._getAvailableRead(currentRead, currentWrite) < blockLength) {
        return false;
      }
      let nextRead = currentRead + blockLength;
      if (this.bufferLength < nextRead) {
        nextRead -= this.bufferLength;
        for (let channel = 0; channel < this.channelCount; channel++) {
          const blockA = this.channelData[channel].subarray(currentRead);
          const blockB = this.channelData[channel].subarray(0, nextRead);
          output[channel].set(blockA);
          output[channel].set(blockB, blockA.length);
        }
      } else {
        for (let channel = 0; channel < this.channelCount; ++channel) {
          output[channel].set(
              this.channelData[channel].subarray(currentRead, nextRead)
          );
        }
        if (nextRead === this.bufferLength) {
          nextRead = 0;
        }
      }
      Atomics.store(this.states, this.States.READ, nextRead);
      return true;
    }
    /**
     * Helper function for debugging.
     * Prints currently available read and write.
     */
    printAvailableReadAndWrite() {
      const currentRead = Atomics.load(this.states, this.States.READ);
      const currentWrite = Atomics.load(this.states, this.States.WRITE);
      console.log(this, {
          availableRead: this._getAvailableRead(currentRead, currentWrite),
          availableWrite: this._getAvailableWrite(currentRead, currentWrite),
      });
    }
    /**
     * 
     * @returns {number} number of samples available for read
     */
    getAvailableSamples() {
      const currentRead = Atomics.load(this.states, this.States.READ);
      const currentWrite = Atomics.load(this.states, this.States.WRITE);
      return this._getAvailableRead(currentRead, currentWrite);
    }
    /**
     * 
     * @param {number} size 
     * @returns boolean. if frame of given size is available or not.
     */
    isFrameAvailable(size) {
      return this.getAvailableSamples() >= size;
    }
  
    /**
     * @return {number}
     */
    getBufferLength() {
      return this.bufferLength - 1;
    }
  
    _getAvailableWrite(readIndex, writeIndex) {
      if (writeIndex >= readIndex)
          return this.bufferLength - writeIndex + readIndex - 1;
      return readIndex - writeIndex - 1;
    }
  
    _getAvailableRead(readIndex, writeIndex) {
      if (writeIndex >= readIndex) return writeIndex - readIndex;
      return writeIndex + this.bufferLength - readIndex;
    }
  
    _reset() {
      for (let channel = 0; channel < this.channelCount; channel++) {
        this.channelData[channel].fill(0);
      }
      Atomics.store(this.states, this.States.READ, 0);
      Atomics.store(this.states, this.States.WRITE, 0);
    }
  }
  
export { FreeQueueSAB };