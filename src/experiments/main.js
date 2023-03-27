import FreeQueue from '../../src/free-queue.js'
import { QUEUE_SIZE } from './constants.js';

// Create 2 FreeQueue instances with 4096 buffer length and 1 channel.
const inputQueue = new FreeQueue(QUEUE_SIZE, 1);
const outputQueue = new FreeQueue(QUEUE_SIZE, 1);
// Create an atomic state for synchronization between worker and AudioWorklet.
const atomicState = new Int32Array(
    new SharedArrayBuffer(1 * Int32Array.BYTES_PER_ELEMENT)
);

const audioContext = new AudioContext();
await audioContext.audioWorklet.addModule('bypass-processor.js');
const oscillator = new OscillatorNode(audioContext);
const processorNode =
    new AudioWorkletNode(audioContext, 'bypass-processor', {
      processorOptions: {
        inputQueue,
        outputQueue,
        atomicState
      }
    });
oscillator.connect(processorNode).connect(audioContext.destination);
// Initially suspend audioContext so it can be toggled on and off later.
audioContext.suspend();
// Start the oscillator
oscillator.start();
console.log('AudioContext created.');
return audioContext;

// Create a WebWorker for Audio Processing.
const worker = new Worker('worker.js', { type: 'module'});

// Send FreeQueue instance and atomic state to worker.
worker.postMessage({
  type: 'init',
  data: {
    inputQueue,
    outputQueue,
    atomicState
  }
});
