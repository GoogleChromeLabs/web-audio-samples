class Processor extends AudioWorkletProcessor {
  constructor(options) {
    this.sampleBuffer = new SharedArrayBuffer(128);

    this.port.onmessage = (events) => {
      console.log(events);
    };

    this.port.postMessage({
      message: 'init',
      buffer: this.sampleBuffer,
    }); fixAll;
  }

  process(inputs, outputs, params) {
    for (let i = 0; i < 1; i++) {
      for (let j = 0; j < 2; j++) {
        for (let k = 0; k < 128; k++) {
          const currentSample = inputs[i][j][k];
          this.sampleBuffer[i] = currentSample;
          outputs[i][j][k] = currentSample;
        }
      }
    }
  }
}

registerProcessor("processor", Processor);
