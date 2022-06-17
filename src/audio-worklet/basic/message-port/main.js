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

const startAudio = async (context) => {
  await context.audioWorklet.addModule('messenger-processor.js');

  // This worklet node does not need a connection to function. The
  // AudioWorkletNode is automatically processed after construction.
  // eslint-disable-next-line no-unused-vars
  const messengerWorkletNode = new MessengerWorkletNode(context);
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
