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
class Bitcrusher {
  /**
   * Implements a wrapper for a ScriptProcessor object
   * that reduces the sample rate and bit depth of an audiobuffer.
   * @param {BaseAudioContext} context the audio context
   * @param {Number} options.bufferSize the size of an onaudioprocess window
   * @param {Number} options.inputChannels the number of input channels
   * @param {Number} options.outputChannels the number of output channels
   * @param {Number} options.bitDepth the number of bits for each sample
   * @param {Number} options.reduction the degree of reduction
   */
  constructor(context, options) {
    if (context == null) throw 'No AudioContext given';
    if (options == null) options = {};
    this.context_ = context;

    // Default to maximum bit depth and no reduction and let browser decide
    // buffersize unless specified.
    this.bitDepth = options.bitDepth || 24;
    this.reduction = options.reduction || 1;
    let bufferSize = options.bufferSize || 0;
    let inputChannels = options.inputChannels || 1;
    let outputChannels = options.inputChannels || 1;

    this.node_ = this.context_.createScriptProcessor(
        bufferSize, inputChannels, outputChannels);
    this.node_.onaudioprocess = this.onaudioprocess_.bind(this);

    // Let clients connect to bitcrusher via input and output,
    // e.g oscillator.connect(bitcrusher.input) or
    // bitcrusher.output.connect(context.destination).
    this.input = new GainNode(this.context_);
    this.output = new GainNode(this.context_);
    this.input.connect(this.node_).connect(this.output);

    // Index and previousSample defined as globals to handle block transitions.
    // PreviousSample will be input[0] at specified bit depth on the first call
    // to onaudioprocess since 0 % x == 0 
    this.index_ = 0;
    this.previousSample_;
  }

  /**
   * Bit crush upon receiving input audio signal, applying signal distortion
   * effects to the output buffer.
   * @param  {AudioProcessingEvent} event holds input and output buffers
   */
  onaudioprocess_(event) {
    for (let i = 0; i < event.inputBuffer.numberOfChannels; i++) {
      this.processBuffer_(
          this.reduction, this.bitDepth, event.inputBuffer.getChannelData(i),
          event.outputBuffer.getChannelData(i));
    }
  }

  /**
   * Reduce the information in given inputBuffer with specified reduction and
   * bitDepth, placing results in outputBuffer.
   * @param  {Number} reduction the amount of sample rate reduction
   * @param  {Number} bitDepth the bit depth of post-processed samples
   * @param  {Float32Array} inputBuffer pre-processed buffer
   * @param  {Float32Array} outputBuffer post-processed buffer
   */
  processBuffer_(reduction, bitDepth, inputBuffer, outputBuffer) {
    if (reduction < 1) 
      console.error('The minimum reduction rate is 1.');
    
    const scale = Math.pow(2, bitDepth);

    // Add new bit crushed sample to outputBuffer at specified interval.
    for (let j = 0; j < inputBuffer.length; j++) {
      if (this.index_ % reduction === 0) {
        // Scale up and round off low order bits.
        let rounded = Math.round(inputBuffer[j] * scale);
        this.previousSample_ = rounded / scale;
      }
      outputBuffer[j] = this.previousSample_;
      this.index_++;
    }
  }
}
