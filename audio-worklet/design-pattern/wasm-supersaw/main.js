// Copyright (c) 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

class DemoApp {
  constructor() {
    this._container = null;
    this._toggleButton = null;
    this._toggleState = false;
    this._toneButton = null;
    this._context = null;
    this._synthNode = null;
    this._volumeNode = null;
  }

  initializeView() {
    this._toggleButton = document.getElementById('audio-toggle');
    this._toggleButton.addEventListener(
        'mouseup', () => this._handleToggle());
    this._toneButton = document.getElementById('play-tone');
    this._toneButton.addEventListener(
        'mousedown', () => this._handleToneButton(true));
    this._toneButton.addEventListener(
        'mouseup', () => this._handleToneButton(false));
    this._toggleButton.disabled = false;
    this._toneButton.disabled = false;
  }

  async initializeAudio() {
    this._context = new AudioContext();
    await this._context.audioWorklet.addModule('./synth-processor.js');
    this._synthNode = new AudioWorkletNode(this._context, 'wasm-synth');
    this._volumeNode = new GainNode(this._context, {gain: 0.25});
    this._synthNode
        .connect(this._volumeNode)
        .connect(this._context.destination);

    if (!this._toggleState) this._context.suspend();
  }

  _handleToggle() {
    this._toggleState = !this._toggleState;
    if (this._toggleState) {
      this._context.resume();
      this._toggleButton.classList.replace('inactive', 'active');
    } else {
      this._context.suspend();
      this._toggleButton.classList.replace('active', 'inactive');
    }
  }

  _handleToneButton(isDown) {
    this._synthNode.port.postMessage(isDown);
    if (isDown) {
      this._toneButton.classList.replace('inactive', 'active');
    } else {
      this._toneButton.classList.replace('active', 'inactive');
    }
  }
}

const demoApp = new DemoApp();

window.addEventListener('load', async () => {
  demoApp.initializeView();
  await demoApp.initializeAudio();
});
