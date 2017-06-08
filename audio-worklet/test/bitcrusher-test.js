/*
  Copyright 2017 Google Inc.
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

let offlineContext = new OfflineAudioContext(2, 48000, 48000);

//  Populate array with 0:99 and verify the bitcrusher holds an array
//  where the number of consecutive equal numbers is
//  controlled by the variable factor.
for (let factor = 1; factor < 10; factor++) {
  const precision = 1;
  const bufferSize = 5;
  let referenceBuffer = new Float32Array(bufferSize);
  let outputBuffer = new Float32Array(bufferSize);
  let bitcrusher = new Bitcrusher(offlineContext, {});

  for (let i = 0; i < bufferSize; i++) {
    referenceBuffer[i] = i;
  }
  
  bitcrusher.processBuffer_(factor, precision, referenceBuffer, outputBuffer);

  // Verify computed values match expected values.
  outputBuffer.map((data, index) => {
    let expected = Math.floor(index / factor) * factor;
    console.assert(
        data == expected, 'computed ' + data + ' but expected ' + expected);
  });
  }

// Verify bitcrusher's memory between two blocks. If the processor is not
// done repeating samples by the end of the buffer, then it should continue
// where it left off at the beginning of the next buffer.
// Simulate this scenario by two consecutive calls to processBuffer,
// the first with buffer 1:5 and the second with 6:10 and a reduction factor
// of ten. If the bitcrusher works as expected, then the output of the second
// call should be 5 ones and not 5 sixes.
let a = [1, 2, 3, 4, 5];
let b = [6, 7, 8, 9, 10];
let bitcrusher = new Bitcrusher(offlineContext, {});
let outputA = new Float32Array(a.length);
let outputB = new Float32Array(b.length);

bitcrusher.processBuffer_(10, 24, a, outputA);
bitcrusher.processBuffer_(10, 24, b, outputB);
outputB.map((data) => {
  let expected = 1;
  console.assert(
      data == expected, 'computed ' + data + ' but expected ' + expected);
});

// Create two oscillators, runing one through a bitcrusher with variables set
// to avoid any effect. Conjoin nodes through a ChannelMergerNode
// and feed output to an offline destination. Then verify that the samples
// are nearly identical.
reduction = 1;
bitDepth = 24;
let osc = new OscillatorNode(offlineContext);
let oscb = new OscillatorNode(offlineContext);
const bufferLength = 512;
osc.start();
oscb.start();

let merger = new ChannelMergerNode(offlineContext, {numberOfInputs: 2});
bitcrusher = new Bitcrusher(offlineContext, {
  buffersize: 512,
  inputChannels: 1,
  outputChannels: 1, bitDepth, reduction
});

osc.connect(bitcrusher.input);
bitcrusher.output.connect(merger, 0, 0);
oscb.connect(merger, 0, 1);
merger.connect(offlineContext.destination);

// When audio buffer is ready, verify bitcrushed samples are unaltered.
offlineContext.startRendering()
    .then(function(buffer) {
      let bcOutput = buffer.getChannelData(0);
      let oscOutput = buffer.getChannelData(1);

      // Allow for fractional error beyond audible perception.
      const permittedSampleError = 0.0000001;

      // First script-processed-buffer is all zero.
      const latency = bufferLength;

      // Verify samples from unadultered oscillator match samples from
      // bitcrushed oscillator with non-information reducing parameters.
      for (let i = 0; i < oscOutput.length - latency; i++) {
        let crushedSample = bcOutput[i + latency];
        let oscSample = oscOutput[i];
        const diff = Math.abs(oscSample - crushedSample);
        console.assert(
            permittedSampleError > diff,
            'Bitcrushed sample at ' + i + ' is ' + crushedSample + ' but ' +
                oscSample + ' for oscillator');
      }
    })
    .catch(function(err) {
      console.log('Rendering failed: ' + err);
    });
