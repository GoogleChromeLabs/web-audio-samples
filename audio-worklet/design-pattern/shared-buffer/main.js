// Copyright (c) 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const audioContext = new AudioContext();

const startAudio = async (context) => {
  // Import the pre-defined AudioWorkletNode subclass dynamically. This is
  // invoked only when Audio Worklet is detected.
  const {default: SharedBufferWorkletNode} =
      await import('./shared-buffer-worklet-node.js');

  await context.audioWorklet.addModule('shared-buffer-worklet-processor.js');
  const oscillator = new OscillatorNode(context);
  const sbwNode = new SharedBufferWorkletNode(context);

  sbwNode.onInitialized = () => {
    oscillator.connect(sbwNode).connect(context.destination);
    oscillator.start();
  };

  sbwNode.onError = (errorData) => {
    console.log('[ERROR] ' + errorData.detail);
  };
};

// A simple onLoad handler. It also handles user gesture to unlock the audio
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
