import { FreeQueueSAB } from '../../../../lib/free-queue/free-queue-sab.js'
import { QUEUE_SIZE } from './constants.js';

const toggleButton = document.getElementById('toggle');
toggleButton.disabled = false;

// Create 2 FreeQueue instances with 4096 buffer length and 1 channel.
const inputQueue = new FreeQueueSAB(QUEUE_SIZE, 1);
const outputQueue = new FreeQueueSAB(QUEUE_SIZE, 1);
// Create an atomic state for synchronization between worker and AudioWorklet.
const atomicState = new Int32Array(
    new SharedArrayBuffer(1 * Int32Array.BYTES_PER_ELEMENT)
);

let audioContext = null;
let isPlaying = false;

/**
 * Function to create and initialize AudioContext.
 * @returns {Promise<AudioContext>}
 */
const createAudioContext = async () => {
  const audioContext = new AudioContext();
  await audioContext.audioWorklet.addModule('basic-processor.js');
  const oscillator = new OscillatorNode(audioContext);
  const processorNode =
      new AudioWorkletNode(audioContext, 'basic-processor', {
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
};

/**
 * Function to run, when toggle button is clicked.
 * It creates AudioContext, first time button is clicked.
 * It toggles audio state between playing and paused.
 */
const toggleButtonClickHandler = async () => {
  // If AudioContext doesn't exist, try creating one. 
  if (!audioContext) {
    try {
      audioContext = await createAudioContext();
    } catch(error) {
      // If AudioContext creation fails, disable toggle button and
      // log error to console
      toggleButton.disabled = true;
      console.error(error);
      return;
    }
  }
  // If the audio is currently not playing, then on button click resume 
  // playing audio, otherwise if the audio is playing then on button click
  // suspend playing.
  if (!isPlaying) {
    audioContext.resume();
    isPlaying = true;
    toggleButton.style.backgroundColor = 'red';
    toggleButton.innerHTML = 'STOP';
  } else {
    audioContext.suspend();
    isPlaying = false;
    toggleButton.style.backgroundColor = 'green';
    toggleButton.innerHTML = 'START';
  }
};

toggleButton.onclick = toggleButtonClickHandler;

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
