const MAX_RENDER_QUANTUM = 128;

/**
 * @classdesc The AudioWorklet RecorderProcessor records raw PCM samples 
 * from node input into a fixed-length recording buffer. Data is posted once 
 * the buffer is filled. Will also pass-through audio from input to output.
 */
class RecorderProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this._position = 0;
    this._maxSamples = options.processorOptions.maxSamples;
    this._recordingBuffer = new Array(this.numberOfChannels)
        .fill(new Float32Array(this._maxSamples));
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    const samplesToRecord = Math.min(MAX_RENDER_QUANTUM, this._maxSamples - this._position);

    for (let channel = 0; channel < input.length; ++channel) {
      output[channel].set(input[channel]); // pass-through
      this._recordingBuffer[channel].set(input[channel].subarray(0, samplesToRecord), 
          this._position)
    }

    this._position += samplesToRecord;
    if (this._position == this._maxSamples) {
      this.port.postMessage({
        message: 'RECORD_DONE',
        buffer: this._recordingBuffer
      })
      return false;
    }

    return true;
  }
}

registerProcessor('recorder', RecorderProcessor);
