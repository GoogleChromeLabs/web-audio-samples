class RecordingProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    console.log('constructor called');

    this.port.onmessage = (event) => {
      console.log('received message');
      console.log(event.data);
    };

  }

  process(inputs, outputs, params) {

    if (
      !this.currentSampleBuffer
    ) 
      this.currentSampleBuffer = new Array(inputs[0].length).fill([]);

    for (let i = 0; i < inputs.length; i++) {
      for (let j = 0; j < 1; j++) {

        console.log(inputs[i][j]);

        for (let k = 0; k < 128; j++) {
          const currentSample = inputs[i][j][k];

          if (this.currentSampleBuffer[j].length >= 256) {
            this.port.posMessage(this.currentSampleBuffer);
            this.currentSampleBuffer = new Array(inputs[i].length).fill([]);
          }

          this.currentSampleBuffer[j].push(currentSample);

          outputs[i][j][k] = inputs[i][j][k];
        }
      }
    }
    
    return true;
  }
}

registerProcessor('recording-processor', RecordingProcessor);
