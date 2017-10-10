// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


/**
 * @fileOverview  This file includes legacy utility functions for the layout
 *                test.
 */

// How many frames in a WebAudio render quantum.
let RENDER_QUANTUM_FRAMES = 128;

function writeString(s, a, offset) {
  for (let i = 0; i < s.length; ++i) {
    a[offset + i] = s.charCodeAt(i);
  }
}

function writeInt16(n, a, offset) {
  n = Math.floor(n);

  let b1 = n & 255;
  let b2 = (n >> 8) & 255;

  a[offset + 0] = b1;
  a[offset + 1] = b2;
}

function writeInt32(n, a, offset) {
  n = Math.floor(n);
  let b1 = n & 255;
  let b2 = (n >> 8) & 255;
  let b3 = (n >> 16) & 255;
  let b4 = (n >> 24) & 255;

  a[offset + 0] = b1;
  a[offset + 1] = b2;
  a[offset + 2] = b3;
  a[offset + 3] = b4;
}

// Return the bits of the float as a 32-bit integer value.  This
// produces the raw bits; no intepretation of the value is done.
function floatBits(f) {
  let buf = new ArrayBuffer(4);
  (new Float32Array(buf))[0] = f;
  let bits = (new Uint32Array(buf))[0];
  // Return as a signed integer.
  return bits | 0;
}

function writeAudioBuffer(audioBuffer, a, offset, asFloat) {
  let n = audioBuffer.length;
  let channels = audioBuffer.numberOfChannels;

  for (let i = 0; i < n; ++i) {
    for (let k = 0; k < channels; ++k) {
      let buffer = audioBuffer.getChannelData(k);
      if (asFloat) {
        let sample = floatBits(buffer[i]);
        writeInt32(sample, a, offset);
        offset += 4;
      } else {
        let sample = buffer[i] * 32768.0;

        // Clip samples to the limitations of 16-bit.
        // If we don't do this then we'll get nasty wrap-around distortion.
        if (sample < -32768)
          sample = -32768;
        if (sample > 32767)
          sample = 32767;

        writeInt16(sample, a, offset);
        offset += 2;
      }
    }
  }
}

// See http://soundfile.sapp.org/doc/WaveFormat/ and
// http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/WAVE.html
// for a quick introduction to the WAVE PCM format.
function createWaveFileData(audioBuffer, asFloat) {
  let bytesPerSample = asFloat ? 4 : 2;
  let frameLength = audioBuffer.length;
  let numberOfChannels = audioBuffer.numberOfChannels;
  let sampleRate = audioBuffer.sampleRate;
  let bitsPerSample = 8 * bytesPerSample;
  let byteRate = sampleRate * numberOfChannels * bitsPerSample / 8;
  let blockAlign = numberOfChannels * bitsPerSample / 8;
  let wavDataByteLength = frameLength * numberOfChannels * bytesPerSample;
  let headerByteLength = 44;
  let totalLength = headerByteLength + wavDataByteLength;

  let waveFileData = new Uint8Array(totalLength);

  let subChunk1Size = 16;  // for linear PCM
  let subChunk2Size = wavDataByteLength;
  let chunkSize = 4 + (8 + subChunk1Size) + (8 + subChunk2Size);

  writeString('RIFF', waveFileData, 0);
  writeInt32(chunkSize, waveFileData, 4);
  writeString('WAVE', waveFileData, 8);
  writeString('fmt ', waveFileData, 12);

  writeInt32(subChunk1Size, waveFileData, 16);  // SubChunk1Size (4)
  // The format tag value is 1 for integer PCM data and 3 for IEEE
  // float data.
  writeInt16(asFloat ? 3 : 1, waveFileData, 20);   // AudioFormat (2)
  writeInt16(numberOfChannels, waveFileData, 22);  // NumChannels (2)
  writeInt32(sampleRate, waveFileData, 24);        // SampleRate (4)
  writeInt32(byteRate, waveFileData, 28);          // ByteRate (4)
  writeInt16(blockAlign, waveFileData, 32);        // BlockAlign (2)
  writeInt32(bitsPerSample, waveFileData, 34);     // BitsPerSample (4)

  writeString('data', waveFileData, 36);
  writeInt32(subChunk2Size, waveFileData, 40);  // SubChunk2Size (4)

  // Write actual audio data starting at offset 44.
  writeAudioBuffer(audioBuffer, waveFileData, 44, asFloat);

  return waveFileData;
}

