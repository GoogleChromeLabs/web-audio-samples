/**
 * @license Copyright (c) 2016 Hongchan Choi. MIT License.
 * @fileOverview Canopy PCM wave file exporter.
 * @return {function} create link function
 */

function _writeStringToArray(aString, targetArray, offset) {
  for (let i = 0; i < aString.length; ++i) {
    targetArray[offset + i] = aString.charCodeAt(i);
  }
}

function _writeInt16ToArray(aNumber, targetArray, offset) {
  aNumber = Math.floor(aNumber);
  targetArray[offset + 0] = aNumber & 255; // byte 1
  targetArray[offset + 1] = (aNumber >> 8) & 255; // byte 2
}

function _writeInt32ToArray(aNumber, targetArray, offset) {
  aNumber = Math.floor(aNumber);
  targetArray[offset + 0] = aNumber & 255; // byte 1
  targetArray[offset + 1] = (aNumber >> 8) & 255; // byte 2
  targetArray[offset + 2] = (aNumber >> 16) & 255; // byte 3
  targetArray[offset + 3] = (aNumber >> 24) & 255; // byte 4
}

// Return the bits of the float as a 32-bit integer value.  This
// produces the raw bits; no intepretation of the value is done.
function _floatBits(f) {
  const buf = new ArrayBuffer(4);
  new Float32Array(buf)[0] = f;
  const bits = new Uint32Array(buf)[0];
  // Return as a signed integer.
  return bits | 0;
}

function _writeAudioArrayToArray(
    audioArray, targetArray, offset, bitDepth, options) {
  let index = 0;
  let channel = 0;
  const length = options.length;
  const channels = options.channels;
  let sample;

  // Clamping samples onto the 16-bit resolution.
  for (index = 0; index < length; ++index) {
    for (channel = 0; channel < channels; ++channel) {
      // Branches upon the requested bit depth
      if (bitDepth === 16) {
        sample = audioArray[index+channel] * 32768.0;
        if (sample < -32768) {
          sample = -32768;
        } else if (sample > 32767) {
          sample = 32767;
        }
        _writeInt16ToArray(sample, targetArray, offset);
        offset += 2;
      } else if (bitDepth === 32) {
        // This assumes we're going to out 32-float, not 32-bit linear.
        sample = _floatBits(audioArray[index+channel]);
        _writeInt32ToArray(sample, targetArray, offset);
        offset += 4;
      } else {
        console.log('Invalid bit depth for PCM encoding.');
        return;
      }
    }
  }
}

/**
 * [createWaveFileBlobFromAudioBuffer description]
 * @param  {Float32Array} audioBuffer
 * @param  {object} options Information about the buffer.
 * @param {number} options.sampleRate Sample rate of the buffer.
 * @param {number} options.numberOfChannels
 *    Number of channels interleaved in the buffer.
 * @param {number} options.recordingLength Length of the recording, in frames.
 * @param {boolean} options.as32BitFloat
 *    Whether the buffer is of 32bit Float values or otherwise.
 * @return {Blob} Resulting binary blob.
 */
function _createWaveFileBlobFromAudioBuffer(audioBuffer, options) {
  // Encoding setup.
  const frameLength = options.length;
  const numberOfChannels = options.channels;
  const sampleRate = options.sampleRate;
  const bitsPerSample = options.as32BitFloat ? 32 : 16;
  const bytesPerSample = bitsPerSample / 8;
  const byteRate = (sampleRate * numberOfChannels * bitsPerSample) / 8;
  const blockAlign = (numberOfChannels * bitsPerSample) / 8;
  const wavDataByteLength = frameLength * numberOfChannels * bytesPerSample;
  const headerByteLength = 44;
  const totalLength = headerByteLength + wavDataByteLength;
  const waveFileData = new Uint8Array(totalLength);
  const subChunk1Size = 16;
  const subChunk2Size = wavDataByteLength;
  const chunkSize = 4 + (8 + subChunk1Size) + (8 + subChunk2Size);

  _writeStringToArray('RIFF', waveFileData, 0);
  _writeInt32ToArray(chunkSize, waveFileData, 4);
  _writeStringToArray('WAVE', waveFileData, 8);
  _writeStringToArray('fmt ', waveFileData, 12);

  // SubChunk1Size (4)
  _writeInt32ToArray(subChunk1Size, waveFileData, 16);
  // AudioFormat (2): 3 means 32-bit float, 1 means integer PCM.
  _writeInt16ToArray(options.as32BitFloat ? 3 : 1, waveFileData, 20);
  // NumChannels (2)
  _writeInt16ToArray(numberOfChannels, waveFileData, 22);
  // SampleRate (4)
  _writeInt32ToArray(sampleRate, waveFileData, 24);
  // ByteRate (4)
  _writeInt32ToArray(byteRate, waveFileData, 28);
  // BlockAlign (2)
  _writeInt16ToArray(blockAlign, waveFileData, 32);
  // BitsPerSample (4)
  _writeInt32ToArray(bitsPerSample, waveFileData, 34);
  _writeStringToArray('data', waveFileData, 36);
  // SubChunk2Size (4)
  _writeInt32ToArray(subChunk2Size, waveFileData, 40);

  // Write actual audio data starting at offset 44.
  _writeAudioArrayToArray(
      audioBuffer, waveFileData, 44, bitsPerSample, options);

  return new Blob([waveFileData], {
    type: 'audio/wave',
  });
}

/**
 * [createLinkFromAudioBuffer description]
 * @param  {[type]} audioBuffer   [description]
 * @param  {object} options Information about the buffer.
 * @param {number} options.sampleRate Sample rate of the buffer.
 * @param {number} options.numberOfChannels
 *    Number of channels interleaved in the buffer.
 * @param {number} options.recordingLength Length of the recording, in frames.
 * @param {boolean} options.as32BitFloat
 *    Whether the buffer is of 32bit Float values or otherwise.
 * @return {String} file url
 */
function createLinkFromAudioBuffer(audioBuffer, options) {
  const blob = _createWaveFileBlobFromAudioBuffer(audioBuffer, options);
  return window.URL.createObjectURL(blob);
}

export default createLinkFromAudioBuffer;
