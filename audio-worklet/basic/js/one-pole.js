registerProcessor('one-pole', class OnePole extends AudioWorkletProcessor {
  constructor () {
    super();
    let cutoffFrequency = 500;
    this.b1 = Math.exp(-2 * Math.PI * cutoffFrequency / 48000);
    this.a0 = 1.0 - this.b1;
    this.z1 = 0;
  }

  process (input, output) {
    let inputChannelData = input.getChannelData(0);
    let outputChannelData = output.getChannelData(0);
    for (let i = 0; i < 128; ++i) {
      this.z1 = inputChannelData[i] * this.a0 + this.z1 * this.b1;
      outputChannelData[i] = this.z1;
    }
  }
});
