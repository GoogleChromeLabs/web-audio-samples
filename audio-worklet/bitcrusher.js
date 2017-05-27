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
 * @param {AudioContext} context: the audio context
 * @param {!Dictionary} options: a dictionary with three key value pairs:
 *  - options.buffersize holds the size of a given onaudioprocess window
 *  - options.inputChannels holds the number of input channels
 *  - options.outputChannels holds the number of output channels
*/
class Bitcrusher {
  
  constructor (context, options) {
    this.context_ = context;
    this.bitDepth = options.bitDepth; 
    this.reduction = options.reduction;
    this.node_ = this.context_.createScriptProcessor(options.buffersize, options.inputChannels, options.outputChannels);//

    // bind the AudioNode onaudioproess method to the function defined below 
    this.node_.onaudioprocess = this.onaudioprocess_.bind(this); 
  }
  
  /**
    Bit crush upon receiving input audio signal, applying two signal distortion effects to the output buffer:
    - output has reduced bit depth controlled by [options.bits] bits, thereby increasing sample error
    - the sample changes only every [options.reduction] samples, simulating a sample rate reduction
    @param {!AudioProcessingEvent} event 
  */
  onaudioprocess_ (event) {
    for (let i = 0; i < event.inputBuffer.numberOfChannels; i++) {
      Bitcrusher.bitcrush(this.reduction, this.bitDepth, event.inputBuffer.getChannelData(i), event.outputBuffer.getChannelData(i));
    }
  }

  /**
    Reduce the information in given inputBuffer with specified factor and precision,
    placing results in oututBuffer.
    @param {number} factor to reduce by
    @param {number} precision or bit depth of post-processed samples
    @param {Float32Array} inputBuffer pre-processed buffer
    @param {Float32Array} outputBuffer post-processed buffer
  */
  static bitcrush(factor, precision, inputBuffer, outputBuffer) {
    if (factor <= 0) factor = 1; // handle erroneous factor input by not sample reducing
    
    // for each sample in the input buffer, add new bit crushed sample in outputBuffer
    let last;
    for (let j = 0; j < inputBuffer.length; j++) {
      if (j % factor == 0) { // always activates at iteration 0 since 0 % x == 0
        last = Bitcrusher.round(inputBuffer[j], precision, 2); // round sample at specified resolution
      }
      outputBuffer[j] = last;
    }
  }

  /** 
    Round at the specified unit of precision. For bitcrushing, this reduces the information of a given sample 
    @param {number} number to be rounded 
    @param {number} precision of the number
    @param {number} base of precision
  */
  static round(number, precision, base) {
    let factor = Math.pow(base, precision);
    let temp = number * factor;
    let rounded = Math.round(temp);
    return rounded / factor;
  };
  
  /**
    Connect this script processor node to target Audio Node
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
    Disconnect input AudioNode to internal script processor node
    @param {AudioNode} dest to disconnect from
    @return {Bitcrusher} this for chaining
  */
  disconnect (dest) {
    this.node_.disconnect(dest);
    return this; 
  }
}

testBitcrusher();

/**
  Run series of tests on Bitcrusher node, 
*/
function testBitcrusher() {
  /* ---------------------------------------------------------------------------- 
     Test Bitcrusher rounding method. 
     ----------------------------------------------------------------------------*/
  let base = 10; // set base to 10 for easier testing
  let x = Bitcrusher.round(1.7821, 2, base); 
  let expected = 1.78;
  console.assert(x == expected, "computed " + x + " but expected " + expected);

  x = Bitcrusher.round(-1.332432, 5, base); 
  expected = -1.33243;
  console.assert(x == expected, "computed " + x + " but expected " + expected);

  x = Bitcrusher.round(10.322, 3, base); 
  expected = 10.322;
  console.assert(x == expected, "computed " + x + " but expected " + expected);

  x = Bitcrusher.round(23.432123212321232123, 9, base); 
  expected = 23.432123212;
  console.assert(x == expected, "computed " + x + " but expected " + expected);

  x = Bitcrusher.round(1, 1, base); 
  expected = 1;
  console.assert(x == expected, "computed " + x + " but expected " + expected);
  /* ---------------------------------------------------------------------------- */

  
  /* ---------------------------------------------------------------------------- 
     Test sample reduction component. 
     ---------------------------------------------------------------------------- */
  // Hold constant precision and test factor reduction
  // Populate a Float Array with 0:99 and verify the bitcrusher holds [0, 0, ... 0] [10, 10, ... 10]
  // where the number of consecutive equal numbers is controlled by factor
  for (let factor = 1; factor < 10; factor++) {
    const precision = 1; // leave precision in tact
    const bufferSize = 100; // arbitrarily sized buffer for testing
    let referenceBuffer = new Float32Array(bufferSize);
    let outputBuffer = new Float32Array(bufferSize);
    
    for (let i =0; i < bufferSize; i++) {
      referenceBuffer[i] = i; // populate array 1:100
    }

    Bitcrusher.bitcrush(factor, precision, referenceBuffer, outputBuffer); 
    
    outputBuffer.map(function(d, i) { // d is bitcrushed data and i is index in array
      let expected = Math.floor(i / factor) * factor;
      console.assert(d == expected, "computed " + d + " but expected " + expected);
    });
  }
  
  /*---------------------------------------------------------------------------- 
    Test Bitcrusher in Offline Web Audio context  
    ---------------------------------------------------------------------------- */ 
  // Test that Bitcrusher class works in offline Web Audio context.
  // Create two oscillators, runing one through a bitcrusher with variables set to avoid any effect.
  // Conjoin the nodes through a ChannelMergerNode and feed output to an offline destination.
  // Verify that the samples are nearly identical
  let offlineContext = new OfflineAudioContext(2, 12800, 12800); // create 2 channels for comparison
  reduction = 1; 
  bitDepth = 16; 
  let osc = new OscillatorNode(offlineContext); 
  let oscb = new OscillatorNode(offlineContext); 
  let bufferLength = 512
  osc.start();  
  oscb.start();

  // connect bitcrushed oscillator to index 0 of channel merger
  let merger = new ChannelMergerNode(offlineContext, {numberOfInputs: 2}); 
  let bc = new Bitcrusher(offlineContext, {buffersize: 512, inputChannels: 1, outputChannels: 1, bitDepth, reduction});
  bc.connectIn(osc).connectOut(merger);

  // connect naked oscillator to other channel of channel node
  oscb.connect(merger, 0, 1);
  merger.connect(offlineContext.destination);
  
  // render the audio graph and inspect the buffer 
  offlineContext.startRendering().then(function (buffer) {
    let bcOutput = buffer.getChannelData(0); // bitcrushed output
    let oscOutput = buffer.getChannelData(1); // oscillator output
    const permittedSampleError = 0.0001;
    const scriptProcessorLatencyError = bufferLength * 2; // first values are 0 with script processor

    // verify samples from naked oscillator match samples from bitcrushed oscillator with non-information reducing parameters
    for (let i = 0; i < oscOutput.length - scriptProcessorLatencyError; i++ ) {
      let crushedSample = bcOutput[i + scriptProcessorLatencyError];
      let oscSample = oscOutput[i];
      const diff = Math.abs(oscSample - crushedSample);
      console.assert(permittedSampleError > diff, "Bitcrushed sample at " + i + " is " + crushedSample + " but " + oscSample + " for oscillator"); 
    }

  }).catch(function(err) {
    console.log("Rendering failed: " + err);
  }); 



}


