// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

let audioContext = null;
let isModuleLoaded = false;
let isPlaying = false;
let isGraphReady = false;
let oscillatorNode = null;

const loadGraph = (context) => {
  oscillatorNode = new OscillatorNode(context);
  const bypasser = new AudioWorkletNode(context, 'bypass-processor');
  oscillatorNode.connect(bypasser).connect(context.destination);
  oscillatorNode.start();
};

const startAudio = async (context) => {
  if (!isModuleLoaded) {
    await context.audioWorklet.addModule(
      '/audio-worklet/basic/hello-audio-worklet/bypass-processor.js'
    );
    isModuleLoaded = true;
  }
  if (!isGraphReady) {
    loadGraph(context);
    isGraphReady = true;
  }
};

const setupDemo = () => {
  const buttonEl = document.getElementById('button-start');
  if (!buttonEl) return;

  buttonEl.disabled = false;
  buttonEl.addEventListener('click', async () => {
    if (!audioContext) {
      audioContext = new AudioContext();
    }

    if (!isPlaying) {
      await startAudio(audioContext);
      await audioContext.resume();
      isPlaying = true;
      buttonEl.textContent = 'STOP';
      buttonEl.classList.add('playing');
    } else {
      await audioContext.suspend();
      isPlaying = false;
      buttonEl.textContent = 'START';
      buttonEl.classList.remove('playing');
    }
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupDemo);
} else {
  setupDemo();
}
