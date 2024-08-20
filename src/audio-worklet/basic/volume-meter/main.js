// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const audioContext = new AudioContext();
let isModuleLoaded = false;
let isPlaying = false;
let isGraphReady = false;
let micNode = null;
let volumeMeterNode = null;
let mediaStream = null;

const loadGraph = async (context, meterElement) => {
  mediaStream = await navigator.mediaDevices.getUserMedia({audio: true});
  micNode = context.createMediaStreamSource(mediaStream);
  volumeMeterNode = new AudioWorkletNode(context, 'volume-meter');
  volumeMeterNode.port.onmessage = ({data}) => {
    meterElement.value = data * 500;
  };
  micNode.connect(volumeMeterNode).connect(context.destination);
};

const startAudio = async (context, meterElement) => {
  if (!isModuleLoaded) {
    await context.audioWorklet.addModule('volume-meter-processor.js');
    isModuleLoaded = true;
  }
  await loadGraph(context, meterElement);
  isGraphReady = true;
};

// Stop the audio playback and release the resources.
const stopAudio = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
  }
  if (micNode) {
    micNode.disconnect();
  }
  if (volumeMeterNode) {
    volumeMeterNode.disconnect();
  }
  isGraphReady = false;
};

// A simplem onLoad handler. It also handles user gesture to unlock the audio
// playback.
window.addEventListener('load', async () => {
  const buttonEl = document.getElementById('button-start');
  const meterEl = document.getElementById('volume-meter');
  buttonEl.disabled = false;
  meterEl.disabled = false;

  buttonEl.addEventListener('click', async () => {
    if (!isPlaying) {
      await startAudio(audioContext, meterEl);
      isPlaying = true;
      buttonEl.textContent = 'Stop';
      buttonEl.classList.remove('start-button');
      audioContext.resume();
    } else {
      audioContext.suspend();
      stopAudio();
      isPlaying = false;
      buttonEl.textContent = 'Start';
      buttonEl.classList.add('start-button');
      meterEl.value = 0;
    }
  });
});
