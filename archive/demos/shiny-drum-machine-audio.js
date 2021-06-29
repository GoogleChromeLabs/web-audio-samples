/* eslint require-jsdoc: "off" */

import {INSTRUMENTS, freeze, clone} from './shiny-drum-machine-data.js';

const AudioContext = window.AudioContext ?? window.webkitAudioContext;

const context = new AudioContext();

const MAX_SWING = 0.08;
const LOOP_LENGTH = 16;
const VOLUMES = freeze([0, 0.3, 1]);


async function fetchAudio(url) {
  const response = await fetch(new Request(url));
  const responseBuffer = await response.arrayBuffer();

  // TODO(#226): Migrate to Promise-syntax once Safari supports it.
  return new Promise((resolve, reject) => {
    context.decodeAudioData(responseBuffer, resolve, reject);
  });
}

class Kit {
  constructor(id, prettyName, index) {
    this.id = id;
    this.prettyName = prettyName;
    this.index = index;
    this.buffer = {};
  }

  getSampleUrl(instrumentName) {
    return `sounds/drum-samples/${this.id}/${instrumentName.toLowerCase()}.wav`;
  }

  load() {
    const instrumentPromises = INSTRUMENTS.map(
        (instrument) => this.loadSample(instrument.name));
    const promise = Promise.all(instrumentPromises).then(() => null);
    // Return original Promise on subsequent load calls to avoid duplicate
    // loads.
    this.load = () => promise;
    return promise;
  }

  async loadSample(instrumentName) {
    this.buffer[instrumentName] = await fetchAudio(
        this.getSampleUrl(instrumentName));
  }
}


class Effect {
  constructor(data, index) {
    this.name = data.name;
    this.url = data.url;
    this.dryMix = data.dryMix;
    this.wetMix = data.wetMix;
    this.index = index;
    this.buffer = undefined;
  }

  async load() {
    // Return if buffer has been loaded already or there is nothing to load
    // ("No effect" instance).
    if (!this.url || this.buffer) {
      return;
    }

    this.buffer = await fetchAudio(this.url);
  }
}


class Beat {
  constructor(data, kits, effects) {
    this.kits = kits;
    this.effects = effects;
    this.loadObject(data);
  }

  loadObject(data) {
    this._data = Object.seal(clone(data));
    this._kit = this.kits[data.kitIndex];
    this._effect = this.effects[data.effectIndex];
  }

  toObject() {
    return clone(this._data);
  }

  set kit(kit) {
    this._kit = kit;
    this._data.kitIndex = kit.index;
  }

  get kit() {
    return this._kit;
  }

  set effect(effect) {
    this._effect = effect;
    this._data.effectIndex = effect.index;

    // Hack - if effect is turned all the way down - turn up effect slider.
    // ... since they just explicitly chose an effect from the list.
    if (this._data.effectMix == 0) {
      this._data.effectMix = 0.5;
    }

    // Hack - if the effect is meant to be entirely wet (not unprocessed signal)
    // then put the effect level all the way up.
    if (effect.dryMix == 0) {
      this._data.effectMix = 1;
    }
  }

  get effect() {
    return this._effect;
  }

  set effectMix(effectMix) {
    this._data.effectMix = effectMix;
  }

  get effectMix() {
    return this._data.effectMix;
  }

  setPitch(instrumentName, pitch) {
    this._data[`${instrumentName.toLowerCase()}PitchVal`] = pitch;
  }

  getPitch(instrumentName) {
    return this._data[`${instrumentName.toLowerCase()}PitchVal`];
  }

  getPlaybackRate(instrumentName) {
    const pitch = this.getPitch(instrumentName);
    return Math.pow(2.0, 2.0 * (pitch - 0.5));
  }

  set swingFactor(swingFactor) {
    this._data.swingFactor = swingFactor;
  }

  get swingFactor() {
    return this._data.swingFactor;
  }

  set tempo(tempo) {
    this._data.tempo = tempo;
  }

  get tempo() {
    return this._data.tempo;
  }

  getRhythm(instrumentName) {
    const index = 1 + INSTRUMENTS.findIndex((i) => i.name === instrumentName);
    return this._data[`rhythm${index}`];
  }

  toggleNote(instrumentName, rhythmIndex) {
    const notes = this.getRhythm(instrumentName);
    const note = (notes[rhythmIndex] + 1) % 3;
    notes[rhythmIndex] = note;
  }

