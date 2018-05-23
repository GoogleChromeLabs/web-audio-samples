/**
 * SharedBufferWorker : WorkerGlobalScope
 *
 * This Worker is initailized by the main thread AWN object.
 */

/**
 * This Worker is the constructor/owner of 2 SharedArrayBuffers. For the ring
 * buffer on top of the SAB, we need one SAB for sharing the state of the buffer
 * (Int32Array) and the other for the actual audio data (Float32Array).
 *
 * Because the sink (destination) will draw 128 frames from the buffer for
 * every render quantum, it will be the driver of the buffer. When the avilable
 * frame count reaches to 128, the sink will flip the |Request render| bit to
 * signal the renderer (which is this worker). The renderer waits on this bit
 * and perform the rendering on signal.
 *
 * The access on the state buffer must be atomic.
 */

const STATE = {
  'REQUEST_RENDER': 0,
  'IB_FRAMES_AVAILABLE': 1,
  'IB_READ_INDEX': 2,
  'IB_WRITE_INDEX': 3,
  'OB_FRAMES_AVAILABLE': 4,
  'OB_READ_INDEX': 5,
  'OB_WRITE_INDEX': 6,
  'BUFFER_LENGTH': 7,
  'WORKER_RENDER_QUANTUM': 8
};


// TODO: make these configurable.
const STATE_COUNT = 16;
const BYTES_PER_STATE = 4;
const WAIT_TIMEOUT = 25000;

const RENDER_QUANTUM = 1024; // should be customizable
const BUFFER_LENGTH = RENDER_QUANTUM * 3; // should be customizable
const CHANNEL_COUNT = 1;
const BYTES_PER_SAMPLES = 4;

// AWN's port object, passed from the main thread.
let nodePort;

// Backing shared buffer.
let sharedBuffer = {};

// Local buffer reference.
let states;
let inputChannelData;
let outputChannelData;


// Render function.
function process(inputReadIndex, outputWriteIndex) {
  // For the demonstration purpose, do sample-by-sample cloning.
  for (let i = 0; i < RENDER_QUANTUM; ++i) {
    outputChannelData[0][(outputWriteIndex + i) % BUFFER_LENGTH] =
        inputChannelData[0][(inputReadIndex + i) % BUFFER_LENGTH];
  }
}


function waitOnRenderRequest() {
  // As long as |REQUEST_RENDER| is zero, keep waiting. (sleep)
  if (Atomics.wait(states, STATE.REQUEST_RENDER, 0) === 'ok') {
    // Any operation below does not guarantee the exclusive access on the
    // SharedArrayBuffer unless it uses 'Atomics' function. Be careful.

    /** DO THE PROCESSING HERE */
    let inputReadIndex = Atomics.load(states, STATE.IB_READ_INDEX);
    let outputWriteIndex = Atomics.load(states, STATE.OB_WRITE_INDEX);

    process(inputReadIndex, outputWriteIndex);

    inputReadIndex += RENDER_QUANTUM;
    if (inputReadIndex > BUFFER_LENGTH)
      inputReadIndex %= BUFFER_LENGTH;
    Atomics.store(states, STATE.IB_READ_INDEX, inputReadIndex);

    outputWriteIndex += RENDER_QUANTUM;
    if (outputWriteIndex > BUFFER_LENGTH)
      outputWriteIndex %= BUFFER_LENGTH;
    Atomics.store(states, STATE.OB_WRITE_INDEX, outputWriteIndex);

    // Just consumed a RENDER_QUANTUM.
    Atomics.sub(states, STATE.IB_FRAMES_AVAILABLE, RENDER_QUANTUM);

    // Reset the request render bit, and wait again.
    Atomics.store(states, STATE.REQUEST_RENDER, 0);
    waitOnRenderRequest();
  }
}


function initializeWorker(dataFromMain) {
  sharedBuffer.states = new SharedArrayBuffer(STATE_COUNT * BYTES_PER_STATE);
  sharedBuffer.inputChannelData =
      new SharedArrayBuffer(BUFFER_LENGTH * CHANNEL_COUNT * BYTES_PER_SAMPLES);
  sharedBuffer.outputChannelData =
      new SharedArrayBuffer(BUFFER_LENGTH * CHANNEL_COUNT * BYTES_PER_SAMPLES);

  states = new Int32Array(sharedBuffer.states);
  inputChannelData = [new Float32Array(sharedBuffer.inputChannelData)];
  outputChannelData = [new Float32Array(sharedBuffer.outputChannelData)];

  Atomics.store(states, STATE.BUFFER_LENGTH, BUFFER_LENGTH);
  Atomics.store(states, STATE.WORKER_RENDER_QUANTUM, RENDER_QUANTUM);

  postMessage({
    message: 'WORKER_READY',
    sharedBuffer: sharedBuffer
  });

  waitOnRenderRequest();
}


// After the initial setup, no message passing will be necessary.
onmessage = (eventFromMain) => {
  switch (eventFromMain.data.message) {
    case 'INITIALIZE_WORKER':
      initializeWorker(eventFromMain.data);
      break;
  }
};
