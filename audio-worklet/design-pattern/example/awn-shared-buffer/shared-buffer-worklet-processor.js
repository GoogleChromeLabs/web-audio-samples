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

/**
 * @class SharedBufferWorkletProcessor
 * @extends AudioWorkletProcessor
 */
class SharedBufferWorkletProcessor extends AudioWorkletProcessor {

  constructor(nodeOptions) {
    super(nodeOptions);

    this._initialized = false;
    this.port.onmessage = this._initialize.bind(this);
  }

  _initialize(eventFromWorker) {
    const sharedBuffer = eventFromWorker.data;
    this._states = new Int32Array(sharedBuffer.states);
    this._inputChannelData =
        [new Float32Array(sharedBuffer.inputChannelData)];
    this._outputChannelData =
        [new Float32Array(sharedBuffer.outputChannelData)];
    this._initialized = true;

    this.port.postMessage({
      message: 'PROCESSOR_READY'
    });
  }

  process(inputs, outputs) {
    if (!this._initialized)
      return true;

    let inputChannelData = inputs[0][0];
    let outputChannelData = outputs[0][0];

    let bufferLength = Atomics.load(this._states, STATE.BUFFER_LENGTH);
    let workerRenderQuantum =
        Atomics.load(this._states, STATE.WORKER_RENDER_QUANTUM);

    // Push |inputChannelData| (128-frames) to the shared input buffer.
    let inputWriteIndex = Atomics.load(this._states, STATE.IB_WRITE_INDEX);
    if (inputWriteIndex + inputChannelData.length < bufferLength) {
      this._inputChannelData[0].set(inputChannelData, inputWriteIndex);
      Atomics.add(this._states, STATE.IB_WRITE_INDEX, inputChannelData.length);
    } else {
      let splitIndex = bufferLength - inputWriteIndex;
      let firstHalf = inputChannelData.subarray(0, splitIndex);
      let secondHalf = inputChannelData.subarray(splitIndex);
      this._inputChannelData[0].set(firstHalf, inputWriteIndex);
      this._inputChannelData[0].set(secondHalf);
      Atomics.store(this._states, STATE.IB_WRITE_INDEX, secondHalf.length);
    }
    Atomics.add(this._states, STATE.IB_FRAMES_AVAILABLE,
                inputChannelData.length);

    // Pull the data out of the shared input buffer to fill |outputChannelData|
    // (128-frames).
    let outputReadIndex = Atomics.load(this._states, STATE.OB_READ_INDEX);
    let nextReadIndex = outputReadIndex + outputChannelData.length;
    if (nextReadIndex < bufferLength) {
      outputChannelData.set(
          this._outputChannelData[0].subarray(outputReadIndex, nextReadIndex));
      Atomics.add(this._states, STATE.OB_READ_INDEX, outputChannelData.length);
    } else {
      let overflow = nextReadIndex - bufferLength;
      let firstHalf = this._outputChannelData[0].subarray(outputReadIndex);
      let secondHalf = this._outputChannelData[0].subarray(0, overflow);
      outputChannelData.set(firstHalf);
      outputChannelData.set(secondHalf, firstHalf.length);
      Atomics.store(this._states, STATE.OB_READ_INDEX, secondHalf.length);
    }

    // Now we have enough frames to process. Do it now.
    if (Atomics.load(this._states, STATE.IB_FRAMES_AVAILABLE) ===
        workerRenderQuantum) {
      Atomics.wake(this._states, STATE.REQUEST_RENDER, 1);
    }

    return true;
  }

} // class SharedBufferWorkletProcessor


registerProcessor('shared-buffer-workler-processor',
                  SharedBufferWorkletProcessor);
