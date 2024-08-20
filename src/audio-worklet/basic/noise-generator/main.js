// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const audioContext = new AudioContext();
let isModuleLoaded = false;
let isPlaying = false;
let isGraphReady = false;
let modulatorNode = null;
let modGainNode = null;
let noiseGeneratorNode = null;

const loadGraph = (context) => {
  modulatorNode = new OscillatorNode(context);
  modGainNode = new GainNode(context);
  noiseGeneratorNode = new AudioWorkletNode(context, 'noise-generator');
  noiseGeneratorNode.connect(context.destination);

  // Connect the oscillator to 'amplitude' AudioParam.
  const paramAmp = noiseGeneratorNode.parameters.get('amplitude');
  modulatorNode.connect(modGainNode).connect(paramAmp);

  modulatorNode.frequency.value = 0.5;
  modGainNode.gain.value = 0.75;
  modulatorNode.start();
};


const startAudio = async (context) => {
  if (!isModuleLoaded) {
    await context.audioWorklet.addModule('noise-generator.js');
    isModuleLoaded = true;
  }
  if (!isGraphReady) {
    loadGraph(audioContext);
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
      await startAudio(audioContext);
      isPlaying = true;
      buttonEl.textContent = 'Playing...';
      buttonEl.classList.remove('start-button');
      audioContext.resume();
    } else {
      audioContext.suspend();
      isPlaying = false;
      buttonEl.textContent = 'START';
      buttonEl.classList.add('start-button');
    }
  });
});
