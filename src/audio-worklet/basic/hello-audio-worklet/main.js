// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const audioContext = new AudioContext();
let oscillator; 
let isPlaying = false; 

const startAudio = async (context) => {
  await context.audioWorklet.addModule('bypass-processor.js');
  oscillator = new OscillatorNode(context);
  const bypasser = new AudioWorkletNode(context, 'bypass-processor');
  oscillator.connect(bypasser).connect(context.destination);
  oscillator.start();
};

const stopAudio = () => {
  if (oscillator) {
    oscillator.stop();
    oscillator.disconnect();
  }
};

// A simplem onLoad handler. It also handles user gesture to unlock the audio
// playback.
window.addEventListener('load', async () => {
  const buttonEl = document.getElementById('button-start');
  buttonEl.disabled = false;

  buttonEl.addEventListener('click', async () => {
    if (!isPlaying) { 
      await startAudio(audioContext);
      audioContext.resume();
      isPlaying = true;
      buttonEl.textContent = 'Playing...'; 
      buttonEl.classList.remove('start-button');
    } else { 
      stopAudio();
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
