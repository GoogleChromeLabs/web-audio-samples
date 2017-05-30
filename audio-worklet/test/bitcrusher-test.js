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


/* ------------------------------------------------------------------------- 
   Test Bitcrusher rounding method. 
   -------------------------------------------------------------------------*/
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
/* ------------------------------------------------------------------------ */


/* -------------------------------------------------------------------------- 
   Test sample reduction component. 
   Hold constant precision and test factor reduction
   Populate array with 0:99 and verify the bitcrusher holds [0, 0, ... 0,
   10, 10, ... 10] where the number of consecutive equal numbers is controlled 
   by the variable factor
   ------------------------------------------------------------------------ */

for (let factor = 1; factor < 10; factor++) {
  const precision = 1; // leave precision in tact
  const bufferSize = 100; // arbitrarily sized buffer for testing
  let referenceBuffer = new Float32Array(bufferSize);
  let outputBuffer = new Float32Array(bufferSize);
  
  // populate array 1:100
  for (let i =0; i < bufferSize; i++) {
    referenceBuffer[i] = i; 
  }

  Bitcrusher.bitcrush(factor, precision, referenceBuffer, outputBuffer); 
  
  // verify computed values match expected values
  outputBuffer.map(function(d, i) { // d is bitcrushed data and i is index 
    let expected = Math.floor(i / factor) * factor;
    console.assert(d == expected, "computed " +d + " but expected " + expected);
  });
}

/*------------------------------------------------------------------------- 
  Test Bitcrusher in Offline Web Audio context  
  Test that Bitcrusher class works in offline Web Audio context.
  Create two oscillators, runing one through a bitcrusher with variables set to 
  avoid any effect. Conjoin nodes through a ChannelMergerNode and feed output
  to an offline destination. Then verify that the samples are nearly identical
  -----------------------------------------------------------------------*/

let offlineContext = new OfflineAudioContext(2, 12800, 12800); 
reduction = 1; 
bitDepth = 16; 
let osc = new OscillatorNode(offlineContext); 
let oscb = new OscillatorNode(offlineContext); 
let bufferLength = 512
osc.start();  
oscb.start();

// connect bitcrushed oscillator to index 0 of channel merger
let merger = new ChannelMergerNode(offlineContext, {numberOfInputs: 2}); 
let bc = new Bitcrusher(offlineContext, {buffersize: 512, inputChannels: 1, 
	outputChannels: 1, bitDepth, reduction});
bc.connectIn(osc).connectOut(merger);

// connect naked oscillator to other channel of channel node
oscb.connect(merger, 0, 1);
merger.connect(offlineContext.destination);

// render the audio graph and inspect the buffer 
offlineContext.startRendering().then(function (buffer) {
  let bcOutput = buffer.getChannelData(0); // bitcrushed output
  let oscOutput = buffer.getChannelData(1); // oscillator output
  const permittedSampleError = 0.0001;

  // first and last buffers are all 0 with script processor
  const scriptProcessorLatencyError = bufferLength * 2; 

  // verify samples from naked oscillator match samples from bitcrushed 
  // oscillator with non-information reducing parameters
  for (let i = 0; i < oscOutput.length - scriptProcessorLatencyError; i++ ) {
    let crushedSample = bcOutput[i + scriptProcessorLatencyError];
    let oscSample = oscOutput[i];
    const diff = Math.abs(oscSample - crushedSample);
    console.assert(permittedSampleError > diff, "Bitcrushed sample at " + i + 
    	" is " + crushedSample + " but " + oscSample + " for oscillator"); 
  }

}).catch(function(err) {
  console.log("Rendering failed: " + err);
}); 



