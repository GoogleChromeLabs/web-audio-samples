import { BPMDelay } from './BPMDelay.js';
import { WaveShaper } from './WaveShaper.js';

/**
 * Loads an impulse response audio file using fetch() and Promises.
 *
 * @param {AudioContext} audioContext - The Web Audio API AudioContext.
 * @param {string} url - The URL of the impulse response audio file.
 * @returns {Promise<AudioBuffer>} A Promise that resolves with a decoded
 *   AudioBUffer when the impulse response is successfully loaded and set, or
 *   rejects on error.
 */
const loadImpulseResponse = async (context, url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status} while fetching ${url}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log(`Successfully fetched ${url}, received ${arrayBuffer.byteLength} bytes.`);
    console.log(`Decoding audio data for ${url}...`);
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    console.log(`Successfully decoded audio data for ${url}.`);
    console.log(`Impulse response ${url} loaded and assigned to convolver.`);
    return audioBuffer;
  } catch (error) {
    console.error("Error loading or decoding impulse response:", error);
    throw error;
  }
};

export class GlobalEffect {

  constructor(context) {
    this.context = context;
    this.compressor = new DynamicsCompressorNode(context);
    this.convolver = new ConvolverNode(context);
    this.convolverDry = new GainNode(context);
    this.convolverWet = new GainNode(context);    
    this.delayFeedback = new GainNode(context);
    this.delayDry = new GainNode(context);
    this.delayWet = new GainNode(context);
    this.waveShaper = new WaveShaperNode(context);
    this.subsonicFilter =
        new BiquadFilterNode(context, {type:'highpass', frequency: 20})

    // TODO
    this.bpmDelay = new BPMDelay(context);
    this.delayWaveShaper = new WaveShaper(context);
    this.grungeWaveShaper = new WaveShaper(context);
    
    this.compressor.connect(this.context.destination);

    this.convolver.connect(this.compressor)
    this.convolverDry.connect(this.compressor);
    this.convolverWet.connect(this.convolver);

    this.delayDry.connect(this.compressor);
    this.bpmDelay.node.connect(this.delayWet);
    this.delayWet.connect(this.compressor);

    this.bpmDelay.node.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayWaveShaper.input);
    this.delayWaveShaper.output.connect(this.bpmDelay.node);

    this.grungeWaveShaper.output.connect(this.delayDry);
    this.grungeWaveShaper.output.connect(this.bpmDelay.node);

    this.grungeWaveShaper.output.connect(this.convolverDry);
    this.grungeWaveShaper.output.connect(this.convolverWet);
    this.subsonicFilter.connect(this.grungeWaveShaper.input);
    this.subsonicFilter.connect(this.convolverDry);
    this.subsonicFilter.connect(this.convolverWet);

    this.setDelayDryWet(0.2);
    this.setDelayFeedback(0.5);
    this.setReverbDryWet(0.05);
  }

  async initialize() {
    const irBuffer = await loadImpulseResponse(
        this.context, './sound/matrix-reverb6.wav');
    this.convolver.buffer = irBuffer;
  }

  setDelayDryWet(value) {
    const mix = Math.max(0, Math.min(1, value));
    this.delayDry.gain.setValueAtTime(
        Math.cos(mix * Math.PI / 2), this.context.currentTime);
    this.delayWet.gain.setValueAtTime(
        Math.sin(mix * Math.PI / 2), this.context.currentTime);
  }

  setReverbDryWet(value) {
    const mix = Math.max(0, Math.min(1, value));
    this.convolverDry.gain.setValueAtTime(
        Math.cos(mix * Math.PI / 2), this.context.currentTime);
    this.convolverWet.gain.setValueAtTime(
        Math.sin(mix * Math.PI / 2), this.context.currentTime);
  }

  setDelayFeedback(value) {
    const feedbackGain = Math.max(0, Math.min(0.999, value));
    this.delayFeedback.gain.setValueAtTime(
        feedbackGain, this.context.currentTime);
  }

  setDelayGrunge(driveDb) {
    this.delayWaveShaper.setDrive(Math.pow(10, 0.05 * driveDb));
  }

  setMainGrunge(driveDb) {
    this.grungeWaveShaper.setDrive(Math.pow(10, 0.05 * driveDb));
  }

  setTempo(tempo) {
    this.bpmDelay.setTempo(tempo);
  }

  get input() {
    return this.subsonicFilter;
  }
};