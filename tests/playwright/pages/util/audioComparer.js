import { bufferinator } from './bufferinator.js';
import { createGraphCache } from './graph.js';

const SAMPLE_RATE = 48000;
const NUM_CHANNELS = 1;

// CREATE DSP GRAPH HERE!!!
const createGraph = ctx => {
    // My Graph
    const osc = new OscillatorNode(ctx);
    osc.type = 'sawtooth';
    const gain = new GainNode(ctx);
    gain.gain.value = 2.2;
    const biq = new BiquadFilterNode(ctx);
    biq.type = 'bandpass';
    biq.frequency.value = 1000;
    biq.Q.value = 10;
    osc.connect(gain).connect(biq).connect(ctx.destination);

    // My render time
    const length = 1;

    osc.start();
    osc.stop(ctx.currentTime + length);
}

/**
 * Compares two audio buffers for equality.
 * @param {AudioBuffer} myBuf 
 * @param {AudioBuffer} refBuf 
 * @returns {number} returns the percentage of samples that are equal
 */
function bufferComparer(myBuf, refBuf) {
    let numCorrect = 0;
    const numChannels = myBuf.numberOfChannels;
    for (let c = 0; c < numChannels; c++) {
        const myChannel = myBuf.getChannelData(c);
        const refChannel = refBuf.getChannelData(c);
        console.log(myChannel.length, refChannel.length)
        for (let i = 0; i < myChannel.length; i++) {
            if (myChannel[i] === refChannel[i]) {
                numCorrect++;
            }
        }
    }
    return numCorrect / (numChannels * myBuf.length);
}

/**
 * Takes in an dsp graph to build for realtime and offline context + length of buffer to render.
 * Records output of both contexts as audio buffers.
 * Compares the real time buffer and the offline buffer for equality.
 * @param {(ctx: AudioContext) => void} ctxGraph dsp graph to build in context
 * @param {number} length length of buffer to render in seconds
 * @returns {boolean} true if buffers are equal
 */
async function evaluateGraph(ctxGraph, length = 1) {
    const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
    audioContext.suspend();
    const offlineAudioContext = new OfflineAudioContext({
        numberOfChannels: NUM_CHANNELS,
        length: length * SAMPLE_RATE,
        sampleRate: SAMPLE_RATE
    });

    // create ctxGraph cache
    const cache = createGraphCache();

    // create realtime and offline graphs
    ctxGraph(audioContext);
    ctxGraph(offlineAudioContext);

    // render graphs to audio buffer
    const realtimeBuffer = await bufferinator(audioContext, length, cache)
    const offlineBuffer = await bufferinator(offlineAudioContext)

    const score = bufferComparer(realtimeBuffer, offlineBuffer);

    return score;
}

console.log(await evaluateGraph(createGraph, 1));