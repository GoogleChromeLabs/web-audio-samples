// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const audioContext = new AudioContext();
let isPlaying = false;
let isModuleLoaded = false;
let noiseGenerator = null;

const startAudio = async (context) => {
  await context.audioWorklet.addModule('noise-generator.js');
  const modulator = new OscillatorNode(context);
  const modGain = new GainNode(context);
  noiseGenerator = new AudioWorkletNode(context, 'noise-generator');
  noiseGenerator.connect(context.destination);

  // Connect the oscillator to 'amplitude' AudioParam.
  const paramAmp = noiseGenerator.parameters.get('amplitude');
  modulator.connect(modGain).connect(paramAmp);

  modulator.frequency.value = 0.5;
  modGain.gain.value = 0.75;
  modulator.start();
};
// A simple onLoad handler. It also handles user gesture to unlock the audio
// playback.
window.addEventListener('load', async () => {
  const buttonEl = document.getElementById('button-start');
  buttonEl.disabled = false;

  buttonEl.addEventListener('click', async () => {
    if (!isPlaying) {
      // If not playing, start the audio.
      if (!isModuleLoaded) {
        await startAudio(audioContext);
        isModuleLoaded = true;
      }
      audioContext.resume();
      isPlaying = true;
      buttonEl.textContent = 'Playing...';
    } else { // If playing, susupend audio
      audioContext.suspend();
      isPlaying = false;
      buttonEl.textContent = 'START';
    }
  });
  buttonEl.addEventListener('mouseenter', () => {
    if (isPlaying) {
      buttonEl.textContent = 'STOP';
    }
  });

  buttonEl.addEventListener('mouseleave', () => {
    if (isPlaying) {
      buttonEl.textContent = 'Playing...';
    }
  });
});
