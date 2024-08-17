// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const audioContext = new AudioContext();
let isModuleLoaded = false;
let isPlaying = false;
let isGraphReady = false;
let oscillatorNode = null;
let filterNode = null;

const loadGraph = (context) => {
  oscillatorNode = new OscillatorNode(context);
  filterNode = new AudioWorkletNode(context, 'one-pole-processor');
  const frequencyParam = filterNode.parameters.get('frequency');

  oscillatorNode.connect(filterNode).connect(context.destination);
  oscillatorNode.start();

  frequencyParam
      .setValueAtTime(0.01, 0)
      .exponentialRampToValueAtTime(context.sampleRate * 0.5, 4.0)
      .exponentialRampToValueAtTime(0.01, 8.0);
}

const startAudio = async (context) => {
  if(!isModuleLoaded) {
    await context.audioWorklet.addModule('one-pole-processor.js');
    isModuleLoaded = true;
  }
  if(!isGraphReady) {
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
