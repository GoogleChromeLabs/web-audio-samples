// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const audioContext = new AudioContext();
let oscillatorProcessor;
let isPlaying= false;
let isModuleLoaded = false;

const startAudio = async (context, options) => {
  await context.audioWorklet.addModule('oscillator-processor.js');
  oscillatorProcessor =
    new AudioWorkletNode(context, 'oscillator-processor', {
      processorOptions: {
        waveformType: options.waveformType,
        frequency: options.frequency,
      }
    });
  oscillatorProcessor.connect(context.destination);
};

// A simple onLoad handler. It also handles user gesture to unlock the audio
// playback.
window.addEventListener('load', async () => {
  const buttonEl = document.getElementById('button-start');
  buttonEl.disabled = false;


  buttonEl.addEventListener('click', async () => {
    const waveformType = document.querySelector('#demo-select-waveform-type').value;
    const frequency = document.querySelector('#demo-input-frequency').value;
    if (!isPlaying) {
      // If audio is not playing, start the audio.
      if (!isModuleLoaded) {
        await startAudio(audioContext, {waveformType, frequency});
        isModuleLoaded = true;
      }
      isPlaying = true;
      audioContext.resume();
      buttonEl.textContent = 'STOP';
    } else {
      // If audio is playing, stop the audio.
      audioContext.suspend();
      buttonEl.textContent = 'START';
      isPlaying = false;
    }
  }, false);
});
