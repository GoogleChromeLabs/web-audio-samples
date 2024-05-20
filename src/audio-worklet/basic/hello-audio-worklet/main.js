// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const audioContext = new AudioContext();
let oscillatorNode = null;
let isPlaying = false;
let isModuleLoaded = false;

const startAudio = async (context) => {
  if (!isModuleLoaded) {
    await context.audioWorklet.addModule('bypass-processor.js');
    oscillatorNode = new OscillatorNode(context);
    const bypasser = new AudioWorkletNode(context, 'bypass-processor');
    oscillatorNode.connect(bypasser).connect(context.destination);
    oscillatorNode.start();
    isModuleLoaded = true;
  } else audioContext.resume();
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
    } else {
      audioContext.suspend();
      isPlaying = false;
      buttonEl.textContent = 'START';
      buttonEl.classList.add('start-button');
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
