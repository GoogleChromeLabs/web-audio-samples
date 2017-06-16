// See hello-audio-worklet.html for the actual demo code.
registerProcessor('bypasser', class Bypass extends AudioWorkletProcessor {
  constructor () {
    super();
  }

  process (input, output) {
    let inputChannelData = input.getChannelData(0);
    let outputChannelData = output.getChannelData(0);
    outputChannelData.set(inputChannelData);
  }
});
