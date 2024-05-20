// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const audioContext = new AudioContext();
let isModuleLoaded = false;
let isPlaying = false;
let oscillatorProcessor = null;

const startAudio = async (context, options) => {
  if (!isModuleLoaded) {
    await context.audioWorklet.addModule('oscillator-processor.js');
    oscillatorProcessor =
      new AudioWorkletNode(context, 'oscillator-processor', {
        processorOptions: {
          waveformType: options.waveformType,
          frequency: options.frequency,
        },
      });
    oscillatorProcessor.connect(context.destination);
    isModuleLoaded = true;
    context.resume();
  } else context.resume();
};

// A simple onLoad handler. It also handles user gesture to unlock the audio
// playback.
window.addEventListener('load', async () => {
  const buttonEl = document.getElementById('button-start');
  buttonEl.disabled = false;
  buttonEl.addEventListener('click', async () => {
    const waveformType =
      document.querySelector('#demo-select-waveform-type').value;
    const frequency = document.querySelector('#demo-input-frequency').value;
    if (!isPlaying) {
      // If audio is not playing, start the audio.
      await startAudio(audioContext, {waveformType, frequency});
      isPlaying = true;
      buttonEl.textContent = 'STOP';
    } else {
      // If audio is playing, stop the audio.
      audioContext.suspend();
      buttonEl.textContent = 'START';
      isPlaying = false;
    }
  }, false);
});
