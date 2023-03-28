import FreeQueue from './lib/free-queue.js'
import { QUEUE_SIZE } from './constants.js';

// Create 2 FreeQueue instances with 4096 buffer length and 1 channel.
const inputQueue = new FreeQueue(QUEUE_SIZE, 1);
const outputQueue = new FreeQueue(QUEUE_SIZE, 1);

// Create an atomic state for synchronization between worker and AudioWorklet.
const atomicState =
    new Int32Array(new SharedArrayBuffer(1 * Int32Array.BYTES_PER_ELEMENT));

let audioContext = null;
let audioWorker = null;

let isPlaying = false;
let startButton = null;
let stopButton = null;

const startAudioPipeline = async () => {
  audioContext = new AudioContext();
  await audioContext.audioWorklet.addModule('./bypass-processor.js');
  audioContext.suspend();

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
  oscillator.start();

  audioWorker = new Worker('worker.js', {type: 'module'});
  audioWorker.postMessage({
    type: 'init',
    data: {
      inputQueue,
      outputQueue,
      atomicState
    }
  });
};

const onWindowLoaded = async () => {
  await startAudioPipeline();

  startButton = document.querySelector('#start-audio');
  stopButton = document.querySelector('#stop-audio');
  startButton.disabled = false;

  startButton.onclick = async () => {
    startButton.disabled = true;
    await audioContext.resume();
    stopButton.disabled = false;
    isPlaying = true;
  };

  stopButton.onclick = async () => {    
    stopButton.disabled = true;
    await audioContext.suspend();
    startButton.disabled = false;
    isPlaying = false;
  };

  console.log(`[trace] onWindowLoaded`);
};

window.addEventListener('load', onWindowLoaded);
console.log('[trace] main.js parsed');
