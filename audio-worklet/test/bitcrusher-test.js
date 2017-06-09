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
let context = new OfflineAudioContext(2, 48000, 48000);

//  Populate array with 0:99 and verify the bitcrusher holds an array
//  where the number of consecutive equal numbers is
//  controlled by the variable factor.
for (let factor = 1; factor < 10; factor++) {
  const precision = 1;
  const bufferSize = 5;
  let referenceBuffer = new Float32Array(bufferSize);
  let outputBuffer = new Float32Array(bufferSize);
  let bitcrusher = new Bitcrusher(context);

  for (let i = 0; i < bufferSize; i++) {
    referenceBuffer[i] = i;
  }
  
  bitcrusher.processBuffer_(factor, precision, referenceBuffer, outputBuffer);

  // Verify computed values match expected values.
  outputBuffer.map((data, index) => {
    let expected = Math.floor(index / factor) * factor;
    console.assert(
        data === expected, 'computed ' + data + ' but expected ' + expected);
  });
  }

// Verify bitcrusher's memory between two blocks. If the processor is not
// done repeating samples by the end of the buffer, then it should continue
// where it left off at the beginning of the next buffer.
// Reproduce this scenario by two consecutive calls to processBuffer,
// the first with buffer 0:4 and the second with 5:9 and a reduction factor
// of x. The two output buffers concatenated together should be identical to
// the output of one bitcrusher processing one block.
let a = [0, 1, 2, 3, 4];
let b = [5, 6, 7, 8, 9];
let bitcrusher = new Bitcrusher(context);
let outputA = [];
let outputB = [];

let factor = 4;
bitcrusher.processBuffer_(factor, 24, a, outputA);
bitcrusher.processBuffer_(factor, 24, b, outputB);

let output = outputA.concat(outputB);

output.map((data, index) => {
  let expected = Math.floor(index / factor) * factor;
  console.assert(
      data === expected, 'computed ' + data + ' but expected ' + expected);
});

// Create two oscillators, running one through a bitcrusher with variables set
// to avoid any effect. Conjoin nodes through a ChannelMergerNode
// and feed output to an offline destination. Then verify that the samples
// are nearly identical.
reduction = 1;
bitDepth = 24;
let bufferLength = 512;
let bitcrusherOscillator = new OscillatorNode(context);
let unalteredOscillator = new OscillatorNode(context);
bitcrusherOscillator.start();
unalteredOscillator.start();

let merger = new ChannelMergerNode(context, {numberOfInputs: 2});
bitcrusher = new Bitcrusher(context, {
  buffersize: bufferLength,
  inputChannels: 1,
  outputChannels: 1, 
  bitDepth: bitDepth, 
  reduction: reduction
});

// Accomodate for script processor latency by delaying the unaltered oscillator.
let delay = context.createDelay();
delay.delayTime.value = bufferLength / context.sampleRate; 

bitcrusherOscillator.connect(bitcrusher.input);
bitcrusher.output.connect(merger, 0, 0);
unalteredOscillator.connect(delay).connect(merger, 0, 1);
merger.connect(context.destination);

// When audio buffer is ready, verify bitcrushed samples are unaltered.
context.startRendering()
    .then((buffer) => {
      let bitcrusherOutput = buffer.getChannelData(0);
      let unalteredOutput = buffer.getChannelData(1);

      // Allow for fractional error beyond audible perception. This error
      // occurs because any sample passing through bitcrusher will undergo 
      // manipulation in Math.round() and will therefore be represented by a
      // new floating point number that differs slightly from the original. 
      // In tested  samples, the maximum observed error is on the order of 10^-7 
      // and most frequently between 0 and 10^-8. The permitted error is set
      // here to be 10^-6 so that tests pass.
      const permittedSampleError = Math.pow(10,-6);

      // First script-processed-buffer is all zero.
      const latency = bufferLength;

      // Verify samples from unadultered oscillator match samples from
      // bitcrushed oscillator with non-information reducing parameters.
      for (let i = 0; i < unalteredOutput.length; i++) {
        let crushedSample = bitcrusherOutput[i];
        let unalteredSample = unalteredOutput[i];
        const diff = Math.abs(unalteredSample - crushedSample);
        console.assert(
            diff < permittedSampleError,
            'Bitcrushed sample at ' + i + ' is ' + crushedSample + ' but ' +
                unalteredSample + ' for oscillator');
      }
    })
    .catch((err) => {
      console.log('Rendering failed: ' + err);
    });
