/**
 * The AudioWorkletNode that has a DedicatedWorker as a backend. The
 * communication between the worker and the AWP is done via SharedArrayBuffer,
 * which runs like a big ring buffer. This clas is to demonstrate a design
 * of using Worker, SharedArrayBuffer and the AudioWorklet system in one place.
 *
 * In order to use this class, you need 3 files:
 *  - shared-buffer-worklet-node.js (main scope)
 *  - shared-buffer-worklet-processor.js (via `audioWorklet.addModule()` call)
 *  - shared-buffer-worker.js (via `new Worker()` call)
 *
 * @class SharedBufferWorkletNode
 * @extends AudioWorkletNode
 *
 */
class SharedBufferWorkletNode extends AudioWorkletNode {

  constructor(context, options) {
    super(context, 'shared-buffer-workler-processor', options);

    this._options = options
        ? options
        : { bufferLength: 1024, channelCount: 1 };

    // This node has all the connections to the worker and the AWP, so this is
    // a messaging hub for them. After the initial setup, the message passing
    // between the worker and the process are rarely necessary because of the
    // SharedArrayBuffer.
    this._worker = new Worker('shared-buffer-worker.js');
    this._worker.onmessage = this._onWorkerInitialized.bind(this);
    this.port.onmessage = this._onProcessorInitialized.bind(this);

    this._initialize();
  }

  _onWorkerInitialized(eventFromWorker) {
    const data = eventFromWorker.data;
    if (data.message === 'WORKER_READY') {
      console.log(data.message);
      this.port.postMessage(data.sharedBuffer);
    }
  }

  _onProcessorInitialized(eventFromProcessor) {
    const data = eventFromProcessor.data;
    if (data.message === 'PROCESSOR_READY' &&
        typeof this.onInitialized === 'function') {
      console.log(data.message);
      this.onInitialized();
    }
  }

  _initialize() {
    this._worker.postMessage({
      message: 'INITIALIZE_WORKER'
    });
  }

}  // class SharedBufferWorkletNode
