/**
 * ---
 * 
 * @class ---
 * @extends AudioWorkletProcessor
 */
class PorterProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    console.log('processor = ', this.port);
    this.port.onmessage = this.handleMessage.bind(this);
    // this.port.start();
  }

  handleMessage(event) {
    console.log(event);
  }

  process(inputs, outputs) {
    let input = inputs[0];
    let output = outputs[0];
    for (let channel = 0; channel < output.length; ++channel) {
      output[channel].set(input[channel]);
    }

    return false;
  }
}

registerProcessor('porter', PorterProcessor);
