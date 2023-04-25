import FreeQueue from './lib/free-queue.js'
import { createTestIR, fetchAudioFileToF32Array } from './ir-helper.js';
import { QUEUE_SIZE } from './constants.js';
import Assets from './assets.js';

// Create 2 FreeQueue instances with 4096 buffer length and 1 channel.
const inputQueue = new FreeQueue(QUEUE_SIZE, 1);
const outputQueue = new FreeQueue(QUEUE_SIZE, 1);

// Create an atomic state for synchronization between Worker and AudioWorklet.
const atomicState = 
    new Int32Array(new SharedArrayBuffer(1 * Int32Array.BYTES_PER_ELEMENT));

let audioContext = null;
let worker = null;
let isWorkerInitialized = false;

let toggleButton = null;
let isPlaying = false;
let messageView = null;
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

  console.assert(audioContext);

  let filePath = null;
  let irArray = null;
  if (impulseResponseSelect) {
    // When the file path is `TEST` generates a test IR (10 samples). See
    // `assets.js` for details.
    filePath = impulseResponseSelect.value;
    irArray = (filePath === 'TEST')
        ? createTestIR()
        : await fetchAudioFileToF32Array(audioContext, filePath);

    impulseResponseSelect.disabled = true;
  }

  // Send FreeQueue instance and atomic state to worker.
  worker.postMessage({
    type: 'init',
    data: {
      inputQueue,
      outputQueue,
      atomicState,
      irArray,
      sampleRate: audioContext.sampleRate,
    }
  });

  console.log('[main.js] initializeWorkerIfNecessary(): ' + filePath);

  isWorkerInitialized = true;
};


// Handles `button` click. It toggles the state between playing and suspended.
const toggleButtonClickHandler = async () => {
  if (!isPlaying) {
    initializeWorkerIfNecessary();
    audioContext.resume();
    isPlaying = true;
    toggleButton.textContent = 'STOP';
  } else {
    audioContext.suspend();
    isPlaying = false;
    toggleButton.textContent = 'START';
  }
};

// Detect required features.
const detectFeaturesAndReport = (viewElement) => {
  let areRequiremensMet = true;

  if (typeof navigator.gpu !== 'object') {
    viewElement.textContent +=
        'ERROR: WebGPU is not available on your browser.\r\n';
    areRequiremensMet = false;
  }

  if (typeof SharedArrayBuffer !== 'function') {
    viewElement.textContent +=
        'ERROR: SharedArrayBuffer is not available on your browser.\r\n';
    areRequiremensMet = false;
  }

  if (areRequiremensMet) {
    viewElement.textContent +=
        'All requirements have been met. The experiment is ready to run.\r\n';
  }

  return areRequiremensMet;
};

window.addEventListener('load', async () => {

  messageView = document.getElementById('message-view');
  if (!detectFeaturesAndReport(messageView)) {
    return;
  }

  audioContext = await initializeAudio();

  // Create a WebWorker for Audio Processing.
  worker = new Worker('worker.js', {type: 'module'});
  worker.onerror = (event) => {
    console.log('[main.js] Error from worker.js: ', event);
  };

  // Handle `select` menu for IRs.
  // TODO: Currently the dropdown menu is disabled. Revisit this when the
  // IR selection is implemented.
  impulseResponseSelect = document.getElementById('select-impulse-response');
  if (impulseResponseSelect) {
    Assets.forEach((asset) => {
      const optionEl = document.createElement('option');
      optionEl.value = asset.path;
      optionEl.textContent = asset.label;
      impulseResponseSelect.appendChild(optionEl);
    });
    impulseResponseSelect.disabled = false;
  }

  // Handle `button` with toggle logic.
  toggleButton = document.getElementById('toggle-audio');
  toggleButton.onclick = toggleButtonClickHandler;
  toggleButton.disabled = false;

  console.log('[main.js] window onloaded');
});
