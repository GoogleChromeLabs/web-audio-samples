import FreeQueue from './lib/free-queue.js';
import { FRAME_SIZE, RENDER_QUANTUM } from './constants.js';

/**
 * A simple AudioWorkletProcessor node.
 *
 * @class BasicProcessor
 * @extends AudioWorkletProcessor
 */
class BasicProcessor extends AudioWorkletProcessor {
  /**
   * Constructor to initialize, input and output FreeQueue instances
   * and atomicState to synchronise Worker with AudioWorklet
   * @param {Object} options AudioWorkletProcessor options
   *    to initialize inputQueue, outputQueue and atomicState
   */
  constructor(options) {
    super();
    this.inputQueue = options.processorOptions.inputQueue;
    this.outputQueue = options.processorOptions.outputQueue;
    this.atomicState = options.processorOptions.atomicState;
    Object.setPrototypeOf(this.inputQueue, FreeQueue.prototype);
    Object.setPrototypeOf(this.outputQueue, FreeQueue.prototype);
  }

  /**
   * The AudioWorkletProcessor's isochronous callback.
   * @param {Array<Float32Array>>} inputs
   * @param {Array<Float32Array>>} outputs
   * @returns {boolean}
   */
  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    // Pull processed audio data out of `outputQueue` and pass it in output.
    // The first few pulls would fail because there's not enough data.
    const didPull = this.outputQueue.pull(output, RENDER_QUANTUM);
    if (!didPull) {
      console.log('[basic-processor.js] Not enough data in outputQueue');
    }

    // Store incoming audio data `input` into `inputQueue`.
    const didPush = this.inputQueue.push(input, RENDER_QUANTUM);
    if (!didPush) {
      console.log('[basic-processor.js] Not enough space in inputQueue');
    }

    // Notify worker.js if `inputQueue` has enough data to perform the batch
    // processing of FRAME_SIZE.
    if (this.inputQueue.hasEnoughFramesFor(FRAME_SIZE)) {
      Atomics.notify(this.atomicState, 0, 1);
    }

    return true;
  }
}

registerProcessor('basic-processor', BasicProcessor);
