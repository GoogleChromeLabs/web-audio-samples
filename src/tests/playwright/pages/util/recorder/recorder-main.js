/**
 * @fileoverview AudioWorklet Recorder Node to record raw PCM data from
 * Web Audio Graph.
 */

/**
 * Creates an AudioWorklet recorder node to record input for a specified
 * length of time (seconds). Passes audio through to output.
 * @param {AudioContext} context - The AudioContext to create the recorder node.
 * @param {number} recordDuration - The duration in seconds to record for.
 * @return {Object} An object containing:
 *   - {AudioWorkletNode} recorder: The recorder AudioWorkletNode.
 *   - {Promise<Array<Float32Array>>} recordingCompletePromise: A promise that 
 * resolves to an array of float32Arrays of each recorded channel.
 */
export const record = async (context, recordDuration) => {
  console.assert(context instanceof AudioContext);
  console.assert(typeof recordDuration === 'number' && recordDuration > 0);

  const recorderBufferSize = recordDuration * context.sampleRate;

  let recorder;

  await context.audioWorklet.addModule('./util/recorder/recorder-processor.js');

  recorder = new AudioWorkletNode(context, 'test-recorder', {
    processorOptions: {
      numberOfSamples: recorderBufferSize,
    },
  });

  let resolveWithRecording;
  recorder.port.onmessage = (event) => {
    if (event.data.message === 'RECORD_DONE') {
      // Array<Float32Array> channels of recorded samples
      resolveWithRecording(event.data.channelData);
    }
  };

  const recordingCompletePromise = new Promise((resolve) => {
    resolveWithRecording = resolve;
  });

  return {recorder, recordingCompletePromise};
};
