// This Worker is the actual backend of AudioWorkletProcessor (AWP). After
// instantiated/initialized by AudioWorkletNode (AWN), it communicates with the
// associated AWP via SharedArrayBuffer (SAB).
//
// A pair of SABs is created by this Worker. The one is for the shared states
// (Int32Array) of ring buffer between two obejcts and the other works like the
// ring buffer for audio content (Float32Array).
//
// The synchronization mechanism between two object is done by wake/wait
// function in Atomics API. When the ring buffer runs out of the data to
// consume, the AWP will flip |REQUEST_RENDER| state to signal the worker. The
// work wakes on the signal and renders the audio data requested.

// Description of shared states.
const STATE = {
  'REQUEST_RENDER': 0,
  'IB_FRAMES_AVAILABLE': 1,
  'IB_READ_INDEX': 2,
  'IB_WRITE_INDEX': 3,
  'OB_FRAMES_AVAILABLE': 4,
  'OB_READ_INDEX': 5,
  'OB_WRITE_INDEX': 6,
  'RING_BUFFER_LENGTH': 7,
  'KERNEL_LENGTH': 8,
};

// Worker processor config.
const CONFIG = {
  bytesPerState: Int32Array.BYTES_PER_ELEMENT,
  bytesPerSample: Float32Array.BYTES_PER_ELEMENT,
  stateBufferLength: 16,
  ringBufferLength: 4096,
  kernelLength: 1024,
  channelCount: 1,
  waitTimeOut: 25000,
};

// Shared states between this worker and AWP.
let States;

// Shared RingBuffers between this worker and AWP.
let InputRingBuffer;
let OutputRingBuffer;


/**
 * Process audio data in the ring buffer with the user-supplied kernel.
 */
function processKernel() {
  let inputReadIndex = Atomics.load(States, STATE.IB_READ_INDEX);
  let outputWriteIndex = Atomics.load(States, STATE.OB_WRITE_INDEX);

  // A stupid processing kernel that clones audio data sample-by-sample. Also
  // note here we are handling only the first channel.
  for (let i = 0; i < CONFIG.kernelLength; ++i) {
    OutputRingBuffer[0][outputWriteIndex] = InputRingBuffer[0][inputReadIndex];
    if (outputWriteIndex++ === CONFIG.ringBufferLength) {
      outputWriteIndex = 0;
    }
    if (inputReadIndex++ === CONFIG.ringBufferLength) {
      inputReadIndex = 0;
    }
  }

  Atomics.store(States, STATE.IB_READ_INDEX, inputReadIndex);
  Atomics.store(States, STATE.OB_WRITE_INDEX, outputWriteIndex);
}


/**
 * Waits for the signal delivered via |States| SAB. When signaled, process
 * the audio data to fill up |outputRingBuffer|.
 */
function waitOnRenderRequest() {
  // As long as |REQUEST_RENDER| is zero, keep waiting. (sleep)
  if (Atomics.wait(States, STATE.REQUEST_RENDER, 0) === 'ok') {
    processKernel();

    // Update the number of available frames in the buffer.
    Atomics.sub(States, STATE.IB_FRAMES_AVAILABLE, CONFIG.kernelLength);
    Atomics.add(States, STATE.OB_FRAMES_AVAILABLE, CONFIG.kernelLength);

    // Reset the request render bit, and wait again.
    Atomics.store(States, STATE.REQUEST_RENDER, 0);
    waitOnRenderRequest();
  }
}

/**
 * Initialize the worker; allocates SAB, sets up TypedArrayViews, primes
 * |States| buffer and notify the main thread.
 *
 * @param {Object} userConfig User-supplied configuration data.
 */
function initialize(userConfig) {
  // Shallow-clones |userConfig| to |CONFIG|.
  for (let property in userConfig) {
    if (property in CONFIG) {
      CONFIG[property] = userConfig[property];
    }
  }

  // Allocate SABs.
  const SharedBuffers = {
    states:
        new SharedArrayBuffer(CONFIG.stateBufferLength * CONFIG.bytesPerState),
    inputRingBuffer:
        new SharedArrayBuffer(CONFIG.ringBufferLength *
                              CONFIG.channelCount * CONFIG.bytesPerSample),
    outputRingBuffer:
        new SharedArrayBuffer(CONFIG.ringBufferLength *
                              CONFIG.channelCount * CONFIG.bytesPerSample),
  };

  // Get TypedArrayView from SAB.
  States = new Int32Array(SharedBuffers.states);
  InputRingBuffer = [new Float32Array(SharedBuffers.inputRingBuffer)];
  OutputRingBuffer = [new Float32Array(SharedBuffers.outputRingBuffer)];

  // Initialize |States| buffer.
  Atomics.store(States, STATE.RING_BUFFER_LENGTH, CONFIG.ringBufferLength);
  Atomics.store(States, STATE.KERNEL_LENGTH, CONFIG.kernelLength);

  // Notify AWN in the main scope that the worker is ready.
  postMessage({
    message: 'WORKER_READY',
    SharedBuffers: SharedBuffers,
  });

  // Start waiting.
  waitOnRenderRequest();
}

onmessage = (eventFromMain) => {
  switch (eventFromMain.data.message) {
    case 'INITIALIZE_WORKER':
      initialize(eventFromMain.data);
      break;
  }
};