function createAudioData(audioBuffer, asFloat) {
  return createWaveFileData(audioBuffer, asFloat);
}

function finishAudioTest(event) {
  let audioData = createAudioData(event.renderedBuffer);
  testRunner.setAudioData(audioData);
  testRunner.notifyDone();
}

// Save the given |audioBuffer| to a WAV file using the name given by
// |filename|.  This is intended to be run from a browser.  The
// developer is expected to use the console to run downloadAudioBuffer
// when necessary to create a new reference file for a test.  If
// |asFloat| is given and is true, the WAV file produced uses 32-bit
// float format (full WebAudio resolution).  Otherwise a 16-bit PCM
// WAV file is produced.
function downloadAudioBuffer(audioBuffer, filename, asFloat) {
  // Don't download if testRunner is defined; we're running a layout
  // test where this won't be useful in general.
  if (window.testRunner)
    return false;
  // Convert the audio buffer to an array containing the WAV file
  // contents.  Then convert it to a blob that can be saved as a WAV
  // file.
  let wavData = createAudioData(audioBuffer, asFloat);
  let blob = new Blob([wavData], {type: 'audio/wav'});
  // Manually create html tags for downloading, and simulate a click
  // to download the file to the given file name.
  let a = document.createElement('a');
  a.style.display = 'none';
  a.download = filename;
  let audioURL = window.URL.createObjectURL(blob);
  let audio = new Audio();
  audio.src = audioURL;
  a.href = audioURL;
  document.body.appendChild(a);
  a.click();
  return true;
}

// Compare two arrays (commonly extracted from buffer.getChannelData()) with
// constraints:
//   options.thresholdSNR: Minimum allowed SNR between the actual and expected
//     signal. The default value is 10000.
//   options.thresholdDiffULP: Maximum allowed difference between the actual
//     and expected signal in ULP(Unit in the last place). The default is 0.
//   options.thresholdDiffCount: Maximum allowed number of sample differences
//     which exceeds the threshold. The default is 0.
//   options.bitDepth: The expected result is assumed to come from an audio
//     file with this number of bits of precision. The default is 16.
function compareBuffersWithConstraints(should, actual, expected, options) {
  if (!options)
    options = {};

  // Only print out the message if the lengths are different; the
  // expectation is that they are the same, so don't clutter up the
  // output.
  if (actual.length !== expected.length) {
    should(
        actual.length === expected.length,
        'Length of actual and expected buffers should match')
        .beTrue();
  }

  let maxError = -1;
  let diffCount = 0;
  let errorPosition = -1;
  let thresholdSNR = (options.thresholdSNR || 10000);

  let thresholdDiffULP = (options.thresholdDiffULP || 0);
  let thresholdDiffCount = (options.thresholdDiffCount || 0);

  // By default, the bit depth is 16.
  let bitDepth = (options.bitDepth || 16);
  let scaleFactor = Math.pow(2, bitDepth - 1);

  let noisePower = 0, signalPower = 0;

  for (let i = 0; i < actual.length; i++) {
    let diff = actual[i] - expected[i];
    noisePower += diff * diff;
    signalPower += expected[i] * expected[i];

    if (Math.abs(diff) > maxError) {
      maxError = Math.abs(diff);
      errorPosition = i;
    }

    // The reference file is a 16-bit WAV file, so we will almost never get
    // an exact match between it and the actual floating-point result.
    if (Math.abs(diff) > scaleFactor)
      diffCount++;
  }

  let snr = 10 * Math.log10(signalPower / noisePower);
  let maxErrorULP = maxError * scaleFactor;

  should(snr, 'SNR').beGreaterThanOrEqualTo(thresholdSNR);

  should(
      maxErrorULP,
      options.prefix + ': Maximum difference (in ulp units (' + bitDepth +
          '-bits))')
      .beLessThanOrEqualTo(thresholdDiffULP);

  should(diffCount, options.prefix + ': Number of differences between results')
      .beLessThanOrEqualTo(thresholdDiffCount);
}

