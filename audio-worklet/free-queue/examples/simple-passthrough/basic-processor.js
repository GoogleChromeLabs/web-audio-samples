import { FreeQueueSAB } from "../../../../lib/free-queue/free-queue-sab.js";
import { FRAME_SIZE, RENDER_QUANTUM } from "./constants.js";

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
    Object.setPrototypeOf(this.inputQueue, FreeQueueSAB.prototype);
    Object.setPrototypeOf(this.outputQueue, FreeQueueSAB.prototype);

  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    
    // Push data from input into inputQueue.
    this.inputQueue.push(input, RENDER_QUANTUM);
    
    // Try to pull data out of outputQueue and store it in output.
    const didPull = this.outputQueue.pull(output, RENDER_QUANTUM);
    if (!didPull) {
      console.log("failed to pull.");
    }
    
    // Wake up worker to process a frame of data.
    if (this.inputQueue.isFrameAvailable(FRAME_SIZE)) {
      Atomics.notify(this.atomicState, 0, 1);
    }
    
    return true;
  }
}

registerProcessor('basic-processor', BasicProcessor);
