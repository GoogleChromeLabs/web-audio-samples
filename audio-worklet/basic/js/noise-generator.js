/**
 * A noise generator example with a gain AudioParam.
 * 
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
    let output = outputs[0];
    let amplitude = parameters.amplitude;
    for (let channel = 0; channel < output.length; ++channel) {
      let outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; ++i) {
        outputChannel[i] = Math.random() * amplitude[i];
      }
    }

    return true;
  }
}

registerProcessor('noise-generator', NoiseGenerator);
