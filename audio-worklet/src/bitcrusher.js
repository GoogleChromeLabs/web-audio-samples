/*
Copyright 2017, Google Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

    * Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above
copyright notice, this list of conditions and the following disclaimer
in the documentation and/or other materials provided with the
distribution.
    * Neither the name of Google Inc. nor the names of its
contributors may be used to endorse or promote products derived from
this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
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
  constructor (context, options) {
    if (context == null) throw "No AudioContext given";
    if (options == null) options = {}; 
    this.context_ = context;
    
    //... Default to maximum bit depth and no reduction and let browser decide
    //... buffersize unless specified
    this.bitDepth = options.bitDepth || 24; 
    this.reduction = options.reduction || 1;
    let bufferSize = options.bufferSize || 0;
    let inputChannels = options.inputChannels || 1;
    let outputChannels = options.inputChannels || 1;

    this.node_ = this.context_.createScriptProcessor(bufferSize, 
      options.inputChannels, options.outputChannels);

    this.node_.onaudioprocess = this.onaudioprocess_.bind(this); 

    //... Let clients connect to bitcrusher via input and output
    //... e.g oscillator.connect(bitcrusher.input) 
    //... bitcrusher.output.connect(context.destination)
    this.input = new GainNode(this.context_);
    this.output = new GainNode(this.context_);
    this.input.connect(this.node_).connect(this.output);
  }
  
  /**
   * Bit crush upon receiving input audio signal, applying signal distortion 
   * effects to the output buffer
   * @param  {AudioProcessingEvent} event holds input and output buffers
   */
  onaudioprocess_ (event) {
    for (let i = 0; i < event.inputBuffer.numberOfChannels; i++) {
      this.processBuffer_(this.reduction, this.bitDepth, 
        event.inputBuffer.getChannelData(i), 
        event.outputBuffer.getChannelData(i));
    }
  }

  /**
   * Reduce the information in given inputBuffer with specified factor and 
   * precision, placing results in outputBuffer.
   * @param  {Number} factor the amount of sample rate reduction
   * @param  {Number} precision the bit depth of post-processed samples   
   * @param  {Float32Array} inputBuffer pre-processed buffer
   * @param  {Float32Array} outputBuffer post-processed buffer
   */
   processBuffer_ (factor, precision, inputBuffer, outputBuffer) {
    // Set phaser to exceed 1 every [factor] sample
    if (factor <= 0) factor = 1; 
    const phaserInc = 1 / factor;
    let phaser = 1;
    const scale = Math.pow(2, precision);
    
    // Add new bit crushed sample to outputBuffer at specified interval
    let last;
    for (let j = 0; j < inputBuffer.length; j++) {
      if (phaser >= 1) {
        // Scale up and round off low order bits
        let temp = inputBuffer[j] * scale;
        let rounded = Math.round(temp);
        last = rounded / scale; 
        phaser = 0;
      }
      phaser += phaserInc;      
      outputBuffer[j] = last;
    }
  }
}