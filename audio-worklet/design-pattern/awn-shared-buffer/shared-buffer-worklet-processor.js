// In this design, this AudioWorkletProcessor simply functions as a audio
// callback (or audio sink). The actual audio processing happens on the Worker
// side.

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

/**
 * @class SharedBufferWorkletProcessor
 * @extends AudioWorkletProcessor
 */
class SharedBufferWorkletProcessor extends AudioWorkletProcessor {
  /**
   * @constructor
   * @param {AudioWorkletNodeOptions} nodeOptions
   */
  constructor(nodeOptions) {
    super();

    this._initialized = false;
    this.port.onmessage = this._initializeOnEvent.bind(this);
  }

  /**
   * Without a proper coordination with the worker backend, this processor
   * cannot function. This initializes upon the event from the worker backend.
   *
   * @param {Event} eventFromWorker
   */
  _initializeOnEvent(eventFromWorker) {
    const sharedBuffers = eventFromWorker.data;

    // Get the states buffer.
    this._states = new Int32Array(sharedBuffers.states);

    // Worker's input/output buffers. This example only handles mono channel
    // for both.
    this._inputRingBuffer = [new Float32Array(sharedBuffers.inputRingBuffer)];
    this._outputRingBuffer = [new Float32Array(sharedBuffers.outputRingBuffer)];

    this._ringBufferLength =
        Atomics.load(this._states, STATE.RING_BUFFER_LENGTH);
    this._kernelLength =
        Atomics.load(this._states, STATE.KERNEL_LENGTH);

    this._initialized = true;
    this.port.postMessage({
      message: 'PROCESSOR_READY',
    });
  }

  /**
   * Push 128 samples to the shared input buffer.
   *
   * @param {Float32Array} inputChannelData The input data.
   */
  _pushInputChannelData(inputChannelData) {
    let inputWriteIndex = Atomics.load(this._states, STATE.IB_WRITE_INDEX);

    if (inputWriteIndex + inputChannelData.length < this._ringBufferLength) {
      // If the ring buffer has enough space to push the input.
      this._inputRingBuffer[0].set(inputChannelData, inputWriteIndex);
      Atomics.add(this._states, STATE.IB_WRITE_INDEX, inputChannelData.length);
    } else {
      // When the ring buffer does not have enough space so the index needs to
      // be wrapped around.
      let splitIndex = this._ringBufferLength - inputWriteIndex;
      let firstHalf = inputChannelData.subarray(0, splitIndex);
      let secondHalf = inputChannelData.subarray(splitIndex);
      this._inputRingBuffer[0].set(firstHalf, inputWriteIndex);
      this._inputRingBuffer[0].set(secondHalf);
      Atomics.store(this._states, STATE.IB_WRITE_INDEX, secondHalf.length);
    }

    // Update the number of available frames in the input ring buffer.
    Atomics.add(this._states, STATE.IB_FRAMES_AVAILABLE,
                inputChannelData.length);
  }

  /**
   * Pull the data out of the shared input buffer to fill |outputChannelData|
   * (128-frames).
   *
   * @param {Float32Array} outputChannelData The output array to be filled.
   */
  _pullOutputChannelData(outputChannelData) {
    const outputReadIndex = Atomics.load(this._states, STATE.OB_READ_INDEX);
    const nextReadIndex = outputReadIndex + outputChannelData.length;

    if (nextReadIndex < this._ringBufferLength) {
      outputChannelData.set(
          this._outputRingBuffer[0].subarray(outputReadIndex, nextReadIndex));
      Atomics.add(this._states, STATE.OB_READ_INDEX, outputChannelData.length);
    } else {
      let overflow = nextReadIndex - this._ringBufferLength;
      let firstHalf = this._outputRingBuffer[0].subarray(outputReadIndex);
      let secondHalf = this._outputRingBuffer[0].subarray(0, overflow);
      outputChannelData.set(firstHalf);
      outputChannelData.set(secondHalf, firstHalf.length);
      Atomics.store(this._states, STATE.OB_READ_INDEX, secondHalf.length);
    }
  }

  /**
   * AWP's process callback.
   *
   * @param {Array} inputs Input audio data.
   * @param {Array} outputs Output audio data.
   * @return {Boolean} Lifetime flag.
   */
  process(inputs, outputs) {
    if (!this._initialized) {
      return true;
    }

    // This example only handles mono channel.
    const inputChannelData = inputs[0][0];
    const outputChannelData = outputs[0][0];

    this._pushInputChannelData(inputChannelData);
    this._pullOutputChannelData(outputChannelData);

    if (Atomics.load(this._states, STATE.IB_FRAMES_AVAILABLE) >=
        this._kernelLength) {
      // Now we have enough frames to process. Wake up the worker.
      Atomics.wake(this._states, STATE.REQUEST_RENDER, 1);
    }

    return true;
  }
} // class SharedBufferWorkletProcessor


registerProcessor('shared-buffer-workler-processor',
                  SharedBufferWorkletProcessor);
