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
    // Initialize the Queue.
    // We have to set prototype of queue, because queue object is passed
    // using structured cloning algorithm.
    // See - 
    // https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
    this.queue = options.processorOptions.queue;
    Object.setPrototypeOf(this.queue, FreeQueue.prototype);
  }

  process(inputs, outputs) {
    const output = outputs[0];

    // Pull out render quantum frame from the queue into output.
    // If failed, print "failed" to console.
    const didPull = this.queue.pull(output, RENDER_QUANTUM);
    didPull ? null : console.log("failed");

    return true;
  }

}


registerProcessor('sink-processor', SinkProcessor);
