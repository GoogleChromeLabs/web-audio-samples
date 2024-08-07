// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const audioContext = new AudioContext();
let isModuleLoaded = false;
let isPlaying = false;
let isGraphReady = false;
let oscillatorProcessor = null;

const loadGraph = (context, options) => {
  oscillatorProcessor = new AudioWorkletNode(context, 'oscillator-processor', {
    processorOptions: {
      waveformType: options.waveformType,
      frequency: options.frequency,
    }
  });
  oscillatorProcessor.connect(context.destination);
};

const startAudio = async (context, options) => {
  if (!isModuleLoaded) {
    await context.audioWorklet.addModule('oscillator-processor.js');
    isModuleLoaded = true;
  }
  if (!isGraphReady) {
    loadGraph(context, options);
    isGraphReady = true;
  }
};

// A simplem onLoad handler. It also handles user gesture to unlock the audio
// playback.
window.addEventListener('load', async () => {
  const buttonEl = document.getElementById('button-start');
  buttonEl.disabled = false;

  buttonEl.addEventListener('click', async () => {
    if (!isPlaying) {
      const waveformType =
          document.querySelector('#demo-select-waveform-type').value;
      const frequency = document.querySelector('#demo-input-frequency').value;
      isPlaying = true;
      await startAudio(audioContext, {waveformType, frequency});
      buttonEl.textContent = 'Playing...';
      buttonEl.classList.remove('start-button');
      audioContext.resume();
      document.querySelector('#demo-select-waveform-type').disabled = true;
      document.querySelector('#demo-input-frequency').disabled = true;
    } else {
      audioContext.suspend();
      isPlaying = false;
      buttonEl.textContent = 'START';
      buttonEl.classList.add('start-button');
      document.querySelector('#demo-select-waveform-type').disabled = false;
      document.querySelector('#demo-input-frequency').disabled = false;
    }
  });
});
