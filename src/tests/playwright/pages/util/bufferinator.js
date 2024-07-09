import { record } from "./recorder/recorder-main.js";

/**
 * Asynchronous function that buffers audio input for real-time or offline processing.
 *
 * @param {AudioContext | OfflineAudioContext} context - The AudioContext for buffering.
 * @param {number} length - The length of the buffer in seconds.
 * @param {Map<BaseAudioContext, Set<[AudioNode, AudioNode]>>} graph - The graph representing connected audio nodes.
 * @return {Promise<AudioBuffer>} Promise that resolves to the buffer of audio data.
 */
export const bufferinator = async (context, length, graph) => {
  if (context instanceof AudioContext) {
    const {recorder, bufferPromise} = await record(context, length);
    graph.get(context)?.forEach(([from, to]) => {
      if (to instanceof AudioDestinationNode) {
        from._webAudioDisconnect(to);
        from._webAudioConnect(recorder);
      }
    });

    recorder._webAudioConnect(context.destination);
    await context.resume();

    // for realtime
    return await bufferPromise;
  }

  // for offline
  return context.startRendering();
};
