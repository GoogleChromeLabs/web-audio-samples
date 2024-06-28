// bypass-processor.js
class RecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    for (let channel = 0; channel < input.length; channel++) {
      output[channel].set(input[channel]);
      this.port.postMessage({channel, data: input[channel]});
    }

    return true;
  }
}

registerProcessor('recorder', RecorderProcessor);
