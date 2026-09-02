// Copyright (c) 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import SharedBufferWorkletNode from './shared-buffer-worklet-node.js';

let audioContext = null;
let oscillatorNode = null;
let sbwNode = null;
let isStarted = false;
let isGraphReady = false;

/**
 * Initializes the AudioContext, registers the worklet, and creates graph.
 * @return {Promise<AudioContext>}
 */
export const setup = async () => {
  audioContext = new AudioContext();
  await audioContext.suspend();

  if (!window.crossOriginIsolated) {
    console.warn(
      '[SharedBuffer] Cross-Origin Isolation is not active. ' +
      'Attempting service worker fallback.'
    );
    if ('serviceWorker' in navigator) {
      try {
        const swUrl =
          new URL('coi-serviceworker.js', import.meta.url).href;
        const reg = await navigator.serviceWorker.register(swUrl);
        if (reg.active && !navigator.serviceWorker.controller) {
          window.location.reload();
        }
        reg.addEventListener('updatefound', () => {
          window.location.reload();
        });
      } catch (swErr) {
        console.warn('[SharedBuffer] Service worker fallback failed:', swErr);
      }
    }
  }

  const processorUrl =
    new URL('shared-buffer-worklet-processor.js', import.meta.url).href;
  await audioContext.audioWorklet.addModule(processorUrl);

  oscillatorNode = new OscillatorNode(audioContext, {
    type: 'sine',
    frequency: 440,
  });

  sbwNode = new SharedBufferWorkletNode(audioContext);

  sbwNode.onInitialized = () => {
    isGraphReady = true;
    oscillatorNode.connect(sbwNode).connect(audioContext.destination);
    if (isStarted) {
      try {
        oscillatorNode.start();
      } catch {
        // Node already started.
      }
    }
  };

  sbwNode.onError = (errorData) => {
    console.error('[SharedBufferWorklet] Error:', errorData.detail);
    let errEl = document.getElementById('sab-error-alert');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.id = 'sab-error-alert';
      errEl.className =
        'p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 ' +
        'text-xs font-mono';
      const panel = document.querySelector('[data-control-panel]');
      if (panel && panel.parentNode) {
        panel.parentNode.insertBefore(errEl, panel);
      }
    }
    errEl.textContent = `[SharedBuffer Error] ${errorData.detail}`;
  };

  return audioContext;
};

/**
 * Starts audio playback upon user gesture.
 * @param {AudioContext} context
 */
export const start = async (context) => {
  isStarted = true;
  if (isGraphReady && oscillatorNode) {
    try {
      oscillatorNode.start();
    } catch {
      // Node already started.
    }
  }
};
