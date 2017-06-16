'use strict';

registerProcessor('noise-generator', class Noise extends AudioWorkletProcessor {
  static get parameterDescriptors () {
    return [{
      name: 'gain',
      defaultValue: 0.25,
      minValue: 0,
      maxValue: 1
    }];
  }

  constructor () {
    super();
  }

  process (input, output, parameters) {
    let outputChannelData = output.getChannelData(0);
    let gain = parameters.gain;
    for (let i = 0; i < 128; ++i) {
      outputChannelData[i] = Math.random() * gain[i];
    }
  }
});
