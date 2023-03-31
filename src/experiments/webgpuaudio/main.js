import FreeQueue from './lib/free-queue.js'
import { createTestIR, fetchAudioFileToF32Array } from './ir-helper.js';
import { QUEUE_SIZE } from './constants.js';

// Create 2 FreeQueue instances with 4096 buffer length and 1 channel.
const inputQueue = new FreeQueue(QUEUE_SIZE, 1);
const outputQueue = new FreeQueue(QUEUE_SIZE, 1);

// Create an atomic state for synchronization between Worker and AudioWorklet.
const atomicState = new Int32Array(
    new SharedArrayBuffer(1 * Int32Array.BYTES_PER_ELEMENT)
);

let toggleButton = null;
let audioContext = null;
let isPlaying = false;

/**
 * Function to create and initialize AudioContext.
 * @returns {Promise<AudioContext>}
 */
const initializeAudio = async () => {
  const audioContext = new AudioContext();
  await audioContext.audioWorklet.addModule('./basic-processor.js');

  const oscillatorNode = new OscillatorNode(audioContext);
  const processorNode = new AudioWorkletNode(audioContext, 'basic-processor', {
    processorOptions: {inputQueue, outputQueue, atomicState}
  });
  
  // Initially suspend the context to prevent the renderer from hammering the
  // Worker.
  audioContext.suspend();

  // Form an audio graph and start the source. When the renderer is resumed,
  // the pipeline will be flowing.
  oscillatorNode.connect(processorNode).connect(audioContext.destination);
  oscillatorNode.start();

  console.log('[main.js] initializeAudio()');
  return audioContext;
};

/**
 * Function to run, when toggle button is clicked.
 * It creates AudioContext, first time button is clicked.
 * It toggles audio state between playing and paused.
 */
const toggleButtonClickHandler = async () => {
  if (!isPlaying) {
    audioContext.resume();
    isPlaying = true;
    toggleButton.innerHTML = 'STOP';
  } else {
    audioContext.suspend();
    isPlaying = false;
    toggleButton.innerHTML = 'START';
  }
};

window.addEventListener('load', async () => {
  audioContext = await initializeAudio();

  // Create a WebWorker for Audio Processing.
  const worker = new Worker('worker.js', {type: 'module'});
  worker.onerror = (event) => {
    console.log('[main.js] Error from worker.js: ', event);
  };

  // For an actual audio file:
  // const irArray = await fetchAudioFileToF32Array(
  //   audioContext,
  //   '../../sounds/impulse-responses/cardiod-35-10-spread.wav');

  // Or use the test IR (10 samples).
  const irArray = createTestIR();

  // Send FreeQueue instance and atomic state to worker.
  worker.postMessage({
    type: 'init',
    data: {
      inputQueue,
      outputQueue,
      atomicState,
      irArray
    }
  });

  toggleButton = document.getElementById('toggle-audio');
  toggleButton.onclick = toggleButtonClickHandler;
  toggleButton.disabled = false;

  console.log('[main.js] window onloaded');
});
