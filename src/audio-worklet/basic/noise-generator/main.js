// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const audioContext = new AudioContext();
let isPlaying = false;
let noiseGenerator;

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

const stopAudio = () => {
  if (noiseGenerator) {
    noiseGenerator.disconnect();
    isPlaying = false;
  }
};

// A simple onLoad handler. It also handles user gesture to unlock the audio
// playback.
window.addEventListener('load', async () => {
  const buttonEl = document.getElementById('button-start');
  buttonEl.disabled = false;

  buttonEl.addEventListener('click', async () => {
    if (!isPlaying) { 
      // If not playing, start the audio.
      await startAudio(audioContext);
      audioContext.resume();
      isPlaying = true;
      buttonEl.textContent = 'Playing...';
    } else { // If playing, stop audio
      stopAudio();
      buttonEl.textContent = 'START';
    }
  });
});
