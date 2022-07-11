// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// https://en.wikipedia.org/wiki/Sawtooth_wave
const sawtooth = (frequency, time) => {
  return 2 * (time * frequency - Math.floor(time * frequency + 0.5));
};

// https://en.wikipedia.org/wiki/Sine_wave
const sine = (frequency, time) => {
  return Math.sin(2 * Math.PI * frequency * time);
};

// https://en.wikipedia.org/wiki/Square_wave
const square = (frequency, time) => {
  return 2 *
      (2 * Math.floor(frequency * time) - Math.floor(2 * frequency * time)) + 1;
};

// https://en.wikipedia.org/wiki/Triangle_wave
const triangle = (frequency, time) => {
  return 2 *
      Math.abs(2 * (frequency * time - Math.floor(frequency * time + 0.5))) - 1;
};

const noise = () => {
  return 2 * (Math.random() - 0.5);
};

/* global sampleRate */

/**
 * A basic oscillatorprocessor that supports constructor options for
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
    if (options.processorOptions) {
      if (options.processorOptions.waveformType) {
        switch (options.processorOptions.waveformType) {
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
      if (options.processorOptions.frequency) {
        this.frequency = options.processorOptions.frequency;
      }
    }
  }

  process(inputs, outputs) {
    const output = outputs[0];
    for (let channel = 0; channel < output.length; ++channel) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; ++i) {
        outputChannel[i] =
            this.outputFunction(
                this.frequency, this.sampleCounter / sampleRate);
        this.sampleCounter++;
        if (this.sampleCounter > sampleRate) this.sampleCounter = 0;
      }
    }
    return true;
  }
}

registerProcessor('oscillator-processor', OscillatorProcessor);