// Create an impulse in a buffer of length sampleFrameLength
function createImpulseBuffer(context, sampleFrameLength) {
  let audioBuffer =
      context.createBuffer(1, sampleFrameLength, context.sampleRate);
  let n = audioBuffer.length;
  let dataL = audioBuffer.getChannelData(0);

  for (let k = 0; k < n; ++k) {
    dataL[k] = 0;
  }
  dataL[0] = 1;

  return audioBuffer;
}

// Create a buffer of the given length with a linear ramp having values 0 <= x <
// 1.
function createLinearRampBuffer(context, sampleFrameLength) {
  let audioBuffer =
      context.createBuffer(1, sampleFrameLength, context.sampleRate);
  let n = audioBuffer.length;
  let dataL = audioBuffer.getChannelData(0);

  for (let i = 0; i < n; ++i)
    dataL[i] = i / n;

  return audioBuffer;
}

// Create an AudioBuffer of length |sampleFrameLength| having a constant value
// |constantValue|. If |constantValue| is a number, the buffer has one channel
// filled with that value. If |constantValue| is an array, the buffer is created
// wit a number of channels equal to the length of the array, and channel k is
// filled with the k'th element of the |constantValue| array.
function createConstantBuffer(context, sampleFrameLength, constantValue) {
  let channels;
  let values;

  if (typeof constantValue === 'number') {
    channels = 1;
    values = [constantValue];
  } else {
    channels = constantValue.length;
    values = constantValue;
  }

  let audioBuffer =
      context.createBuffer(channels, sampleFrameLength, context.sampleRate);
  let n = audioBuffer.length;

  for (let c = 0; c < channels; ++c) {
    let data = audioBuffer.getChannelData(c);
    for (let i = 0; i < n; ++i)
      data[i] = values[c];
  }

  return audioBuffer;
}

// Create a stereo impulse in a buffer of length sampleFrameLength
function createStereoImpulseBuffer(context, sampleFrameLength) {
  let audioBuffer =
      context.createBuffer(2, sampleFrameLength, context.sampleRate);
  let n = audioBuffer.length;
  let dataL = audioBuffer.getChannelData(0);
  let dataR = audioBuffer.getChannelData(1);

  for (let k = 0; k < n; ++k) {
    dataL[k] = 0;
    dataR[k] = 0;
  }
  dataL[0] = 1;
  dataR[0] = 1;

  return audioBuffer;
}

// Convert time (in seconds) to sample frames.
function timeToSampleFrame(time, sampleRate) {
  return Math.floor(0.5 + time * sampleRate);
}

// Compute the number of sample frames consumed by noteGrainOn with
// the specified |grainOffset|, |duration|, and |sampleRate|.
function grainLengthInSampleFrames(grainOffset, duration, sampleRate) {
  let startFrame = timeToSampleFrame(grainOffset, sampleRate);
  let endFrame = timeToSampleFrame(grainOffset + duration, sampleRate);

  return endFrame - startFrame;
}

// True if the number is not an infinity or NaN
function isValidNumber(x) {
  return !isNaN(x) && (x != Infinity) && (x != -Infinity);
}

// Compute the (linear) signal-to-noise ratio between |actual| and
// |expected|.  The result is NOT in dB!  If the |actual| and
// |expected| have different lengths, the shorter length is used.
function computeSNR(actual, expected) {
  let signalPower = 0;
  let noisePower = 0;

  let length = Math.min(actual.length, expected.length);

  for (let k = 0; k < length; ++k) {
    let diff = actual[k] - expected[k];
    signalPower += expected[k] * expected[k];
    noisePower += diff * diff;
  }

  return signalPower / noisePower;
}
