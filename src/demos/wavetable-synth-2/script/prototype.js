import { WavetableDataSet } from './WavetableDataSet.js';

import { GlobalEffect } from './GlobalEffect.js';
import { Note } from './Note.js';

import { ToggleSimple } from "../ui-components/ToggleSimple.js";

const startAudio = async () => {
  const context = new AudioContext();
  const globalEffect = new GlobalEffect(context);
  await globalEffect.initialize();

  const periodicWaveData = WavetableDataSet[20];
  console.log(periodicWaveData.filename);
  const periodicWave = new PeriodicWave(context, {
    real: periodicWaveData.real,
    imag: periodicWaveData.imag,
  });

  setInterval(() => {
    const note = new Note(context, periodicWave, globalEffect.input);
    note.play(60, 1, context.currentTime);
  }, 1000);
};

const initialize = async () => {
  const toggle1 = document.querySelector('#toggle-1');
  toggle1.addEventListener('change', (event) => {
    if (event.detail.state) {
      startAudio();
    }
  }, {once: true});
};

window.addEventListener('load', initialize);
