// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const audioContext = new AudioContext();

const startAudio = async (context) => {
  await context.audioWorklet.addModule('one-pole-processor.js');
  const oscillator = new OscillatorNode(context);
  const filter = new AudioWorkletNode(context, 'one-pole-processor');
  const frequencyParam = filter.parameters.get('frequency');

  oscillator.connect(filter).connect(context.destination);
  oscillator.start();

  frequencyParam
      .setValueAtTime(0.01, 0)
      .exponentialRampToValueAtTime(context.sampleRate * 0.5, 4.0)
      .exponentialRampToValueAtTime(0.01, 8.0);
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
