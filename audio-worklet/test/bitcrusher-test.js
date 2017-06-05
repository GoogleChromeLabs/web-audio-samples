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

//...  Populate array with 0:99 and verify the bitcrusher holds [0, 0, ... 0,
//...  10, 10, ..., 10] where the number of consecutive equal numbers is  
//...  controlled by the variable factor. 
//...  Because of floating precision error this test fails to be precise
//...  if the phaserInc variable in bitcrusher.js (1/factor) is not greater or 
//...  equal to 1 when multiplied by factor. So stop test at 5
let offlineContext = new OfflineAudioContext(2, 48000, 48000); 
let bitcrusher = new Bitcrusher(offlineContext, {});

for (let factor = 1; factor < 5; factor++) {
  const precision = 1; 
  const bufferSize = 100; 
  let referenceBuffer = new Float32Array(bufferSize);
  let outputBuffer = new Float32Array(bufferSize);
  
  // Populate array 1:100
  for (let i =0; i < bufferSize; i++) {
    referenceBuffer[i] = i; 
  }
  bitcrusher.processBuffer_(factor, precision, referenceBuffer, outputBuffer); 

  // Verify computed values match expected values
  outputBuffer.map((data, index) => { 
    let expected = Math.floor(index / factor) * factor;
    console.assert(data == expected, "computed " + data +
     " but expected " + expected);
  });
}

//... Create two oscillators, runing one through a bitcrusher with variables set  
//... to avoid any effect. Conjoin nodes through a ChannelMergerNode 
//... and feed output to an offline destination. Then verify that the samples 
//... are nearly identical
reduction = 1; 
bitDepth = 24; 
let osc = new OscillatorNode(offlineContext); 
let oscb = new OscillatorNode(offlineContext); 
const bufferLength = 512;
osc.start();  
oscb.start();

let merger = new ChannelMergerNode(offlineContext, {numberOfInputs: 2}); 
let bc = new Bitcrusher(offlineContext, {buffersize: 512, inputChannels: 1, 
	outputChannels: 1, bitDepth, reduction});

osc.connect(bc.input);
bc.output.connect(merger, 0, 0);
oscb.connect(merger, 0, 1);
merger.connect(offlineContext.destination);

// When audio buffer is ready, verify bitcrushed samples are unaltered 
offlineContext.startRendering().then(function (buffer) {
  let bcOutput = buffer.getChannelData(0); 
  let oscOutput = buffer.getChannelData(1); 

  // Allow for fractional error beyond audible perception
  const permittedSampleError = 0.0000001;

  // First script processed buffer is all zero
  const latency = bufferLength; 

  // Verify samples from unadultered oscillator match samples from bitcrushed 
  // oscillator with non-information reducing parameters
  for (let i = 0; i < oscOutput.length - latency; i++ ) {
    let crushedSample = bcOutput[i + latency];
    let oscSample = oscOutput[i];
    const diff = Math.abs(oscSample - crushedSample);
    console.assert(permittedSampleError > diff, "Bitcrushed sample at " + i + 
    	" is " + crushedSample + " but " + oscSample + " for oscillator"); 
  }
}).catch(function(err) {
  console.log("Rendering failed: " + err);
}); 
