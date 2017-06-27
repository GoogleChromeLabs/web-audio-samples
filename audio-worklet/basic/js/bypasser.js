/**
 * @class Bypasser
 * @extends AudioWorkletProcessor
 *
 * This processor class demosntrates a simple bypass node.
 */
class Bypasser extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(input, output) {
    let inputChannelData = input.getChannelData(0);
    let outputChannelData = output.getChannelData(0);
    outputChannelData.set(inputChannelData);
  }
}

registerProcessor('bypasser', Bypasser);
