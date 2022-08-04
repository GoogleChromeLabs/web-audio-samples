class RecordingProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();

    this.port.onmessage = (event) => {
      if (
        event.data.setRecording === false ||
        event.data.setRecording === true
      ) {
        this.isRecording = event.data.setRecording;
      }
    };

    if (options && options.processorOptions.recordingBuffer) {
      this._recordingBuffer = new Float32Array(options.processorOptions.recordingBuffer);
      this.sampleRate = options.processorOptions.sampleRate;
    }
    this.recordingLength = 0;
    this.publishedRecordingLength = 0;
    this.isRecording = false;


    this.port.postMessage({
      message: 'PROCESSOR_INIT',
    });
  }

  process(inputs, outputs, params) {
    for (let input = 0; input < 1; input++) {
      const numberOfChannels = inputs[input].length;
      // Channel
      for (let channel = 0; channel < numberOfChannels; channel++) {
        // Sample
        for (let sample = 0; sample < inputs[input][channel].length; sample++) {
          const currentSample = inputs[input][channel][sample];

          // Handle recording
          outputs[input][channel][sample] = currentSample;

          // Copy data to recording buffer interleaved
          if (this.isRecording) {
            const currentIndex =
                this.recordingLength +
                (sample * numberOfChannels) +
                channel;

            if (currentIndex < this._recordingBuffer.length) {
              this._recordingBuffer[currentIndex] =
                  currentSample;
            }
          }
        }
      }
    }

    // TODO think about this bound
    if (this.isRecording && this.recordingLength < this._recordingBuffer.length) {
      this.recordingLength+=128;

      // Only post a recordingLength update every 1/4 second
      if (this.recordingLength - this.publishedRecordingLength > this.sampleRate / 60) {
        this.publishedRecordingLength = this.recordingLength;

        this.port.postMessage({
          message: 'UPDATE_RECORDING_LENGTH',
          recordLength: this.recordLength,
        });

        console.log(`update: ${this.recordingLength}`);
      }
    }

    return true;
  }
}

registerProcessor('recording-processor', RecordingProcessor);
