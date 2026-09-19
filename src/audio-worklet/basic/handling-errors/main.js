// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const audioContext = new AudioContext();
let isModuleLoaded = false;
let isGraphReady = false;

const loadGraph = (context) => {
  // To handle an error from the construction phase.
  const constructorErrorWorkletNode =
      new AudioWorkletNode(context, 'constructor-error');
  constructorErrorWorkletNode.onprocessorerror = (event) => {
    console.log(
        'An error from AudioWorkletProcessor.constructor() was detected.');
  };

  // To handle an error from AudioWorkletProcessor.process() function.
  const processErrorWorkletNode =
      new AudioWorkletNode(context, 'process-error');
  processErrorWorkletNode.onprocessorerror = () => {
    console.log(
        'An error from AudioWorkletProcessor.process() was detected.');
  };

  // To update processor's internal timer, the node must be connected to
  // the graph.
  processErrorWorkletNode.connect(context.destination);
};

const startAudio = async (context) => {
  if (!isModuleLoaded) {
    await context.audioWorklet.addModule('error-processor.js');
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
