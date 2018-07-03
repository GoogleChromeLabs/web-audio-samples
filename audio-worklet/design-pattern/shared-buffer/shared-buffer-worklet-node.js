/**
 * Copyright (c) 2018 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */


/**
 * The AudioWorkletNode that has a DedicatedWorker as a backend. The
 * communication between Worker and AWP is done via SharedArrayBuffer,
 * which runs like a big ring buffer between two objects. This class is to
 * demonstrate a design of using Worker, SharedArrayBuffer and the AudioWorklet
 * system in one place.
 *
 * In order to use this class, you need 3 files:
 *  - shared-buffer-worklet-node.js (main scope)
 *  - shared-buffer-worklet-processor.js (via `audioWorklet.addModule()` call)
 *  - shared-buffer-worker.js (via `new Worker()` call)
 *
 * @class SharedBufferWorkletNode
 * @extends AudioWorkletNode
 */
class SharedBufferWorkletNode // eslint-disable-line no-unused-vars
    extends AudioWorkletNode {
  /**
   * @constructor
   * @param {BaseAudioContext} context The associated BaseAudioContext.
   * @param {AudioWorkletNodeOptions} options User-supplied options for
   * AudioWorkletNode.
   * @param {object} options.worker Options for worker processor.
   * @param {number} options.worker.ringBufferLength Ring buffer length of
   * worker processor.
   * @param {number} options.worker.channelCount Channel count of worker
   * processor.
   */
  constructor(context, options) {
    super(context, 'shared-buffer-worklet-processor', options);

    this._workerOptions = (options && options.worker)
      ? options.worker
      : {ringBufferLength: 3072, channelCount: 1};

    // Worker backend.
    this._worker = new Worker('shared-buffer-worker.js');

    // This node is a messaging hub for the Worker and AWP. After the initial
    // setup, the message passing between the worker and the process are rarely
    // necessary because of the SharedArrayBuffer.
    this._worker.onmessage = this._onWorkerInitialized.bind(this);
    this.port.onmessage = this._onProcessorInitialized.bind(this);

    // Initialize the worker.
    this._worker.postMessage({
      message: 'INITIALIZE_WORKER',
      options: {
        ringBufferLength: this._workerOptions.ringBufferLength,
        channelCount: this._workerOptions.channelCount,
      },
    });
  }

  /**
   * Handles the initial event from the associated worker.
   *
   * @param {Event} eventFromWorker
   */
  _onWorkerInitialized(eventFromWorker) {
    const data = eventFromWorker.data;
    if (data.message === 'WORKER_READY') {
      // Send SharedArrayBuffers to the processor.
      this.port.postMessage(data.SharedBuffers);
      return;
    }

    if (data.message === 'WORKER_ERROR') {
      console.log('[SharedBufferWorklet] Worker Error:',
                  data.detail);
      if (typeof this.onError === 'function') {
        this.onError(data);
      }
      return;
    }

    console.log('[SharedBufferWorklet] Unknown message: ',
                eventFromWorker);
  }

  /**
   * Handles the initial event form the associated processor.
   *
   * @param {Event} eventFromProcessor
   */
  _onProcessorInitialized(eventFromProcessor) {
    const data = eventFromProcessor.data;
    if (data.message === 'PROCESSOR_READY' &&
        typeof this.onInitialized === 'function') {
      this.onInitialized();
      return;
    }

    console.log('[SharedBufferWorklet] Unknown message: ',
                eventFromProcessor);
  }
} // class SharedBufferWorkletNode


export default SharedBufferWorkletNode;