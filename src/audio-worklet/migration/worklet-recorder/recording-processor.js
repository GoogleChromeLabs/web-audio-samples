/* eslint-disable no-trailing-spaces */
/* eslint-disable valid-jsdoc */
/* eslint-disable quotes */
/* eslint-disable max-len */

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

    this._liveSampleBuffer = new Float32Array(new SharedArrayBuffer(512));

    if (options && options.processorOptions.recordingBuffer) {
      this._recordingBuffer = (options.processorOptions.recordingBuffer);
      this.sampleRate = options.processorOptions.sampleRate;
    }

    this.recordingLength = 0;
    this.publishedRecordingLength = 0;
    this.isRecording = false;

    this.port.postMessage({
      message: 'PROCESSOR_INIT',
      liveSampleBuffer: this._liveSampleBuffer,
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

          this._liveSampleBuffer[sample] = currentSample;

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
          recordingLength: this.recordingLength,
        });
      }
    }

    if (this.recordingLength >= this._recordingBuffer.length) {
      console.log("length reached");
    }

    return true;
  }
}

registerProcessor('recording-processor', RecordingProcessor);
