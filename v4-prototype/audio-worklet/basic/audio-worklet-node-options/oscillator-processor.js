// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Mathematical waveform generators.
 */
const sawtooth = (frequency, time) => {
  return 2 * (time * frequency - Math.floor(time * frequency + 0.5));
};

const sine = (frequency, time) => {
  return Math.sin(2 * Math.PI * frequency * time);
};

const square = (frequency, time) => {
  return (
    2 * (2 * Math.floor(frequency * time) -
        Math.floor(2 * frequency * time)) + 1
  );
};

const triangle = (frequency, time) => {
  return (
    2 * Math.abs(2 * (frequency * time -
        Math.floor(frequency * time + 0.5))) - 1
  );
};

const noise = () => {
  return 2 * (Math.random() - 0.5);
};

/* global sampleRate */

/**
 * A basic oscillator processor that supports constructor options for
 * waveform type and frequency.
 *
 * @class OscillatorProcessor
 * @extends AudioWorkletProcessor
 */
class OscillatorProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.sampleCounter = 0;
    this.outputFunction = sine;
    this.frequency = 440;

    if (options && options.processorOptions) {
      const { waveformType, frequency } = options.processorOptions;
      if (waveformType) {
        switch (waveformType) {
          case 'sine':
            this.outputFunction = sine;
            break;
          case 'sawtooth':
            this.outputFunction = sawtooth;
            break;
          case 'square':
            this.outputFunction = square;
            break;
          case 'triangle':
            this.outputFunction = triangle;
            break;
          case 'noise':
            this.outputFunction = noise;
            break;
        }
      }
      if (typeof frequency === 'number') {
        this.frequency = frequency;
      }
    }
  }

  process(inputs, outputs) {
    const output = outputs[0];
    const channelCount = output.length;
    if (channelCount === 0) return true;

    const frameCount = output[0].length;
    for (let i = 0; i < frameCount; ++i) {
      const sample = this.outputFunction(
        this.frequency,
        this.sampleCounter / sampleRate
      );
      for (let channel = 0; channel < channelCount; ++channel) {
        output[channel][i] = sample;
      }
      this.sampleCounter++;
      if (this.sampleCounter > sampleRate) {
        this.sampleCounter = 0;
      }
    }
    return true;
  }
}

registerProcessor('oscillator-processor', OscillatorProcessor);
