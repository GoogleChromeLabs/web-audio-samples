/**
 * ---
 * 
 * @class ---
 * @extends AudioWorkletProcessor
 */
class Porter extends AudioWorkletProcessor {
  constructor() {
    super();
    console.dir(this);
    this.port.onmessage = this.handleMessage.bind(this);
  }

  process(inputs, outputs) {
    let input = inputs[0];
    let output = outputs[0];
    for (let channel = 0; channel < output.length; ++channel) {
      output[channel].set(input[channel]);
    }

    return true;
  }

  handleMessage(data) {
    console.log(data);
  }
}

registerProcessor('porter', Porter);
