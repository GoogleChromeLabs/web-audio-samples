class RecordingProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();

    console.log('constructor called');

    this.port.onmessage = (event) => {
      console.log('received message');
      console.log(event.data);

      if (event.data.setRecording === false || event.data.setRecording === true) {
        this.isRecording = event.data.setRecording;
      }
    };


    if (options && options.processorOptions)
      this.recordingBuffer = options.processorOptions.recordingBuffer;
    this.currentSampleBuffer = new Array(2).fill([]);
    this.recordingLength = 0;
    this.isRecording = false;
  }

  process(inputs, outputs, params) {
    const message = {};

    for (let input = 0; input < inputs.length; input++) {
      //Channel
      for (let channel = 0; channel < 1; channel++) {
        // Sample
        for (let sample = 0; sample < 128; sample++) {
          const currentSample = inputs[input][channel][sample];
          this.currentSampleBuffer[channel].push(currentSample);

          // Handle recording
          outputs[input][channel][sample] = currentSample;
        }

        // Handle recording
        if (this.isRecording) {
          this.recordingBuffer.copyToChannel(
              inputs[input][channel], channel, this.recordingLength
          );
        }
      }
    }

    // Handle sample sending
    if (this.currentSampleBuffer[0].length >= 256) {
      message.currentSample = this.currentSampleBuffer;
      this.currentSampleBuffer = new Array(inputs[0].length).fill([]);
    }

    if (this.isRecording) {
      this.recordingLength+=128;
      message.recordingLength = this.recordingLength;
    }

    this.port.sendMessage(message);

    return true;
  }
}

registerProcessor('recording-processor', RecordingProcessor);
