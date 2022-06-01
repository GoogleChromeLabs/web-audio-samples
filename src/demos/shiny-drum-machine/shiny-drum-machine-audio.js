/* eslint require-jsdoc: "off" */

import {INSTRUMENTS, freeze, clone} from './shiny-drum-machine-data.js';

const context = new AudioContext();

const LOOP_LENGTH = 16;
const BEATS_PER_FULL_NOTE = 4;
const VOLUMES = freeze([0, 0.3, 1]);


async function fetchAndDecodeAudio(url) {
  const response = await fetch(url);
  const responseBuffer = await response.arrayBuffer();
  return await context.decodeAudioData(responseBuffer);
}

class Kit {
  constructor(id, prettyName, index) {
    this.id = id;
    this.prettyName = prettyName;
    this.index = index;
    this.buffer = {};
  }

  getSampleUrl(instrumentName) {
    return `../../sounds/drum-samples/${this.id}/${
      instrumentName.toLowerCase()}.wav`;
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
    this.buffer[instrumentName] = await fetchAndDecodeAudio(
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

    this.buffer = await fetchAndDecodeAudio(`../../sounds/${this.url}`);
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

    // If the user chooses a new effect from the dropdown after having turned
    // the dry/wet effect slider to 0, reset the effect wetness to 0.5 to make
    // sure that the user hears the new effect.
    if (this._data.effectMix == 0) {
      this._data.effectMix = 0.5;
    }

    // If the effect is meant to be entirely wet (no unprocessed signal) then
    // put the effect level all the way up.
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

  getNotes(instrumentName) {
    const index = 1 + INSTRUMENTS.findIndex((i) => i.name === instrumentName);
    return this._data[`rhythm${index}`];
  }

  toggleNote(instrumentName, rhythmIndex) {
    const notes = this.getNotes(instrumentName);
    const note = (notes[rhythmIndex] + 1) % 3;
    notes[rhythmIndex] = note;
  }

  getNote(instrumentName, rhythmIndex) {
    const notes = this.getNotes(instrumentName);
    return notes[rhythmIndex];
  }
}

class Player {
  constructor(beat, onNextBeat) {
    this.beat = beat;
    this.onNextBeat = onNextBeat;

    // Create a dynamics compressor to sweeten the overall mix.
    const compressor = new DynamicsCompressorNode(context);
    compressor.connect(context.destination);

    // Create master volume and reduce overall volume to avoid clipping.
    this.masterGainNode = new GainNode(context, {gain: 0.7});
    this.masterGainNode.connect(compressor);

    // Create effect volume controlled by effect sliders.
    this.effectLevelNode = new GainNode(context, {gain: 1.0});
    this.effectLevelNode.connect(this.masterGainNode);

    // Create convolver for effect
    this.convolver = new ConvolverNode(context);
    this.convolver.connect(this.effectLevelNode);
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
    const voice = new AudioBufferSourceNode(context, {
      buffer: this.beat.kit.buffer[instrument.name],
      playbackRate: this.beat.getPlaybackRate(instrument.name),
    });

    let finalNode = voice;

    // Optionally, connect to a panner.
    if (instrument.pan) {
      // Pan according to sequence position.
      const panner = new PannerNode(context,
          {positionX: 0.5 * rhythmIndex - 4, positionY: 0, positionZ: -1});
      finalNode.connect(panner);
      finalNode = panner;
    }

    // Connect to dry mix
    const dryGainNode = new GainNode(context,
        {gain: VOLUMES[note] * instrument.mainGain * this.beat.effect.dryMix});
    finalNode.connect(dryGainNode);
    dryGainNode.connect(this.masterGainNode);

    // Connect to wet mix
    const wetGainNode = new GainNode(context, {gain: instrument.sendGain});
    finalNode.connect(wetGainNode);
    wetGainNode.connect(this.convolver);

    voice.start(noteTime);
  }

  // Call when beat `n` is played to schedule beat `n+1`.
  tick() {
    // tick() is called when beat `n` is played. At this time, call the
    // onNextBeat callback to highlight the currently audible beat in the UI.
    this.onNextBeat(this.rhythmIndex);

    // Then, increase rhythmIndex and nextBeatAt for beat `n+1`.
    this.advanceBeat();

    // Schedule notes to be played at beat `n+1`.
    for (const instrument of INSTRUMENTS) {
      this.playNoteAtTime(instrument, this.rhythmIndex, this.nextBeatAt);
    }

    // Finally, call tick() again at the time when beat `n+1` is played.
    this.timeoutId = setTimeout(
        () => this.tick(),
        (this.nextBeatAt - context.currentTime) * 1000,
    );
  }

  advanceBeat() {
    // Convert configured beats per minute to delay per tick.
    const secondsPerBeat = 60.0 / this.beat.tempo / BEATS_PER_FULL_NOTE;
    const swingDirection = (this.rhythmIndex % 2) ? -1 : 1;
    const swing = (this.beat.swingFactor / 3) * swingDirection;

    this.nextBeatAt += (1 + swing) * secondsPerBeat;
    this.rhythmIndex = (this.rhythmIndex + 1) % LOOP_LENGTH;
  }

  updateEffect() {
    this.convolver.buffer = this.beat.effect.buffer;

    // Factor in both the preset's effect level and the blending level
    // (effectWetMix) stored in the effect itself.
    this.effectLevelNode.gain.value =
        this.beat.effectMix * this.beat.effect.wetMix;
  }

  play() {
    // Ensure that initial notes are played at once by scheduling the playback
    // slightly in the future.
    this.nextBeatAt = context.currentTime + 0.05;
    this.rhythmIndex = 0;

    for (const instrument of INSTRUMENTS) {
      this.playNote(instrument, this.rhythmIndex, this.nextBeatAt);
    }

    this.tick();
  }

  stop() {
    clearTimeout(this.timeoutId);
  }
}

export {Beat, Player, Effect, Kit};
