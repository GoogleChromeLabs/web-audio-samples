// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Extends AudioWorkletNode to simplify the cross-thread message posting.
class MessengerWorkletNode extends AudioWorkletNode {
  constructor(context) {
    super(context, 'messenger-processor');
    this.counter_ = 0;
    this.port.onmessage = this.handleMessage_.bind(this);
    console.log('[Node:constructor] created.');
  }

  handleMessage_(event) {
    console.log(`[Node:handleMessage_] ` +
        `${event.data.message} (${event.data.contextTimestamp})`);
    if (this.counter_++ === 10) {
      this.port.postMessage({
        message: '10 messages received!',
        contextTimestamp: this.context.currentTime,
      });
      this.counter_ = 0;
    }
  }
}

const audioContext = new AudioContext();
let isModuleLoaded = false;
let isGraphReady = false;

const loadGraph = (context) => {
  // This worklet node does not need a connection to function. The
  // AudioWorkletNode is automatically processed after construction.
  // eslint-disable-next-line no-unused-vars
  const messengerWorkletNode = new MessengerWorkletNode(context);
};

const startAudio = async (context) => {
  if (!isModuleLoaded) {
    await context.audioWorklet.addModule('messenger-processor.js');
    isModuleLoaded = true;
  }
  if (!isGraphReady) {
    loadGraph(context);
    isGraphReady = true;
  }
};

// A simple onLoad handler. It also handles user gesture to unlock the audio
// playback.
window.addEventListener('load', async () => {
  const startButtonEl = document.getElementById('button-start');
  const stopButtonEl = document.getElementById('button-stop');
  startButtonEl.disabled = false;

  startButtonEl.addEventListener('click', async () => {
    await startAudio(audioContext);
    audioContext.resume();
    startButtonEl.disabled = true;
    startButtonEl.textContent = 'Playing...';
    stopButtonEl.disabled = false;
  }, false);

  stopButtonEl.addEventListener('click', async () => {
    audioContext.suspend();
    startButtonEl.disabled = false;
    startButtonEl.textContent = 'START';
    stopButtonEl.disabled = true;
  }, false);
});
