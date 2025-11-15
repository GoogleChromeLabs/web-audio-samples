// Copyright (c) 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const audioContext = new AudioContext();

const startAudio = async (context) => {
  await context.audioWorklet.addModule('ring-buffer-worklet-processor.js');
  const oscillator = new OscillatorNode(context);
  const ringBufferWorkletNode =
      new AudioWorkletNode(context, 'ring-buffer-worklet-processor', {
        processorOptions: {
          kernelBufferSize: 1024,
          channelCount: 1,
        },
      });

  oscillator.connect(ringBufferWorkletNode).connect(context.destination);
  oscillator.start();
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
