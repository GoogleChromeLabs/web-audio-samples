// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// https://en.wikipedia.org/wiki/Sawtooth_wave
const sawtooth = (frequency, time) => {
  return 2 * (time * frequency - Math.floor(time * frequency + 0.5));
}

// https://en.wikipedia.org/wiki/Sine_wave
const sine = (frequency, time) => {
  return Math.sin(2 * Math.PI * frequency * time);
}

// https://en.wikipedia.org/wiki/Square_wave
const square = (frequency, time) => {
  return 2 * 
    (2 * Math.floor(frequency * time) - Math.floor(2 * frequency * time)) + 1
}

// https://en.wikipedia.org/wiki/Triangle_wave
const triangle = (frequency, time) => {
  return 2 * 
    Math.abs(2 * (frequency * time - Math.floor(frequency * time + 0.5))) - 1
}

const noise = () => {
  return 2 * (Math.random() - 0.5);
}


/**
 * A basic processor with constructor options for frequency and type.
 *
 * @class BasicProcessor
 * @extends AudioWorkletProcessor
 */
class BasicProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.sample = 0;
    this.outputFunction = noise;
    this.frequency = 440;
    if (options.processorOptions) {
      if (options.processorOptions.type == 'sine') {
          this.outputFunction = sine;
      } else if (options.processorOptions.type == 'sawtooth') {
          this.outputFunction = sawtooth;
      } else if (options.processorOptions.type == 'square') {
          this.outputFunction = square;
      } else if (options.processorOptions.type == 'triangle') {
          this.outputFunction = triangle;
      } else if (options.processorOptions.type == 'noise') {
          this.outputFunction = noise;
      }
      this.frequency = options.processorOptions.frequency || 440;
    }
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];

    for (let channel = 0; channel < output.length; ++channel) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; ++i) {
        outputChannel[i] = 
          this.outputFunction(this.frequency, this.sample/sampleRate);
        this.sample++;
        if (this.sample > sampleRate) this.sample = 0;
      }
    }
    return true;
  }
}

registerProcessor('basic-processor', BasicProcessor);