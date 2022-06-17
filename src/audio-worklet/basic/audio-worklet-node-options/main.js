// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const audioContext = new AudioContext();

const startAudio = async (context, options) => {
  await context.audioWorklet.addModule('oscillator-processor.js');
  const oscillatorProcessor =
      new AudioWorkletNode(context, 'oscillator-processor', {
        processorOptions: {
          waveformType: options.waveformType,
          frequency: options.frequency,
        }});
  oscillatorProcessor.connect(context.destination);
};

// A simplem onLoad handler. It also handles user gesture to unlock the audio
// playback.
window.addEventListener('load', async () => {
  const buttonEl = document.getElementById('button-start');
  buttonEl.disabled = false;
  buttonEl.addEventListener('click', async () => {
    const waveformType =
        document.querySelector('#demo-select-waveform-type').value;
    const frequency = document.querySelector('#demo-input-frequency').value;
    await startAudio(audioContext, {waveformType, frequency});
    audioContext.resume();
    buttonEl.disabled = true;
    buttonEl.textContent = 'Playing...';
  }, false);
});
