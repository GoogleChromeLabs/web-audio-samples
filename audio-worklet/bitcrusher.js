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
  
  constructor (context, options) {
    this.context_ = context;
    this.bits = options.bits;
    this.reduction = options.reduction;
    this.node_ = context.createScriptProcessor(options.bufferSize, options.inputChannel, options.outputChannel);     // context.createScriptProcessor(options.a, options.b, 44100);

    // bind the AudioNode onaudioproess method to the function defined below 
    // and ensure that any reference to "this" refers to properties of the Bitcrusher object
    this.node_.onaudioprocess = this.onaudioprocess_.bind(this); 
  }
  
  /*
    Bit crush upon receiving input audio signal, applying two signal distortion effects to the output buffer:
    1. output are represented by [options.bits] bits, thereby increasing sample error
    2. the sample changes every [options.reduction] samples, simulating a sample rate reduction
  */
  onaudioprocess_ (event) {
    let scale = Math.pow(1/2, this.bits);  // TODO clarify why this works
   
    // bit crush each channel of input
    for (let i = 0; i < event.inputBuffer.numberOfChannels; i++) {
      let input = event.inputBuffer.getChannelData(i);
      let output = event.outputBuffer.getChannelData(i);

      // for each sample in the input buffer, add new bit crushed sample every [this.reduction]
      let last = input[0];
      for (let j = 0; j < event.inputBuffer.length; j++) {
        if (j % this.reduction == 0) {
          last = Math.floor(input[j] / scale + 0.5) * scale; // TODO clarify and ensure this works
        }
        output[j] = last;
      }
    }
  }
  
  // connect node to destination
  connectOut (dest) {
    this.node_.connect(dest) // look up Function.apply
  }

  // connect input AudioNode to this
  connectIn(input) {
    input.connect(this.node_);
    console.log(input);
  }
  
  disconnect (dest) {
    this.node_.disconnect(dest) 
  }
}


