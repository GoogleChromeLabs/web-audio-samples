/**
 * @class Bypasser
 * @extends AudioWorkletProcessor
 *
 * This processor class demosntrates a simple bypass node.
 */
class Bypasser extends AudioWorkletProcessor {
  constructor() {
    super();
    this.counter_ = 0;
  }

  process(inputs, outputs) {
    let input = inputs[0];
    let output = outputs[0];
    for (let channel = 0; channel < output.length; ++channel) {
      output[channel].set(input[channel]);
    }

    return true;
  }
}

registerProcessor('bypasser', Bypasser);
