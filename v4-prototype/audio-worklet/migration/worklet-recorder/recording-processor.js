// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * AudioWorkletProcessor that records incoming audio frames into a memory buffer
 * on the audio rendering thread.
 *
 * @class RecordingProcessor
 * @extends AudioWorkletProcessor
 */
class RecordingProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();

    this.sampleRate = 48000;
    this.maxRecordingFrames = 48000 * 300;
    this.numberOfChannels = 2;

    if (options && options.processorOptions) {
      const {
        numberOfChannels = 2,
        sampleRate = 48000,
        maxFrameCount = 48000 * 300,
      } = options.processorOptions;

      this.sampleRate = sampleRate;
      this.maxRecordingFrames = maxFrameCount;
      this.numberOfChannels = numberOfChannels;
    }

    this._recordingBuffer = [];
    for (let i = 0; i < this.numberOfChannels; ++i) {
      this._recordingBuffer.push(new Float32Array(this.maxRecordingFrames));
    }

    this.recordedFrames = 0;
    this.isRecording = false;

    // Publish length updates at ~60 Hz
    this.framesSinceLastPublish = 0;
    this.publishInterval = Math.floor(this.sampleRate / 60);

    this.port.onmessage = (event) => {
      if (event.data.message === 'UPDATE_RECORDING_STATE') {
        this.isRecording = event.data.setRecording;

        if (this.isRecording === false) {
          this.port.postMessage({
            message: 'SHARE_RECORDING_BUFFER',
            buffer: this._recordingBuffer,
            recordingLength: this.recordedFrames,
          });
        }
      }
    };
  }

  process(inputs, outputs, params) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || input.length === 0) return true;

    for (let ch = 0; ch < this.numberOfChannels; ++ch) {
      const inputChannel = input[ch];
      if (!inputChannel) continue;

      for (let s = 0; s < inputChannel.length; ++s) {
        const sample = inputChannel[s];
        if (this.isRecording) {
          this._recordingBuffer[ch][s + this.recordedFrames] = sample;
        }
        if (output && output[ch]) {
          output[ch][s] = sample;
        }
      }
    }

    const shouldPublish =
      this.framesSinceLastPublish >= this.publishInterval;

    if (this.isRecording) {
      if (this.recordedFrames + 128 < this.maxRecordingFrames) {
        this.recordedFrames += 128;

        if (shouldPublish) {
          this.port.postMessage({
            message: 'UPDATE_RECORDING_LENGTH',
            recordingLength: this.recordedFrames,
          });
        }
      } else {
        this.isRecording = false;
        this.port.postMessage({
          message: 'MAX_RECORDING_LENGTH_REACHED',
          buffer: this._recordingBuffer,
          recordingLength: this.recordedFrames,
        });
        return false;
      }
    }

    if (shouldPublish) {
      this.framesSinceLastPublish = 0;
    } else {
      this.framesSinceLastPublish += 128;
    }

    return true;
  }
}

registerProcessor('recording-processor', RecordingProcessor);
