// Copyright (c) 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

let audioContext = null;
let synthNode = null;
let volumeNode = null;

/**
 * Injects a musical note trigger button into the demo box.
 */
const mountControls = () => {
  if (document.getElementById('supersaw-controls')) return;

  const container = document.createElement('div');
  container.id = 'supersaw-controls';
  container.className =
    'flex items-center gap-3 py-2 text-xs text-slate-700';

  const noteBtn = document.createElement('button');
  noteBtn.id = 'button-play-note';
  noteBtn.type = 'button';
  noteBtn.className =
    'px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold ' +
    'text-slate-800 shadow-xs hover:bg-slate-50 active:bg-blue-50 ' +
    'active:border-blue-400 active:text-blue-700 cursor-pointer ' +
    'transition-colors select-none';
  noteBtn.textContent = 'Hold to Play Note (Middle C)';

  const setNoteState = (isDown) => {
    if (synthNode) {
      synthNode.port.postMessage(isDown);
    }
  };

  noteBtn.addEventListener('mousedown', () => setNoteState(true));
  noteBtn.addEventListener('mouseup', () => setNoteState(false));
  noteBtn.addEventListener('mouseleave', () => setNoteState(false));
  noteBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    setNoteState(true);
  });
  noteBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    setNoteState(false);
  });

  container.appendChild(noteBtn);

  const panel = document.querySelector('[data-control-panel]');
  if (panel && panel.parentNode) {
    panel.parentNode.insertBefore(container, panel);
  }
};

/**
 * Initializes AudioContext, registers the worklet, and builds graph.
 * @return {Promise<AudioContext>}
 */
export const setup = async () => {
  audioContext = new AudioContext();
  await audioContext.suspend();

  const processorUrl =
    new URL('synth-processor.js', import.meta.url).href;
  await audioContext.audioWorklet.addModule(processorUrl);

  synthNode = new AudioWorkletNode(audioContext, 'wasm-synth');
  volumeNode = new GainNode(audioContext, { gain: 0.25 });

  synthNode.connect(volumeNode).connect(audioContext.destination);
  mountControls();

  return audioContext;
};

/**
 * Plays an initial preview note on user gesture.
 * @param {AudioContext} context
 */
export const start = async (context) => {
  if (synthNode) {
    // Trigger an initial demonstration note (Middle C)
    synthNode.port.postMessage(true);
    setTimeout(() => {
      if (synthNode) {
        synthNode.port.postMessage(false);
      }
    }, 1000);
  }
};
