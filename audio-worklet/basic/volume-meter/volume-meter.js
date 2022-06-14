// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const SMOOTHING_FACTOR = 0.8;

/**
 *  Measure microphone volume.
 *
 * @class VolumeMeter
 * @extends AudioWorkletProcessor
 */
class VolumeMeter extends AudioWorkletProcessor {

  #lastUpdate
  #volume

  constructor() {
    super();
    this.#lastUpdate = currentTime;
    this.#volume = 0;
  }

  process(inputs, outputs) {
    // This example only handles mono channel.
    const inputChannelData = inputs[0][0];

    // Calculate the squared-sum.
    let sum = 0;
    for (let i = 0; i < inputChannelData.length; i++) {
      sum += inputChannelData[i] * inputChannelData[i];
    }

    // Calculate the RMS level and update the volume.
    let rms = Math.sqrt(sum / inputChannelData.length);
    this.#volume = Math.max(rms, this.#volume * SMOOTHING_FACTOR);

    // Post a message to the node every 16ms.
    if (currentTime - this.#lastUpdate > 0.016) {
      this.port.postMessage(this.#volume);
      this.#lastUpdate = currentTime;
    }

    return true;
  }
}

registerProcessor("volume-meter", VolumeMeter);
