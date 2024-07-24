/**
 * @fileoverview AudioWorklet Recorder Node to record raw PCM data from
 * Web Audio Graph.
 */

/**
 * Creates an AudioWorklet recorder node to record input for a specified
 * length of time (seconds). Passes audio through to output.
 * @param {AudioContext} context - The AudioContext to create the recorder node.
 * @param {number} recordDuration - The duration in seconds to record for.
 * @param {number} numberOfChannels - The number of channels to record.
 * Default is 1 channel.
 * @return {Object} An object containing:
 *   - {AudioWorkletNode} recorder: The recorder AudioWorkletNode.
 *   - {Promise<Float32Array[]>} recordingCompletePromise: A promise that
 * resolves to an array of Float32Arrays of each recorded channel.
 */
export const record = async (context, recordDuration, numberOfChannels = 1) => {
  console.assert(context instanceof AudioContext);
  console.assert(typeof recordDuration === 'number' && recordDuration > 0);

  const recorderBufferSize = recordDuration * context.sampleRate;

  await context.audioWorklet.addModule('./util/recorder/recorder-processor.js');

  const recorder = new AudioWorkletNode(context, 'test-recorder', {
    processorOptions: {
      numberOfSamples: recorderBufferSize,
      numberOfChannels,
    },
  });

  let resolveWithRecording;
  recorder.port.onmessage = (event) => {
    if (event.data.message === 'RECORD_DONE') {
      // Float32Array[] channels of recorded samples
      resolveWithRecording(event.data.channelData);
    }
  };

  const recordingCompletePromise = new Promise((resolve) => {
    resolveWithRecording = resolve;
  });

  return {recorder, recordingCompletePromise};
};
