// Copyright (c) 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const audioContext = new AudioContext();
let isModuleLoaded = false;
let isGraphReady = false;

const loadGraph = (context) => {
  const oscillator = new OscillatorNode(context);
  const bypasser = new AudioWorkletNode(context, 'wasm-worklet-processor');
  oscillator.connect(bypasser).connect(context.destination);
  oscillator.start();
};

const startAudio = async (context) => {
  if (!isModuleLoaded) {
    await context.audioWorklet.addModule('wasm-worklet-processor.js');
    isModuleLoaded = true;
  }
  if (!isGraphReady) {
    loadGraph(context);
    isGraphReady = true;
  }
};

// A simple onLoad handler. It also handles user gesture to unlock the audio
// playback.
window.addEventListener('load', async () => {
  const startButtonEl = document.getElementById('button-start');
  const stopButtonEl = document.getElementById('button-stop');
  startButtonEl.disabled = false;

  startButtonEl.addEventListener('click', async () => {
    await startAudio(audioContext);
    audioContext.resume();
    startButtonEl.disabled = true;
    startButtonEl.textContent = 'Playing...';
    stopButtonEl.disabled = false;
  }, false);

  stopButtonEl.addEventListener('click', async () => {
    audioContext.suspend();
    startButtonEl.disabled = false;
    startButtonEl.textContent = 'START';
    stopButtonEl.disabled = true;
  }, false);
});
