import FreeQueue from './lib/free-queue.js'
import { createTestIR, fetchAudioFileToF32Array } from './ir-helper.js';
import { QUEUE_SIZE } from './constants.js';
import Assets from './assets.js';

// Create 2 FreeQueue instances with 4096 buffer length and 1 channel.
const inputQueue = new FreeQueue(QUEUE_SIZE, 1);
const outputQueue = new FreeQueue(QUEUE_SIZE, 1);

// Create an atomic state for synchronization between Worker and AudioWorklet.
const atomicState = new Int32Array(
    new SharedArrayBuffer(1 * Int32Array.BYTES_PER_ELEMENT)
);

let audioContext = null;
let worker = null;
let isWorkerInitialized = false;

let toggleButton = null;
let isPlaying = false;
let impulseResponseSelect = null;

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

const initializeWorkerIfNecessary = async () => {
  if (isWorkerInitialized) {
    return;
  }

  const filePath = impulseResponseSelect.value;
  const irArray = (filePath === 'TEST') 
      ? createTestIR()
      : await fetchAudioFileToF32Array(audioContext, filePath);

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

  // console.assert(irArray instanceof Float32Array);
  console.log('[main.js] initializeWorkerIfNecessary(): ' + filePath);

  impulseResponseSelect.disabled = true;
  isWorkerInitialized = true;
};

/**
 * Function to run, when toggle button is clicked.
 * It creates AudioContext, first time button is clicked.
 * It toggles audio state between playing and paused.
 */
const toggleButtonClickHandler = async () => {
  if (!isPlaying) {
    initializeWorkerIfNecessary();
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
  worker = new Worker('worker.js', {type: 'module'});
  worker.onerror = (event) => {
    console.log('[main.js] Error from worker.js: ', event);
  };

  // Handle `select` menu for IRs.
  impulseResponseSelect = document.getElementById('select-impulse-response');
  Assets.forEach((asset) => {
    const optionEl = document.createElement('option');
    optionEl.value = asset.path;
    optionEl.textContent = asset.label;
    impulseResponseSelect.appendChild(optionEl);
  });
  impulseResponseSelect.disabled = false;

  toggleButton = document.getElementById('toggle-audio');
  toggleButton.onclick = toggleButtonClickHandler;
  toggleButton.disabled = false;

  console.log('[main.js] window onloaded');
});
