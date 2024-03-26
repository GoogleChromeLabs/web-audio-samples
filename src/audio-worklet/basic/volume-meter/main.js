// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const audioContext = new AudioContext();
let mediaStream;
let volumeMeterNode;

const startAudio = async (context, meterElement) => {
  await context.audioWorklet.addModule('volume-meter-processor.js');
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const micNode = context.createMediaStreamSource(mediaStream);
  volumeMeterNode = new AudioWorkletNode(context, 'volume-meter');
  volumeMeterNode.port.onmessage = ({ data }) => {
    meterElement.value = data * 500;
  };
  micNode.connect(volumeMeterNode).connect(context.destination);
};

const stopAudio = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  if (volumeMeterNode) {
    volumeMeterNode.disconnect();
    volumeMeterNode = null;
  }
};

// A simple onLoad handler. It also handles user gesture to unlock the audio
// playback.
window.addEventListener('load', async () => {
  const buttonEl = document.getElementById('button-start');
  const meterEl = document.getElementById('volume-meter');
  buttonEl.disabled = false;
  meterEl.disabled = false;

  buttonEl.addEventListener('click', async () => {
    if (!mediaStream) { // If audio is not playing, start audio
      await startAudio(audioContext, meterEl);
      audioContext.resume();
      buttonEl.textContent = 'STOP';
    } else { // If audio is playing, stop audio
      stopAudio();
      buttonEl.textContent = 'START';
    }
  }, false);
});
