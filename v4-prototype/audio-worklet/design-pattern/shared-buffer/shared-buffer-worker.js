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

// This Worker is the backend of AudioWorkletProcessor (AWP). It communicates
// with the associated AWP via SharedArrayBuffer (SAB).
//
// A pair of SABs is created by this Worker: one for shared states
// (Int32Array) and another for audio sample content (Float32Array).
//
// Synchronization is handled via Atomics.wait() and Atomics.notify(). When
// data is needed, AWP flips REQUEST_RENDER and notifies the worker.

const STATE = {
  REQUEST_RENDER: 0,
  IB_FRAMES_AVAILABLE: 1,
  IB_READ_INDEX: 2,
  IB_WRITE_INDEX: 3,
  OB_FRAMES_AVAILABLE: 4,
  OB_READ_INDEX: 5,
  OB_WRITE_INDEX: 6,
  RING_BUFFER_LENGTH: 7,
  KERNEL_LENGTH: 8,
};

const CONFIG = {
  bytesPerState: Int32Array.BYTES_PER_ELEMENT,
  bytesPerSample: Float32Array.BYTES_PER_ELEMENT,
  stateBufferLength: 16,
  ringBufferLength: 4096,
  kernelLength: 1024,
  channelCount: 1,
  waitTimeout: 25000,
};

let States;
let InputRingBuffer;
let OutputRingBuffer;

/**
 * Process audio data in ring buffer with user-supplied kernel.
 */
function processKernel() {
  let inputReadIndex = States[STATE.IB_READ_INDEX];
  let outputWriteIndex = States[STATE.OB_WRITE_INDEX];

  if (isNaN(InputRingBuffer[0][inputReadIndex])) {
    console.error('Found NaN at buffer index: %d', inputReadIndex);
  }

  // Processing kernel that clones audio data sample-by-sample.
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
 * Waits for signal via States SAB. When signaled, processes audio data.
 */
function waitOnRenderRequest() {
  while (Atomics.wait(States, STATE.REQUEST_RENDER, 0) === 'ok') {
    processKernel();
    States[STATE.IB_FRAMES_AVAILABLE] -= CONFIG.kernelLength;
    States[STATE.OB_FRAMES_AVAILABLE] += CONFIG.kernelLength;
    Atomics.store(States, STATE.REQUEST_RENDER, 0);
  }
}

/**
 * Allocates SAB, sets up TypedArrayViews, primes States buffer and notifies
 * the main thread.
 * @param {object} options
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
      detail:
        'SharedArrayBuffer is not supported in this browser context. ' +
        'Check COOP/COEP isolation headers.',
    });
    return;
  }

  const SharedBuffers = {
    states: new SharedArrayBuffer(
      CONFIG.stateBufferLength * CONFIG.bytesPerState
    ),
    inputRingBuffer: new SharedArrayBuffer(
      CONFIG.ringBufferLength * CONFIG.channelCount * CONFIG.bytesPerSample
    ),
    outputRingBuffer: new SharedArrayBuffer(
      CONFIG.ringBufferLength * CONFIG.channelCount * CONFIG.bytesPerSample
    ),
  };

  States = new Int32Array(SharedBuffers.states);
  InputRingBuffer = [new Float32Array(SharedBuffers.inputRingBuffer)];
  OutputRingBuffer = [new Float32Array(SharedBuffers.outputRingBuffer)];

  Atomics.store(States, STATE.RING_BUFFER_LENGTH, CONFIG.ringBufferLength);
  Atomics.store(States, STATE.KERNEL_LENGTH, CONFIG.kernelLength);

  postMessage({
    message: 'WORKER_READY',
    SharedBuffers,
  });

  waitOnRenderRequest();
}

onmessage = (eventFromMain) => {
  if (eventFromMain.data.message === 'INITIALIZE_WORKER') {
    initialize(eventFromMain.data.options);
    return;
  }

  console.warn('[SharedBufferWorker] Unknown message: ', eventFromMain);
};
