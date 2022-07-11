/**
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

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

// Indices for the State SAB.
const STATE = {
  // Flag for Atomics.wait() and notify().
  'REQUEST_RENDER': 0,

  // Available frames in Input SAB.
  'IB_FRAMES_AVAILABLE': 1,

  // Read index of Input SAB.
  'IB_READ_INDEX': 2,

  // Write index of Input SAB.
  'IB_WRITE_INDEX': 3,

  // Available frames in Output SAB.
  'OB_FRAMES_AVAILABLE': 4,

  // Read index of Output SAB.
  'OB_READ_INDEX': 5,

  // Write index of Output SAB.
  'OB_WRITE_INDEX': 6,

  // Size of Input and Output SAB.
  'RING_BUFFER_LENGTH': 7,

  // Size of user-supplied processing callback.
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
 *
 * NOTE: This assumes that no one will modify the buffer content while it is
 * processed by this method.
 */
function processKernel() {
  let inputReadIndex = States[STATE.IB_READ_INDEX];
  let outputWriteIndex = States[STATE.OB_WRITE_INDEX];

  if (isNaN(InputRingBuffer[0][inputReadIndex])) {
    console.error('Found NaN at buffer index: %d', inputReadIndex);
  }

  // A stupid processing kernel that clones audio data sample-by-sample. Also
  // note here we are handling only the first channel.
  for (let i = 0; i < CONFIG.kernelLength; ++i) {
    OutputRingBuffer[0][outputWriteIndex] = InputRingBuffer[0][inputReadIndex];
    if (++outputWriteIndex === CONFIG.ringBufferLength) {
      outputWriteIndex = 0;
    }
    if (++inputReadIndex === CONFIG.ringBufferLength) {
      inputReadIndex = 0;
    }
  }

  States[STATE.IB_READ_INDEX] = inputReadIndex;
  States[STATE.OB_WRITE_INDEX] = outputWriteIndex;
}


/**
 * Waits for the signal delivered via |States| SAB. When signaled, process
 * the audio data to fill up |outputRingBuffer|.
 */
function waitOnRenderRequest() {
  // As long as |REQUEST_RENDER| is zero, keep waiting. (sleep)
  while (Atomics.wait(States, STATE.REQUEST_RENDER, 0) === 'ok') {
    processKernel();

    // Update the number of available frames in the buffer.
    States[STATE.IB_FRAMES_AVAILABLE] -= CONFIG.kernelLength;
    States[STATE.OB_FRAMES_AVAILABLE] += CONFIG.kernelLength;

    // Reset the request render bit, and wait again.
    Atomics.store(States, STATE.REQUEST_RENDER, 0);
  }
}

/**
 * Initialize the worker; allocates SAB, sets up TypedArrayViews, primes
 * |States| buffer and notify the main thread.
 *
 * @param {object} options User-supplied options.
 */
function initialize(options) {
  if (options.ringBufferLength) {
    CONFIG.ringBufferLength = options.ringBufferLength;
  }
  if (options.channelCount) {
    CONFIG.channelCount = options.channelCount;
  }

  if (!self.SharedArrayBuffer) {
    postMessage({
      message: 'WORKER_ERROR',
      detail: `SharedArrayBuffer is not supported in your browser. See
          https://developers.google.com/web/updates/2018/06/audio-worklet-design-pattern
          for more info.`,
    });
    return;
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
  if (eventFromMain.data.message === 'INITIALIZE_WORKER') {
    initialize(eventFromMain.data.options);
    return;
  }

  console.log('[SharedBufferWorker] Unknown message: ', eventFromMain);
};
