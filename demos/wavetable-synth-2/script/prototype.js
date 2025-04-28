/* eslint-disable */

import {KnobSimple} from '../ui-components/KnobSimple.js';
import {ToggleSimple} from '../ui-components/ToggleSimple.js';
import {Dropdown} from '../ui-components/Dropdown.js';
import {WavetableView} from '../ui-components/WavetableView.js';
import {MatrixSequence2D} from '../ui-components/MatrixSequence2D.js';

import {WavetableDataSet} from './WavetableDataSet.js';

import {GlobalEffect} from './GlobalEffect.js';
import {Sequencer} from './Sequencer.js';
import {Note} from './Note.js';

let isAudioStarted = false;
let ScheduleTaskId = null;

let context = null;
let globalEffect = null;
let sequencer = null;
const globalParams = {
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

const initialWavetable1Index = 22; // Celeste
const initialWavetable2Index = 37; // Phoneme_ah

const wavetableViews = [];
const periodicWaves = [];

const handleTempoKnob = (event) => {
  if (event.type !== 'input' && event.type !== 'change') return;
  if (!event.detail.value) return;
  sequencer.setTempo(event.detail.value);
  globalEffect.setTempo(event.detail.value);
};

const handleSequnceDataChange = (event) => {
  sequencer.setSequenceData(event.target.getSequenceData());
};

const handleParamChange = (event) => {
  if (event.type !== 'input' && event.type !== 'change') return;
  if (typeof event.detail.value === 'undefined') return;
  const paramName = event.target.id.replace('knob-', '');
  if (globalParams.hasOwnProperty(paramName)) {
    globalParams[paramName] = event.detail.value;
    console.log(`Set globalParams.${paramName} = ${globalParams[paramName]}`);
  } else {
    console.warn(
        `Unknown parameter: ${paramName} for element ID: ${event.target.id}`);
  }
};

const handleWavetableSelect = (event) => {
  // event.detail.value contains the selected wavetable index from
  // WavetableDataSet
  if (typeof event.detail.value === 'undefined') {
    return;
  }

  const dataIndex = event.detail.value;
  const dropdownId = event.target.id;

  let generatorIndex = -1;
  if (dropdownId === 'select-wavetable1') {
    generatorIndex = 0;
  } else if (dropdownId === 'select-wavetable2') {
    generatorIndex = 1;
  }

  if (generatorIndex === -1) {
    console.warn(`Wavetable select event from unknown element: ${dropdownId}`);
    return;
  }

  changeWavetable(generatorIndex, dataIndex);
};

const changeWavetable = (generatorIndex, wavetableIndex) => {
  const periodicWaveData = WavetableDataSet[wavetableIndex];
  wavetableViews[generatorIndex].setComplexData(
      periodicWaveData.real, periodicWaveData.imag);
  periodicWaves[generatorIndex] = new PeriodicWave(context, {
    real: periodicWaveData.real,
    imag: periodicWaveData.imag,
  });
};

const startAudio = async () => {
  context = new AudioContext();
  globalEffect = new GlobalEffect(context);
  await globalEffect.initialize();
  sequencer = new Sequencer();

  changeWavetable(0, initialWavetable1Index);
  changeWavetable(1, initialWavetable2Index);

  const sequenceLoop = () => {
    sequencer.schedule({
      context,
      periodicWaves,
      params: globalParams,
      destination: globalEffect.input,
    });
    ScheduleTaskId = requestAnimationFrame(sequenceLoop);
  };

  requestAnimationFrame(sequenceLoop);
  isAudioStarted = true;
};

const initialize = async () => {
  wavetableViews[0] = document.querySelector('#view-wavetable1');
  wavetableViews[1] = document.querySelector('#view-wavetable2');

  const wavetableOptions = {};
  WavetableDataSet.forEach((item, index) => {
    wavetableOptions[item.filename] = index;
  });
  const wavetableSelect1 = document.querySelector('#select-wavetable1');
  wavetableSelect1.options = wavetableOptions;
  wavetableSelect1.addEventListener('select', handleWavetableSelect);
  const wavetableSelect2 = document.querySelector('#select-wavetable2');
  wavetableSelect2.options = wavetableOptions;
  wavetableSelect2.addEventListener('select', handleWavetableSelect);

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

  const knobs = {
    detune1: document.querySelector('#knob-detune1'),
    detune2: document.querySelector('#knob-detune2'),
    filterCutoff: document.querySelector('#knob-filterCutoff'),
    FilterResonance: document.querySelector('#knob-filterResonance'),
    FilterAmount: document.querySelector('#knob-filterAmount'),
    FilterAttack: document.querySelector('#knob-filterAttack'),
    FilterDecay: document.querySelector('#knob-filterDecay'),
    AmpAttack: document.querySelector('#knob-ampAttack'),
    AmpDecay: document.querySelector('#knob-ampDecay'),
    width: document.querySelector('#knob-width'),
  };

  for (const paramName in knobs) {
    if (knobs[paramName]) {
      const knob = knobs[paramName];
      knob.addEventListener('input', handleParamChange);
      knob.addEventListener('change', handleParamChange);
      // Initialize knob value from globalParams
      if (globalParams.hasOwnProperty(paramName)) {
        knob.value = globalParams[paramName];
      }
    } else {
      // Log a warning if a knob element wasn't found in the HTML
      console.warn(`Could not find knob element for one of the parameters.`);
    }
  }

  const matrix2D = document.querySelector('#matrix-2d-1');
  matrix2D.addEventListener('change', handleSequnceDataChange);
};

window.addEventListener('load', initialize);
