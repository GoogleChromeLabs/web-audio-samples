/**
 * @class NoiseGenerator
 * @extends AudioWorkletProcessor
 */
class NoiseGenerator extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{name: 'amplitude', defaultValue: 0.25, minValue: 0, maxValue: 1}];
  }

  constructor(options) {
    super(options);
  }

  process(input, output, parameters) {
    let outputChannelData = output.getChannelData(0);
    let amplitude = parameters.amplitude;
    for (let i = 0; i < 128; ++i) {
      outputChannelData[i] = Math.random() * amplitude[i];
    }
  }
}

registerProcessor('noise-generator', NoiseGenerator);
