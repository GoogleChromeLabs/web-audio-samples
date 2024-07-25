const MAX_RENDER_QUANTUM = 128;

/**
 * @classdesc The AudioWorklet RecorderProcessor records raw PCM samples
 * from node input into a fixed-length recording buffer. Data is posted once
 * the buffer is filled. Will also pass through audio from input to output.
 */
class RecorderProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this._position = 0;
    this._numberOfSamples = options.processorOptions.numberOfSamples;
    this._numberOfChannels = options.processorOptions.numberOfChannels;
    this._channelData = new Array(this._numberOfChannels)
        .fill(new Float32Array(this._numberOfSamples));
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    const samplesToRecord = Math.min(MAX_RENDER_QUANTUM,
        this._numberOfSamples - this._position);

    for (let channel = 0; channel < input.length; ++channel) {
      output[channel].set(input[channel]); // pass-through
      this._channelData[channel]
          .set(input[channel].subarray(0, samplesToRecord), this._position);
    }

    this._position += samplesToRecord;
    if (this._position === this._numberOfSamples) {
      this.port.postMessage({
        message: 'RECORD_DONE',
        channelData: this._channelData,
      });
      return false;
    }

    return true;
  }
}

registerProcessor('test-recorder', RecorderProcessor);
