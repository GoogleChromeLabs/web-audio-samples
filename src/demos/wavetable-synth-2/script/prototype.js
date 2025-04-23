import { KnobSimple } from '../ui-components/KnobSimple.js';
import { ToggleSimple } from '../ui-components/ToggleSimple.js';
import { MatrixSequence2D } from "../ui-components/MatrixSequence2D.js";

import { WavetableDataSet } from './WavetableDataSet.js';

import { GlobalEffect } from './GlobalEffect.js';
import { Sequencer } from './Sequencer.js';
import { Note } from './Note.js';

let isAudioStarted = false;
let ScheduleTaskId = null;

let globalEffect = null;
let sequencer = null;
let globalParams = {
  detune1: 4.5,
  detune2: -2.5,
  filterCutoff: 0.2,
  filterResonance: 6.0,
  filterAmount: 0.4,
  filterAttack: 0.056,
  filterDecay: 0.991,
  ampAttack: 0.056,
  ampDecay: 0.100,
  width: 0.6,
};

const handleTempoKnob = (event) => {
  if (event.type !== 'input' && event.type !== 'change') return;
  if (!event.detail.value) return;
  sequencer.setTempo(event.detail.value);
  globalEffect.setTempo(event.detail.value);
};

const handleSequnceDataChange = (event) => {
  sequencer.setSequenceData(event.target.getSequenceData());
};

const handleSynthParamChange = (event) => {
  if (event.type !== 'input' && event.type !== 'change') return;
  if (typeof event.detail.value === 'undefined') return;

  // Derive the parameter name from the element's ID
  // Assumes IDs like 'knob-filter-cutoff' map to 'filterCutoff'
  let paramName = event.target.id.replace('knob-', '');
  paramName = paramName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

  if (globalParams.hasOwnProperty(paramName)) {
    globalParams[paramName] = event.detail.value;
    console.log(`Set globalParams.${paramName} = ${globalParams[paramName]}`);
  } else {
    console.warn(`Unknown parameter: ${paramName} for element ID: ${event.target.id}`);
  }
};

const startAudio = async () => {
  const context = new AudioContext();
  globalEffect = new GlobalEffect(context);
  await globalEffect.initialize();
  sequencer = new Sequencer();

  const periodicWaveData1 = WavetableDataSet[22];
  const periodicWave1 = new PeriodicWave(context, {
    real: periodicWaveData1.real,
    imag: periodicWaveData1.imag,
  });
  const periodicWaveData2 = WavetableDataSet[15];
  const periodicWave2 = new PeriodicWave(context, {
    real: periodicWaveData2.real,
    imag: periodicWaveData2.imag,
  });

  const sequenceLoop = () => {
    sequencer.schedule({
      context,
      periodicWave1,
      periodicWave2,
      globalParams,
      destination: globalEffect.input
    });
    ScheduleTaskId = requestAnimationFrame(sequenceLoop);
  };

  requestAnimationFrame(sequenceLoop);
  isAudioStarted = true;
};

const initialize = async () => {
  const toggle1 = document.querySelector('#toggle-1');
  toggle1.addEventListener('change', (event) => {
    if (event.detail.state && !isAudioStarted) {
      startAudio();
    } else {
      cancelAnimationFrame(ScheduleTaskId);
      ScheduleTaskId = null;
    }
  });

  const knobTempo = document.querySelector('#knob-tempo');
  knobTempo.addEventListener('input', handleTempoKnob);
  knobTempo.addEventListener('change', handleTempoKnob);

  const knobDetune1 = document.querySelector("#knob-detune-1");
  const knobDetune2 = document.querySelector("#knob-detune-2");
  const knobFilterCutoff = document.querySelector("#knob-filter-cutoff");
  const knobFilterResonance = document.querySelector("#knob-filter-resonance");
  const knobFilterAmount = document.querySelector("#knob-filter-amount");
  const knobFilterAttack = document.querySelector("#knob-filter-attack");
  const knobFilterDecay = document.querySelector("#knob-filter-decay");
  const knobAmpAttack = document.querySelector("#knob-amp-attack");
  const knobAmpDecay = document.querySelector("#knob-amp-decay");
  const knobWidth = document.querySelector("#knob-width");
  const paramKnobs = [
    knobDetune1, knobDetune2, knobFilterCutoff, knobFilterResonance,
    knobFilterAmount, knobFilterAttack, knobFilterDecay, knobAmpAttack,
    knobAmpDecay, knobWidth
  ];
  
  paramKnobs.forEach((knob) => {
    if (knob) {
      knob.addEventListener('input', handleSynthParamChange);
      knob.addEventListener('change', handleSynthParamChange);

      // Initialize knob value from globalParams
      let paramName = knob.id.replace('knob-', '');
      paramName = paramName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      if (globalParams.hasOwnProperty(paramName)) {
        knob.value = globalParams[paramName];
      }

    } else {
      // Log a warning if a knob element wasn't found in the HTML
      console.warn(`Could not find knob element for one of the parameters.`);
    }
  });

  const matrix2D = document.querySelector('#matrix-2d-1');
  matrix2D.addEventListener('change', handleSequnceDataChange);
};

window.addEventListener('load', initialize);