  getNote(instrumentName, rhythmIndex) {
    const notes = this.getRhythm(instrumentName);
    return notes[rhythmIndex];
  }
}

class Player {
  constructor(beat, onNextBeat) {
    this.beat = beat;
    this.onNextBeat = onNextBeat;

    let finalMixNode;
    if (context.createDynamicsCompressor) {
      // Create a dynamics compressor to sweeten the overall mix.
      const compressor = context.createDynamicsCompressor();
      compressor.connect(context.destination);
      finalMixNode = compressor;
    } else {
      // No compressor available in this implementation.
      finalMixNode = context.destination;
    }

    // Create master volume.
    this.masterGainNode = context.createGain();
    // Reduce overall volume to avoid clipping.
    this.masterGainNode.gain.value = 0.7;
    this.masterGainNode.connect(finalMixNode);

    // Create effect volume.
    this.effectLevelNode = context.createGain();
    this.effectLevelNode.gain.value = 1.0; // effect level slider controls this
    this.effectLevelNode.connect(this.masterGainNode);

    // Create convolver for effect
    this.convolver = context.createConvolver();
    this.convolver.connect(this.effectLevelNode);
  }

  advanceNote() {
    // Advance time by a 16th note...
    const secondsPerBeat = 60.0 / this.beat.tempo;

    this.rhythmIndex = (this.rhythmIndex + 1) % LOOP_LENGTH;

    let increment = 0.25;
    const swing = MAX_SWING * this.beat.swingFactor;

    // apply swing
    if (this.rhythmIndex % 2) {
      increment += swing;
    } else {
      increment -= swing;
    }

    this.noteTime += increment * secondsPerBeat;
  }

  playNote(instrument, rhythmIndex) {
    this.playNoteAtTime(instrument, rhythmIndex, 0);
  }

  playNoteAtTime(instrument, rhythmIndex, noteTime) {
    const note = this.beat.getNote(instrument.name, rhythmIndex);

    if (!note) {
      return;
    }

    // Create the note
    const voice = context.createBufferSource();
    voice.buffer = this.beat.kit.buffer[instrument.name];
    voice.playbackRate.value = this.beat.getPlaybackRate(instrument.name);

    // Optionally, connect to a panner
    let finalNode;
    if (instrument.pan) {
      const panner = context.createPanner();
      // Pan according to sequence position.
      panner.setPosition(0.5 * rhythmIndex - 4, 0, -1);
      voice.connect(panner);
      finalNode = panner;
    } else {
      finalNode = voice;
    }

    // Connect to dry mix
    const dryGainNode = context.createGain();
    dryGainNode.gain.value =
        VOLUMES[note] * instrument.mainGain * this.beat.effect.dryMix;
    finalNode.connect(dryGainNode);
    dryGainNode.connect(this.masterGainNode);

    // Connect to wet mix
    const wetGainNode = context.createGain();
    wetGainNode.gain.value = instrument.sendGain;
    finalNode.connect(wetGainNode);
    wetGainNode.connect(this.convolver);

    voice.start(noteTime);
  }

  schedule() {
    let currentTime = context.currentTime;

    // The sequence starts at startTime, so normalize currentTime so that it's 0
    // at the start of the sequence.
    currentTime -= this.startTime;

    while (this.noteTime < currentTime + 0.200) {
      // Convert this.noteTime to context time.
      const contextPlayTime = this.noteTime + this.startTime;

      for (const instrument of INSTRUMENTS) {
        this.playNoteAtTime(instrument, this.rhythmIndex, contextPlayTime);
      }

      // Attempt to synchronize drawing time with sound
      if (this.noteTime != this.lastDrawTime) {
        this.lastDrawTime = this.noteTime;
        this.onNextBeat(this.rhythmIndex);
      }

      this.advanceNote();
    }

    this.timeoutId = setTimeout(() => this.schedule(), 0);
  }

  updateEffect() {
    this.convolver.buffer = this.beat.effect.buffer;

    // Factor in both the preset's effect level and the blending level
    // (effectWetMix) stored in the effect itself.
    this.effectLevelNode.gain.value =
        this.beat.effectMix * this.beat.effect.wetMix;
  }

  play() {
    this.noteTime = 0.0;
    this.startTime = context.currentTime + 0.005;
    this.rhythmIndex = 0;
    this.schedule();
  }

  stop() {
    clearTimeout(this.timeoutId);
    this.rhythmIndex = 0;
  }
}

export {Beat, Player, Effect, Kit, LOOP_LENGTH};
