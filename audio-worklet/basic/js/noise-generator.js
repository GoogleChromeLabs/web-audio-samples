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

  process(inputs, outputs, parameters) {
    let outputChannel = outputs[0][0];
    let amplitude = parameters.amplitude;
    for (let i = 0; i < outputChannel.length; ++i)
      outputChannel[i] = Math.random() * amplitude[i];

    return true;
  }
}

registerProcessor('noise-generator', NoiseGenerator);
