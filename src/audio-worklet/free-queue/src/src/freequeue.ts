export interface FreeQueuePointers {
  memory: WebAssembly.Memory;
  bufferLengthPointer: number;
  channelCountPointer: number;
  statePointer: number;
  channelsPointer: number;
}

/**
 * A shared storage for FreeQueue operation backed by SharedArrayBuffer.
 *
 * @typedef SharedRingBuffer
 * @property {Uint32Array} states Backed by SharedArrayBuffer.
 * @property {number} bufferLength The frame buffer length. Should be identical
 * throughout channels.
 * @property {Array<Float32Array>} channels The length must be > 0.
 * @property {number} channelCount same with channelData.length
 */

/**
 * A single-producer/single-consumer lock-free FIFO backed by SharedArrayBuffer.
 * In a typical pattern is that a worklet pulls the data from the queue and a
 * worker renders audio data to fill in the queue.
 */
export class FreeQueue {
  private states: Uint32Array;
  private channels: Float32Array[];
  private bufferLength: number;
  private channelCount: number;

  static States = {
    READ: 0,
    WRITE: 1,
  };

  /**
   * FreeQueue constructor. A shared buffer created by this constuctor
   * will be shared between two threads.
   *
   * @param {number} size Frame buffer length.
   * @param {number} channelCount Total channel count.
   */
  constructor(size: number, channelCount = 1) {
    this.states = new Uint32Array(
      new SharedArrayBuffer(
        Object.keys(FreeQueue.States).length * Uint32Array.BYTES_PER_ELEMENT
      )
    );

    this.bufferLength = size + 1;
    this.channelCount = channelCount;
    this.channels = [];
    for (let i = 0; i < channelCount; i++) {
      this.channels.push(
        new Float32Array(
          new SharedArrayBuffer(
            this.bufferLength * Float32Array.BYTES_PER_ELEMENT
          )
        )
      );
    }
  }

  static fromPointers(fqPointers: FreeQueuePointers) {
    const fq = new FreeQueue(0, 0);
    const HEAPU32 = new Uint32Array(fqPointers.memory.buffer);
    const HEAPF32 = new Float32Array(fqPointers.memory.buffer);

    const bufferLength = HEAPU32[fqPointers.bufferLengthPointer / 4];
    const channelCount = HEAPU32[fqPointers.channelCountPointer / 4];
    const states = HEAPU32.subarray(
      HEAPU32[fqPointers.statePointer / 4] / 4,
      HEAPU32[fqPointers.statePointer / 4] / 4 + 2
    );
    const channels = [];
    for (let i = 0; i < channelCount; i++) {
      channels.push(
        HEAPF32.subarray(
          HEAPU32[HEAPU32[fqPointers.channelsPointer / 4] / 4 + i] / 4,
          HEAPU32[HEAPU32[fqPointers.channelsPointer / 4] / 4 + i] / 4 +
            bufferLength
        )
      );
    }

    fq.bufferLength = bufferLength;
    fq.channelCount = channelCount;
    fq.states = states;
    fq.channels = channels;

    return fq;
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
  push(input: Float32Array[], blockLength: number): boolean {
    const currentRead = Atomics.load(this.states, FreeQueue.States.READ);
    const currentWrite = Atomics.load(this.states, FreeQueue.States.WRITE);

    if (this._getAvailableWrite(currentRead, currentWrite) < blockLength) {
      return false;
    }

    let nextWrite = currentWrite + blockLength;
    if (this.bufferLength < nextWrite) {
      nextWrite -= this.bufferLength;
      for (let channel = 0; channel < this.channelCount; channel++) {
        const blockA = this.channels[channel].subarray(currentWrite);
        const blockB = this.channels[channel].subarray(0, nextWrite);
        blockA.set(input[channel].subarray(0, blockA.length));
        blockB.set(
          input[channel].subarray(
            blockA.length,
            blockLength - blockA.length + 1
          )
        );
      }
    } else {
      for (let channel = 0; channel < this.channelCount; channel++) {
        this.channels[channel]
          .subarray(currentWrite, nextWrite)
          .set(input[channel].subarray(0, blockLength));
      }
      if (nextWrite === this.bufferLength) nextWrite = 0;
    }

    Atomics.store(this.states, FreeQueue.States.WRITE, nextWrite);
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
  pull(output: Float32Array[], blockLength: number): boolean {
    const currentRead = Atomics.load(this.states, FreeQueue.States.READ);
    const currentWrite = Atomics.load(this.states, FreeQueue.States.WRITE);

    if (this._getAvailableRead(currentRead, currentWrite) < blockLength) {
      return false;
    }

    let nextRead = currentRead + blockLength;
    if (this.bufferLength < nextRead) {
      nextRead -= this.bufferLength;
      for (let channel = 0; channel < this.channelCount; channel++) {
        const blockA = this.channels[channel].subarray(currentRead);
        const blockB = this.channels[channel].subarray(0, nextRead);
        output[channel].set(blockA);
        output[channel].set(blockB, blockA.length);
      }
    } else {
      for (let channel = 0; channel < this.channelCount; ++channel) {
        output[channel].set(
          this.channels[channel].subarray(currentRead, nextRead)
        );
      }
      if (nextRead === this.bufferLength) {
        nextRead = 0;
      }
    }

    Atomics.store(this.states, FreeQueue.States.READ, nextRead);
    return true;
  }

  print() {
    const currentRead = Atomics.load(this.states, FreeQueue.States.READ);
    const currentWrite = Atomics.load(this.states, FreeQueue.States.WRITE);

    console.log(this, {
      availableRead: this._getAvailableRead(currentRead, currentWrite),
      availableWrite: this._getAvailableWrite(currentRead, currentWrite),
    });
  }

  getAvailableBytes() {
    const currentRead = Atomics.load(this.states, FreeQueue.States.READ);
    const currentWrite = Atomics.load(this.states, FreeQueue.States.WRITE);
    return this._getAvailableRead(currentRead, currentWrite);
  }

  isFrameAvailable(size: number) {
    return this.getAvailableBytes() >= size;
  }
  /**
   * @return {number}
   */
  private getBufferLength(): number {
    return this.bufferLength - 1;
  }

  private _getAvailableWrite(readIndex: number, writeIndex: number) {
    if (writeIndex >= readIndex)
      return this.bufferLength - writeIndex + readIndex - 1;

    return readIndex - writeIndex - 1;
  }

  private _getAvailableRead(readIndex: number, writeIndex: number) {
    if (writeIndex >= readIndex) return writeIndex - readIndex;

    return writeIndex + this.bufferLength - readIndex;
  }

  private _reset() {
    for (let channel = 0; channel < this.channelCount; channel++) {
      this.channels[channel].fill(0);
    }
    Atomics.store(this.states, FreeQueue.States.READ, 0);
    Atomics.store(this.states, FreeQueue.States.WRITE, 0);
  }
}
