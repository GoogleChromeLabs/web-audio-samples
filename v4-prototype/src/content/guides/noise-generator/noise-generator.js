// Copyright (c) 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * A noise generator with a gain AudioParam.
 *
 * @class NoiseGenerator
 * @extends AudioWorkletProcessor
 */
class NoiseGenerator extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'amplitude', defaultValue: 0.25, minValue: 0, maxValue: 1 },
    ];
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const amplitude = parameters.amplitude;
    const isAmplitudeConstant = amplitude.length === 1;

    for (let channel = 0; channel < output.length; ++channel) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; ++i) {
        // This loop can branch out based on AudioParam array length, but
        // here we took a simple approach for demonstration purposes.
        outputChannel[i] = 2 * (Math.random() - 0.5) *
            (isAmplitudeConstant ? amplitude[0] : amplitude[i]);
      }
    }

    return true;
  }
}

registerProcessor('noise-generator', NoiseGenerator);
