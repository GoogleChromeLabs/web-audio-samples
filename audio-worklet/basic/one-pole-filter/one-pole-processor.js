// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * A simple One pole filter.
 *
 * @class OnePoleProcessor
 * @extends AudioWorkletProcessor
 */
class OnePoleProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{
      name: 'frequency',
      defaultValue: 250,
      minValue: 0,
      maxValue: 0.5 * sampleRate
    }];
  }

  constructor() {
    super();
    this.updateCoefficientsWithFrequency_(250);
  }

  updateCoefficientsWithFrequency_(frequency) {
    this.b1_ = Math.exp(-2 * Math.PI * frequency / sampleRate);
    this.a0_ = 1.0 - this.b1_;
    this.z1_ = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    const frequency = parameters.frequency;
    const isFrequencyConstant = frequency.length === 1;

    for (let channel = 0; channel < output.length; ++channel) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];

      // If |frequency| parameter doesn't chnage in the current render quantum,
      // we don't need to update the filter coef either.
      if (isFrequencyConstant) {
        this.updateCoefficientsWithFrequency_(frequency[0]);
      }

      for (let i = 0; i < outputChannel.length; ++i) {
        if (!isFrequencyConstant) {
          this.updateCoefficientsWithFrequency_(frequency[i]);
        }
        this.z1_ = inputChannel[i] * this.a0_ + this.z1_ * this.b1_;
        outputChannel[i] = this.z1_;
      }
    }

    return true;
  }
}

registerProcessor('one-pole-processor', OnePoleProcessor);
