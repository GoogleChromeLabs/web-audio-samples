import FreeQueue from '../../src/free-queue.js';

const RENDER_QUANTUM = 128

/**
 * A simple AudioWorkletProcessor node that will act as sink.
 * It will pull out audio from queue and render it.
 * 
 * @class BasicProcessor
 * @extends AudioWorkletProcessor
 */
class SinkProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    // Initializes a FreeQueue object with the option passed from the
    // AudioWorkletNode constructor on the main thread.
    this.queue = options.processorOptions.queue;
    Object.setPrototypeOf(this.queue, FreeQueue.prototype);
  }

  process(inputs, outputs) {
    const output = outputs[0];

    const didPull = this.queue.pull(output, RENDER_QUANTUM);
    didPull ? null : console.log("failed");

    return true;
  }
}

registerProcessor('sink-processor', SinkProcessor);
