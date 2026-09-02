/**
 * @license Copyright (c) 2016 Hongchan Choi. MIT License.
 * @fileOverview PCM Wave file exporter helper.
 */

function writeStringToArray(aString, targetArray, offset) {
  for (let i = 0; i < aString.length; ++i) {
    targetArray[offset + i] = aString.charCodeAt(i);
  }
}

function writeInt16ToArray(aNumber, targetArray, offset) {
  const n = Math.floor(aNumber);
  targetArray[offset + 0] = n & 255;
  targetArray[offset + 1] = (n >> 8) & 255;
}

function writeInt32ToArray(aNumber, targetArray, offset) {
  const n = Math.floor(aNumber);
  targetArray[offset + 0] = n & 255;
  targetArray[offset + 1] = (n >> 8) & 255;
  targetArray[offset + 2] = (n >> 16) & 255;
  targetArray[offset + 3] = (n >> 24) & 255;
}

function floatBits(f) {
  const buf = new ArrayBuffer(4);
  new Float32Array(buf)[0] = f;
  return new Uint32Array(buf)[0] | 0;
}

function writeAudioBufferToArray(
  audioBuffer,
  targetArray,
  offset,
  bitDepth
) {
  const length = audioBuffer.length;
  const channels = audioBuffer.numberOfChannels;
  let currentOffset = offset;

  for (let i = 0; i < length; ++i) {
    for (let ch = 0; ch < channels; ++ch) {
      const channelData = audioBuffer.getChannelData(ch);

      if (bitDepth === 16) {
        let sample = channelData[i] * 32768.0;
        if (sample < -32768) sample = -32768;
        if (sample > 32767) sample = 32767;
        writeInt16ToArray(sample, targetArray, currentOffset);
        currentOffset += 2;
      } else if (bitDepth === 32) {
        const sample = floatBits(channelData[i]);
        writeInt32ToArray(sample, targetArray, currentOffset);
        currentOffset += 4;
      }
    }
  }
}

function createWaveFileBlob(audioBuffer, as32BitFloat = false) {
  const frameLength = audioBuffer.length;
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const bitsPerSample = as32BitFloat ? 32 : 16;
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

  writeStringToArray('RIFF', waveFileData, 0);
  writeInt32ToArray(chunkSize, waveFileData, 4);
  writeStringToArray('WAVE', waveFileData, 8);
  writeStringToArray('fmt ', waveFileData, 12);

  writeInt32ToArray(subChunk1Size, waveFileData, 16);
  // AudioFormat: 3 = 32-bit float, 1 = integer PCM
  writeInt16ToArray(as32BitFloat ? 3 : 1, waveFileData, 20);
  writeInt16ToArray(numberOfChannels, waveFileData, 22);
  writeInt32ToArray(sampleRate, waveFileData, 24);
  writeInt32ToArray(byteRate, waveFileData, 28);
  writeInt16ToArray(blockAlign, waveFileData, 32);
  writeInt16ToArray(bitsPerSample, waveFileData, 34);
  writeStringToArray('data', waveFileData, 36);
  writeInt32ToArray(subChunk2Size, waveFileData, 40);

  writeAudioBufferToArray(audioBuffer, waveFileData, 44, bitsPerSample);

  return new Blob([waveFileData], { type: 'audio/wav' });
}

export function createLinkFromAudioBuffer(audioBuffer, as32BitFloat = false) {
  const blob = createWaveFileBlob(audioBuffer, as32BitFloat);
  return window.URL.createObjectURL(blob);
}

export default createLinkFromAudioBuffer;
