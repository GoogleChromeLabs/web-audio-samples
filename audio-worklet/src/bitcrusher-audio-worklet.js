/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @class Bitcrusher
 * @extends AudioWorkletProcessor
 * The bitcrusher reduces the sample rate and bit depth of an incoming audio
 * stream.
 */
registerProcessor('bitcrusher-audio-worklet',
                  class BitcrusherAudioWorklet extends AudioWorkletProcessor {

  static get parameterDescriptors() {
    return [{
      name: 'bitDepth',
      defaultValue: 24,
      minValue: 1,
      maxValue: 24
    }, {
      name: 'reduction',
      defaultValue: 1,
      minValue: 1,
      maxValue: 20
    }];
  }

  constructor(options) {
    super(options);

    // Index_ and previousSample_ are globals to handle block transitions.
    this.index_ = 0;
    this.previousSample_ = 0;
  }

  /**
   * Bit crush upon receiving input AudioBuffer, applying lo-fi effects to the
   * output buffer.
   * @param {AudioBuffer} input input audio data
   * @param {AudioBuffer} output output audio data
   * @param {Object} parameters
   * @param {Float32Array} parameters.bitDepth bit depth for each sample
   * @param {Float32Array} parameters.reduction sample rate reduction
   *                                            for each sample
   */
  process(input, output, parameters) {
    let inputChannelData = input.getChannelData(0);
    let outputChannelData = output.getChannelData(0);
    
    // Add new bit crushed sample to outputBuffer at specified interval.
    for (let j = 0; j < inputChannelData.length; j++) {
      if (this.index_ % Math.round(parameters.reduction[j]) === 0) {
        // Scale up and round off low order bits.
        const scale = Math.pow(2, parameters.bitDepth[j]);
        const rounded = Math.round(inputChannelData[j] * scale);
        this.previousSample_ = rounded / scale;
      }
      outputChannelData[j] = this.previousSample_;
      this.index_++;
    }
  }
});
