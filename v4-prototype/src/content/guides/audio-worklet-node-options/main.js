// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

let audioContext = null;
let workletNode = null;
let selectWaveform = null;
let inputFrequency = null;

/**
 * Creates or updates the oscillator worklet node with the chosen options.
 * @param {AudioContext} context
 */
const updateWorkletNode = (context) => {
  if (!context) return;

  const waveformType = selectWaveform ? selectWaveform.value : 'sine';
  const frequency = inputFrequency
    ? parseFloat(inputFrequency.value) || 440
    : 440;

  if (workletNode) {
    try {
      workletNode.disconnect();
    } catch {
      // Ignore disconnect error.
    }
  }

  workletNode = new AudioWorkletNode(context, 'oscillator-processor', {
    processorOptions: {
      waveformType,
      frequency,
    },
  });
  workletNode.connect(context.destination);
};

/**
 * Injects waveform type and frequency input controls into the demo box.
 */
const mountControls = () => {
  if (document.getElementById('options-controls')) return;

  const container = document.createElement('div');
  container.id = 'options-controls';
  container.className =
    'flex flex-wrap items-center gap-4 py-2 text-xs text-slate-700';

  // Waveform selector
  const waveGroup = document.createElement('div');
  waveGroup.className = 'flex items-center gap-2';

  const waveLabel = document.createElement('label');
  waveLabel.htmlFor = 'demo-select-waveform';
  waveLabel.className = 'font-semibold text-slate-600 select-none';
  waveLabel.textContent = 'Waveform:';

  selectWaveform = document.createElement('select');
  selectWaveform.id = 'demo-select-waveform';
  selectWaveform.className =
    'px-2.5 py-1 rounded-md border border-slate-300 bg-white font-medium ' +
    'text-slate-800 shadow-xs focus:border-blue-500 focus:outline-none';

  ['sine', 'triangle', 'square', 'sawtooth', 'noise'].forEach((type) => {
    const opt = document.createElement('option');
    opt.value = type;
    opt.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    selectWaveform.appendChild(opt);
  });

  waveGroup.appendChild(waveLabel);
  waveGroup.appendChild(selectWaveform);

  // Frequency input
  const freqGroup = document.createElement('div');
  freqGroup.className = 'flex items-center gap-2';

  const freqLabel = document.createElement('label');
  freqLabel.htmlFor = 'demo-input-frequency';
  freqLabel.className = 'font-semibold text-slate-600 select-none';
  freqLabel.textContent = 'Frequency (Hz):';

  inputFrequency = document.createElement('input');
  inputFrequency.id = 'demo-input-frequency';
  inputFrequency.type = 'number';
  inputFrequency.min = '1';
  inputFrequency.max = '20000';
  inputFrequency.value = '440';
  inputFrequency.className =
    'w-24 px-2.5 py-1 rounded-md border border-slate-300 bg-white ' +
    'font-medium text-slate-800 shadow-xs focus:border-blue-500 ' +
    'focus:outline-none';

  freqGroup.appendChild(freqLabel);
  freqGroup.appendChild(inputFrequency);

  container.appendChild(waveGroup);
  container.appendChild(freqGroup);

  const panel = document.querySelector('[data-control-panel]');
  if (panel && panel.parentNode) {
    panel.parentNode.insertBefore(container, panel);
  }

  // Allow live reconfiguration when changing options
  const onOptionChange = () => {
    if (audioContext && audioContext.state === 'running') {
      updateWorkletNode(audioContext);
    }
  };

  selectWaveform.addEventListener('change', onOptionChange);
  inputFrequency.addEventListener('input', onOptionChange);
};

/**
 * Initializes the AudioContext and registers the processor module.
 * @return {Promise<AudioContext>}
 */
export const setup = async () => {
  audioContext = new AudioContext();
  await audioContext.suspend();

  const processorUrl =
    new URL('oscillator-processor.js', import.meta.url).href;
  await audioContext.audioWorklet.addModule(processorUrl);

  mountControls();
  return audioContext;
};

/**
 * Builds the graph with user-specified constructor options on user gesture.
 * @param {AudioContext} context
 */
export const start = async (context) => {
  updateWorkletNode(context);
};
