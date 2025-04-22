import { KnobSimple } from '../ui-components/KnobSimple.js';
import { ToggleSimple } from '../ui-components/ToggleSimple.js';

import { WavetableDataSet } from './WavetableDataSet.js';

import { GlobalEffect } from './GlobalEffect.js';
import { Sequencer } from './Sequencer.js';
import { Note } from './Note.js';

let isAudioStarted = false;
let ScheduleTaskId = null;

let globalEffect = null;
let sequencer = null;

const startAudio = async () => {
  const context = new AudioContext();
  globalEffect = new GlobalEffect(context);
  await globalEffect.initialize();
  sequencer = new Sequencer();

  const periodicWaveData = WavetableDataSet[22];
  const periodicWave = new PeriodicWave(context, {
    real: periodicWaveData.real,
    imag: periodicWaveData.imag,
  });

  const sequenceLoop = () => {
    sequencer.schedule({
      context,
      periodicWave,
      destination: globalEffect.input
    });
    ScheduleTaskId = requestAnimationFrame(sequenceLoop);
  };

  requestAnimationFrame(sequenceLoop);
  isAudioStarted = true;
};

const handleTempoKnob = (event) => {
  if (event.type !== 'input' && event.type !== 'change') return;
  if (!event.detail.value) return;
  sequencer.setTempo(event.detail.value);
};

const initialize = async () => {
  const toggle1 = document.querySelector('#toggle-1');
  const knobTempo = document.querySelector('#knob-tempo');

  toggle1.addEventListener('change', (event) => {
    if (event.detail.state && !isAudioStarted) {
      startAudio();
    } else {
      cancelAnimationFrame(ScheduleTaskId);
      ScheduleTaskId = null;
    }
  });

  knobTempo.addEventListener('input', handleTempoKnob);
  knobTempo.addEventListener('change', handleTempoKnob);
};

window.addEventListener('load', initialize);
