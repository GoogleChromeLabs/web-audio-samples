import {bufferinator} from './bufferinator.js';
import {createGraphCache} from './graph.js';

const SAMPLE_RATE = 48000;
const NUM_CHANNELS = 1;

/**
 * Compares two audio buffers for equality
 * @param {AudioBuffer} myBuf
 * @param {AudioBuffer} refBuf
 * @return {number} percentage of samples that are equal
 */
function bufferCompare(myBuf, refBuf) {
  let numberOfAcceptableSamples = 0;
  const numChannels = myBuf.numberOfChannels;
  for (let c = 0; c < numChannels; c++) {
    const myChannel = myBuf.getChannelData(c);
    const refChannel = refBuf.getChannelData(c);
    console.log('recorded', myChannel.length, '| reference', refChannel.length);
    for (let i = 0; i < myChannel.length; i++) {
      numberOfAcceptableSamples += myChannel[i] === refChannel[i];
    }
  }
  return numberOfAcceptableSamples / (numChannels * myBuf.length);
}

// eslint-disable-next-line valid-jsdoc
/**
 * Evaluate dsp graph comparing output buffer from realtime and offline context
 * @param {(context: AudioContext) => void} contextGraph dsp graph to build
 * @param {number?} renderLength renderLength of buffer to render in seconds
 * @returns {Promise<number>} % match of buffers
 */
export async function evaluateGraph(contextGraph, renderLength = 1) {
  const audioContext = new AudioContext({sampleRate: SAMPLE_RATE});
  await audioContext.suspend();
  const offlineAudioContext = new OfflineAudioContext({
    numberOfChannels: NUM_CHANNELS,
    length: renderLength * SAMPLE_RATE,
    sampleRate: SAMPLE_RATE,
  });

  // create contextGraph cache
  const cache = createGraphCache();

  // create realtime and offline graphs
  contextGraph(audioContext);
  contextGraph(offlineAudioContext);

  // render graphs to audio buffer
  const offlineBuffer = await bufferinator(offlineAudioContext);
  const realtimeBuffer = await bufferinator(audioContext, renderLength, cache);

  const score = bufferCompare(realtimeBuffer, offlineBuffer);
  console.info('% match', score);

  return score;
}
