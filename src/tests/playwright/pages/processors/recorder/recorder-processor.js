const MAX_RENDER_QUANTUM = 128;

// bypass-processor.js
class RecorderProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this._pos = 0;
    this._maxSamps = options.processorOptions.maxSamps;
    this._recordingBuffer = new Array(this.numberOfChannels)
      .fill(new Float32Array(this._maxSamps));
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    // how many samps to record
    const advance = Math.min(MAX_RENDER_QUANTUM, this._maxSamps - this._pos);

    for (let channel = 0; channel < input.length; channel++) {
      // pass-through
      output[channel].set(input[channel]);
      // record `advance` samps
      this._recordingBuffer[channel].set(input[channel].subarray(0, advance), this._pos)
    }

    this._pos += advance;
    if (this._pos >= this._maxSamps) {
      this.port.postMessage({
        message: 'RECORD_DONE',
        buffer: this._recordingBuffer
      })
    }
    

    return true;
  }
}

registerProcessor('recorder', RecorderProcessor);
