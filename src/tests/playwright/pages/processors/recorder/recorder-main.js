/**
 * @fileoverview AudioWorklet Recorder Node to record raw PCM data from 
 * Web Audio Graph. 
 */

/**
 * Creates an AudioWorklet recorder node to record input for a specified 
 * length of time (seconds). Passes audio through to output. 
 * @param {AudioContext} context - The AudioContext to create the recorder node.
 * @param {number} recordLength - The length in seconds to record for.
 * @returns {Object} An object containing:
 *   - {AudioWorkletNode} recorder: The recorder AudioWorkletNode.
 *   - {Promise<AudioBuffer>} bufferPromise: A promise that resolves to an AudioBuffer once filled.
 */
export const record = async (context, recordLength) => {
  console.assert(context instanceof AudioContext);
  console.assert(typeof recordLength === 'number' && recordLength > 0);

  const maxSamples = recordLength * context.sampleRate;

  await context.audioWorklet.addModule('./processors/recorder/recorder-processor.js');

  const recorder = new AudioWorkletNode(context, 'recorder', {
    processorOptions: {
      maxSamples
    }
  });

  let bufferResolve;
  recorder.port.onmessage = (e) => {
    if (e.data.message === 'RECORD_DONE') {
      const channelBuffers = e.data.buffer;
      const audioBuffer = new AudioBuffer({
        length: maxSamples,
        sampleRate: context.sampleRate,
        numberOfChannels: channelBuffers.length
      })
      channelBuffers.forEach((array, i) => audioBuffer.copyToChannel(array, i));

      bufferResolve(audioBuffer)
    }
  };

  const bufferPromise = new Promise((resolve) => {
    bufferResolve = resolve;
  });

  return {recorder, bufferPromise};
};
