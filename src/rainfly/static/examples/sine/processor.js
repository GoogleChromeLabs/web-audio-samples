class SineProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'frequency', defaultValue: 440, },
    ];
  }

  constructor() {
    super();
    this.phase = 0;
    this.inverseSampleRate = 1 / sampleRate;
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const frequency = parameters.frequency[0];

    for (let i = 0; i < output[0].length; ++i) {
      output[0][i] = Math.sin(2 * Math.PI * frequency * this.phase);
      this.phase += this.inverseSampleRate;
    }

    for (let channel = 1; channel < output.length; ++channel) {
      output[channel].set(output[0]);
    }

    return true;
  }
}

registerProcessor('sine-processor', SineProcessor);
