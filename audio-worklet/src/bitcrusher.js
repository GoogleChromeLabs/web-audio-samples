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

/** 
 * Bitcrusher implements an AudioNode-like wrapper for a ScriptProcessor object 
 * that reduces the sample rate and bit depth of an audiobuffer.
 * @param {BaseAudioContext} context the audio context
 * @param {Number} options.bufferSize holds the size of an onaudioprocess window
 * @param {Number} options.inputChannels holds the number of input channels
 * @param {Number} options.outputChannels holds the number of output channels
 * @param {Number} options.bitDepth holds the number of bits for each sample
 * @param {Number} options.reduction holds the degree of reduction
*/
class Bitcrusher {
  
  constructor (context, options) {
    this.context_ = context;
    this.bitDepth = options.bitDepth; 
    this.reduction = options.reduction;
    this.node_ = this.context_.createScriptProcessor(options.buffersize, 
      options.inputChannels, options.outputChannels);

    // bind the AudioNode onaudioproess method to the function defined below 
    this.node_.onaudioprocess = this.onaudioprocess_.bind(this); 
  }
  
  /**
    Bit crush upon receiving input audio signal, applying two signal distortion 
    effects to the output buffer controlled by this.bitDepth and this.reduciton
    @param {AudioProcessingEvent} event holds input and output buffers
  */
  onaudioprocess_ (event) {
    for (let i = 0; i < event.inputBuffer.numberOfChannels; i++) {
      Bitcrusher.bitcrush(this.reduction, this.bitDepth, 
        event.inputBuffer.getChannelData(i), 
        event.outputBuffer.getChannelData(i));
    }
  }

  /**
    Reduce the information in given inputBuffer with specified factor and 
    precision, placing results in oututBuffer.
    @param {Number} factor to reduce by
    @param {Number} precision or bit depth of post-processed samples
    @param {Float32Array} inputBuffer pre-processed buffer
    @param {Float32Array} outputBuffer post-processed buffer
  */
  static bitcrush(factor, precision, inputBuffer, outputBuffer) {
    if (factor <= 0) factor = 1; // don't sample reduce
    
    // Add new bit crushed sample in outputBuffer
    let last;
    for (let j = 0; j < inputBuffer.length; j++) {
      if (j % factor == 0) { // always activates at iteration 0 since 0 % x == 0
        last = Bitcrusher.round(inputBuffer[j], precision, 2); // round sample 
      }
      outputBuffer[j] = last;
    }
  }

  /** 
    Round at the specified unit of precision.  
    @param {Number} number to be rounded 
    @param {Number} precision of the number
    @param {Number} base of precision
  */
  static round(number, precision, base) {
    let factor = Math.pow(base, precision);
    let temp = number * factor;
    let rounded = Math.round(temp);
    return rounded / factor;
  };
  
  /**
    Connect script processor node to target Audio Node
    @param {AudioNode} target  
    @return {Bitcrusher} this for chaining
  */
  connectOut(dest) {
    this.node_.connect(dest) 
    return this;
  }

  /** 
    Connect input AudioNode to internal script processor node
    @param {AudioNode}  
    @return {Bitcrusher} this for chaining
  */
  connectIn(input) {
    input.connect(this.node_);
    return this; 
  }
  
  /** 
    Disconnect input AudioNode from internal script processor node
    @param {AudioNode} dest to disconnect from
    @return {Bitcrusher} this for chaining
  */
  disconnect (dest) {
    this.node_.disconnect(dest);
    return this; 
  }
}




