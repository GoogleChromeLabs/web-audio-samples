// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

class RecordingProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();

    this._liveSampleBuffer = new Float32Array(new SharedArrayBuffer(512));

    if (options) {
      if (options.recordingBuffer) {
        this._recordingBuffer = (options.processorOptions.recordingBuffer);
      }
      if (options.sampleRate) {
        this.sampleRate = options.processorOptions.sampleRate;
      }
    }

    this.recordingLength = 0;
    this.publishedRecordingLength = 0;
    this.isRecording = false;

    this.port.postMessage({
      message: 'PROCESSOR_INIT',
      liveSampleBuffer: this._liveSampleBuffer,
    });

    this.port.onmessage = (event) => {
      if (event.data.message === 'UPDATE_RECORDING_STATE') {
        this.isRecording = event.data.setRecording;
      }
    };
  }

  process(inputs, outputs, params) {
    for (let input = 0; input < 1; input++) {
      const numberOfChannels = inputs[input].length;

      // Channel
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const channelOffset = this.recordingLength + channel;

        // Sample
        for (let sample = 0; sample < inputs[input][channel].length; sample++) {
          const currentSample = inputs[input][channel][sample];

          this._liveSampleBuffer[sample] = currentSample;

          // Handle recording
          outputs[input][channel][sample] = currentSample;

          // Copy data to recording buffer interleaved
          if (this.isRecording) {
            const currentIndex = channelOffset +
                (sample * numberOfChannels);

            if (currentIndex < this._recordingBuffer.length) {
              this._recordingBuffer[currentIndex] =
                  currentSample;
            }
          }
        }
      }
    }

    if (this.isRecording &&
        this.recordingLength < this._recordingBuffer.length-128) {
      this.recordingLength+=128;

      // Only post a recordingLength update every 60 seconds
      if (this.recordingLength - this.publishedRecordingLength >
          this.sampleRate / 60) {
        this.publishedRecordingLength = this.recordingLength;

        this.port.postMessage({
          message: 'UPDATE_RECORDING_LENGTH',
          recordingLength: this.recordingLength,
        });
      }
    }

    // Let the rest of the app know the limit was reached.
    if (this.recordingLength >= this._recordingBuffer.length) {
      this.isRecording = false;
      this.port.postMessage({
        message: 'MAX_RECORDING_LENGTH_REACHED',
      });
    }

    return true;
  }
}

registerProcessor('recording-processor', RecordingProcessor);
