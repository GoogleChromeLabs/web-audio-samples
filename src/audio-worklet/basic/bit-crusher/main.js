// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const audioContext = new AudioContext();

const startAudio = async (context) => {
  await context.audioWorklet.addModule('bit-crusher-processor.js');
  const oscillator = new OscillatorNode(context);
  const bitCrusher =
      new AudioWorkletNode(context, 'bit-crusher-processor');
  const paramBitDepth = bitCrusher.parameters.get('bitDepth');
  const paramReduction = bitCrusher.parameters.get('frequencyReduction');

  oscillator.type = 'sawtooth';
  oscillator.frequency.value = 5000;
  paramBitDepth.setValueAtTime(1, 0);

  oscillator.connect(bitCrusher).connect(context.destination);

  // `frequencyReduction` parameters will be automated and changing over time.
  // Thus its parameter array will have 128 values.
  paramReduction.setValueAtTime(0.01, 0);
  paramReduction.linearRampToValueAtTime(0.1, 4);
  paramReduction.exponentialRampToValueAtTime(0.01, 8);

  // Play the tone for 8 seconds.
  oscillator.start();
  oscillator.stop(8);
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
