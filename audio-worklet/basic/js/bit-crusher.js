/**
 * A AudioWorklet-based BitCrusher demo from the spec example.
 * 
 * @class BitCrusher
 * @extends AudioWorkletProcessor
 * @see https://webaudio.github.io/web-audio-api/#the-bitcrusher-node
 */
class BitCrusher extends AudioWorkletProcessor {

  static get parameterDescriptors() {
    return [
      {name: 'bitDepth', defaultValue: 12, minValue: 1, maxValue: 16}, {
        name: 'frequencyReduction',
        defaultValue: 0.5,
        minValue: 0,
        maxValue: 1
      }
    ];
  }

  constructor(options) {
    super(options);
    this.phase_ = 0;
    this.lastSampleValue_ = 0;
  }

  process(inputs, outputs, parameters) {
    let input = inputs[0];
    let output = outputs[0];
    let bitDepth = parameters.bitDepth;
    let frequencyReduction = parameters.frequencyReduction;
    for (let channel = 0; channel < input.length; ++channel) {
      let inputChannel = input[channel];
      let outputChannel = output[channel];
      for (let i = 0; i < inputChannel.length; ++i) {
        let step = Math.pow(0.5, bitDepth[i]);
        this.phase_ += frequencyReduction[i];
        if (this.phase_ >= 1.0) {
          this.phase_ -= 1.0;
          this.lastSampleValue_ =
              step * Math.floor(inputChannel[i] / step + 0.5);
        }
        outputChannel[i] = this.lastSampleValue_;
      }
    }

    return true;
  }

}

registerProcessor('bit-crusher', BitCrusher);
