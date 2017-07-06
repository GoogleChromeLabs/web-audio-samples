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
 * The bitcrusher reduces the sample rate and bit depth of an audiobuffer.
 */
registerProcessor('bitcrusher-audio-worklet', class BitcrusherAudioWorklet extends AudioWorkletProcessor {

  static get parameterDescriptors () {
    return [{
      name: 'bitDepth',
      defaultValue: 16,
      minValue: 1,
      maxValue: 24
    }, {
      name: 'frequencyReduction',
      defaultValue: 0.5,
      minValue: 0,
      maxValue: 1
    }];
  }

  constructor(options) {
    super(options);

    // Index and previousSample defined as globals to handle block transitions.
    this.index_ = 0;
    this.previousSample_ = 0;
  }
  
  /**
   * Bit crush upon receiving input audio signal, applying signal distortion
   * effects to the output buffer.
   * @param  {AudioProcessingEvent} event holds input and output buffers
   */
  process(input, output, parameters) {
    let inputChannelData = input.getChannelData(0);
    let outputChannelData = output.getChannelData(0);
    const scale = Math.pow(2, parameters.bitDepth);

    console.log(parameters.reduction[10]);
    console.log(parameters.reduction[0]);
    //console.log(parameters[0], [parameters[100]]);
    // Add new bit crushed sample to outputBuffer at specified interval.
    for (let j = 0; j < inputChannelData.length; j++) {
      if (this.index_ % parameters.reduction === 0) {
        // Scale up and round off low order bits.
        const rounded = Math.round(inputChannelData[j] * scale);
        this.previousSample_ = rounded / scale;
      }
      outputChannelData[j] = this.previousSample_;
      this.index_++;
    }
    //console.log(outputChannelData);
    //console.log(inputChannelData, outputChannelData, parameters);
  }
});
