
// https://en.wikipedia.org/wiki/Sawtooth_wave
const sawtooth = (f, t) => {
  return 2 * (t * f - Math.floor(t * f + 0.5));
}

// https://en.wikipedia.org/wiki/Sine_wave
const sine = (f, t) => {
  return Math.sin(2 * Math.PI * f * t);
}

// https://en.wikipedia.org/wiki/Square_wave
const square = (f, t) => {
  return 2 * (2 * Math.floor(f * t) - Math.floor(2 * f * t)) + 1
}

// https://en.wikipedia.org/wiki/Triangle_wave
const triangle = (f, t) => {
  return 2 * Math.abs(2 * (f * t - Math.floor(f * t + 0.5))) - 1
}

const noise = () => {
  return 2 * (Math.random() - 0.5);
}

class BasicProcessor extends AudioWorkletProcessor {
  constructor(options) {
      super();
      this.sample = 0;
      this.output_function = noise;
      this.f = 440;
      if (options.processorOptions) {
          if (options.processorOptions.type == 'sine') {
              this.output_function = sine;
          } else if (options.processorOptions.type == 'sawtooth') {
              this.output_function = sawtooth;
          } else if (options.processorOptions.type == 'square') {
              this.output_function = square;
          } else if (options.processorOptions.type == 'triangle') {
              this.output_function = triangle;
          } else if (options.processorOptions.type == 'noise') {
              this.output_function = noise;
          }
          this.f = options.processorOptions.frequency || 440;
      }
  }

  process(inputs, outputs, parameters) {

      const output = outputs[0];
  

      for (let channel = 0; channel < output.length; ++channel) {
          const outputChannel = output[channel];
          for (let i = 0; i < outputChannel.length; ++i) {
              outputChannel[i] = this.output_function(this.f, this.sample/sampleRate);
              this.sample++;
              if (this.sample > sampleRate) this.sample = 0;
          }
      }

      return true;
  }
}

registerProcessor('basic-processor', BasicProcessor);