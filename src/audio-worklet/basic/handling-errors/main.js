// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const audioContext = new AudioContext();

const startAudio = async (context) => {
  await context.audioWorklet.addModule('error-processor.js');

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

// A simplem onLoad handler. It also handles user gesture to unlock the audio
// playback.
window.addEventListener('load', async () => {
  const buttonEl = document.getElementById('button-start');
  buttonEl.disabled = false;
  buttonEl.addEventListener('click', async () => {
    await startAudio(audioContext);
    audioContext.resume();
    buttonEl.disabled = true;
    buttonEl.textContent = 'Playing...';
  }, false);
});
