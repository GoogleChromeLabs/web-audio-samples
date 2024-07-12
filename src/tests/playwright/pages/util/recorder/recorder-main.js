/**
 * @fileoverview AudioWorklet Recorder Node to record raw PCM data from
 * Web Audio Graph.
 */

/**
 * Creates an AudioWorklet recorder node to record input for a specified
 * length of time (seconds). Passes audio through to output.
 * @param {AudioContext} context - The AudioContext to create the recorder node.
 * @param {number} recordLength - The length in seconds to record for.
 * @return {Object} An object containing:
 *   - {AudioWorkletNode} recorder: The recorder AudioWorkletNode.
 *   - {Promise<AudioBuffer>} bufferPromise: A promise that resolves to an
 *   AudioBuffer once filled.
 */
export const record = async (context, recordLength) => {
  console.assert(context instanceof AudioContext);
  console.assert(typeof recordLength === 'number' && recordLength > 0);

  const recorderBufferSize = recordLength * context.sampleRate;

  let recorder;

  try {
    recorder = new AudioWorkletNode(context, 'test-recorder', {
      processorOptions: {
        numberOfSamples: recorderBufferSize,
      },
    });
  } catch {
    await context.audioWorklet.addModule('./util/recorder/recorder-processor.js');

    recorder = new AudioWorkletNode(context, 'test-recorder', {
      processorOptions: {
        numberOfSamples: recorderBufferSize,
      },
    });
  }

  let resolveWithRecording;
  recorder.port.onmessage = (event) => {
    if (event.data.message === 'RECORD_DONE') {
      const {channelData} = event.data;
      const audioBuffer = new AudioBuffer({
        length: recorderBufferSize,
        sampleRate: context.sampleRate,
        numberOfChannels: channelData.length,
      });
      channelData.forEach((array, i) => audioBuffer.copyToChannel(array, i));

      resolveWithRecording(audioBuffer);
    }
  };

  const bufferPromise = new Promise((resolve) => {
    resolveWithRecording = resolve;
  });

  return {recorder, bufferPromise};
};
