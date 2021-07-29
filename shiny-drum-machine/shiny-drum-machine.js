/* eslint require-jsdoc: "off" */

import {RESET_BEAT, DEMO_BEATS, INSTRUMENTS, KIT_DATA,
  IMPULSE_RESPONSE_DATA} from './shiny-drum-machine-data.js';

import {DemoButtons, EffectPicker, KitPicker, EffectSlider, SwingSlider,
  PitchSliders, TempoInput, Playheads, Notes, SaveButton, LoadButton,
  ResetButton, PlayButton, FileDropZone} from './shiny-drum-machine-ui.js';

import {Beat, Player, Kit, Effect} from './shiny-drum-machine-audio.js';


// Events
// init() once the page has finished loading.
window.onload = init;

const MIN_TEMPO = 50;
const MAX_TEMPO = 180;

let theBeat;
let player;
const KITS = [];
const EFFECTS = [];

const ui = Object.seal({
  effectPicker: null,
  kitPicker: null,
  demoButtons: null,
  swingSlider: null,
  effectSlider: null,
  pitchSliders: null,
  tempoInput: null,
  notes: null,
  playButton: null,
  resetButton: null,
  playheads: null,
  saveButton: null,
  loadButton: null,
  fileDropZone: null,
});

function loadAssets() {
  // Any assets which have previously started loading will be skipped over.
  for (const kit of KITS) {
    kit.load();
  }

  for (const effect of EFFECTS) {
    effect.load();
  }
}

function loadDemos(onDemoLoaded) {
  for (let demoIndex = 0; demoIndex < 5; demoIndex++) {
    const demo = DEMO_BEATS[demoIndex];
    const effect = EFFECTS[demo.effectIndex];
    const kit = KITS[demo.kitIndex];

    Promise.all([
      effect.load(),
      kit.load(),
    ]).then(() => onDemoLoaded(demoIndex));
  }
}

// This gets rid of the loading spinner in each of the demo buttons.
function onDemoLoaded(demoIndex) {
  ui.demoButtons.markDemoAvailable(demoIndex);

  // Enable play button and assign it to demo 2.
  if (demoIndex == 1) {
    // This gets rid of the loading spinner on the play button.
    ui.playButton.state = 'stopped';
    loadBeat(DEMO_BEATS[1]);
  }
}

function init() {
  EFFECTS.push(...IMPULSE_RESPONSE_DATA.map(
      (data, i) => new Effect(data, i)));

  KITS.push(...KIT_DATA.map(({id, name}, i) => new Kit(id, name, i)));

  theBeat = new Beat(RESET_BEAT, KITS, EFFECTS);

  player = new Player(theBeat, onNextBeat);

  initControls();

  // Start loading the assets used by the presets first, in order of the
  // presets. The callback gets rid of the loading spinner in each of the demo
  // buttons.
  loadDemos(onDemoLoaded);

  // Then load the remaining assets.
  loadAssets();

  updateControls();
}

function initControls() {
  // Initialize note buttons
  ui.notes = new Notes();
  ui.notes.onClick = (instrumentName, rhythm) => handleNoteClick(
      instrumentName, rhythm);

  ui.kitPicker = new KitPicker();
  ui.kitPicker.addOptions(KITS.map((kit) => kit.prettyName));
  ui.kitPicker.onSelect = (i) => {
    theBeat.kit = KITS[i];
  };

  ui.effectPicker = new EffectPicker();
  ui.effectPicker.addOptions(EFFECTS.map((e) => e.name));
  ui.effectPicker.onSelect = (i) => {
    setEffect(i);
  };

  ui.effectSlider = new EffectSlider();
  ui.effectSlider.onchange = (value) => {
    // Change the volume of the convolution effect.
    theBeat.effectMix = value;
    player.updateEffect();
  };

  ui.swingSlider = new SwingSlider();
  ui.swingSlider.onchange = (value) => {
    theBeat.swingFactor = value;
  };

  ui.pitchSliders = new PitchSliders();
  ui.pitchSliders.onPitchChange = (instrumentName, pitch) => theBeat.setPitch(
      instrumentName, pitch);

  ui.playButton = new PlayButton();
  ui.playButton.onclick = () => {
    if (ui.playButton.state === 'playing') {
      handleStop();
    } else if (ui.playButton.state === 'stopped') {
      handlePlay();
    }
  };

  ui.saveButton = new SaveButton(() => JSON.stringify(theBeat.toObject()));

  const onLoad = (data) => {
    loadBeat(JSON.parse(data));
  };
  ui.loadButton = new LoadButton(onLoad);
  ui.fileDropZone = new FileDropZone(onLoad);

  ui.resetButton = new ResetButton();
  ui.resetButton.onclick = () => {
    loadBeat(RESET_BEAT);
  };

  ui.demoButtons = new DemoButtons();
  ui.demoButtons.onDemoClick = (demoIndex) => {
    loadBeat(DEMO_BEATS[demoIndex]);
    handlePlay();
  };

  ui.tempoInput = new TempoInput({min: MIN_TEMPO, max: MAX_TEMPO, step: 4});
  ui.tempoInput.onTempoChange = (tempo) => {
    theBeat.tempo = tempo;
  };

  ui.playheads = new Playheads();
}

function handleNoteClick(instrumentName, rhythmIndex) {
  theBeat.toggleNote(instrumentName, rhythmIndex);

  ui.notes.setNote(instrumentName, rhythmIndex,
      theBeat.getNote(instrumentName, rhythmIndex));

  const instrument = INSTRUMENTS.find((instr) => instr.name === instrumentName);
  player.playNote(instrument, rhythmIndex);
}

async function setEffect(index) {
  const effect = EFFECTS[index];
  await effect.load();

  theBeat.effect = effect;
  player.updateEffect();
  updateControls();
}

function handlePlay() {
  player.play();
  ui.playButton.state = 'playing';
}

function handleStop() {
  player.stop();
  ui.playheads.off();
  ui.playButton.state = 'stopped';
}

function loadBeat(beat) {
  handleStop();
  theBeat.loadObject(beat);
  player.updateEffect();
  updateControls();
}

function onNextBeat(rhythmIndex) {
  ui.playheads.drawPlayhead(rhythmIndex);
}

function updateControls() {
  for (const instrument of INSTRUMENTS) {
    theBeat.getNotes(instrument.name).forEach((note, i) => {
      ui.notes.setNote(instrument.name, i, note);
    });
  }

  ui.kitPicker.select(theBeat.kit.index);
  ui.effectPicker.select(theBeat.effect.index);
  ui.tempoInput.value = theBeat.tempo;
  ui.effectSlider.value = theBeat.effectMix;
  ui.swingSlider.value = theBeat.swingFactor;

  for (const instrument of INSTRUMENTS) {
    ui.pitchSliders.setPitch(instrument.name,
        theBeat.getPitch(instrument.name));
  }
}
