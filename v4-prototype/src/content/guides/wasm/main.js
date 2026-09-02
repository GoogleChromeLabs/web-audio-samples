// Copyright (c) 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

let audioContext = null;
let oscillatorNode = null;
let wasmNode = null;

/**
 * Sets up AudioContext, registers the WASM worklet, and builds graph.
 * @return {Promise<AudioContext>}
 */
export const setup = async () => {
  audioContext = new AudioContext();
  await audioContext.suspend();

  const processorUrl =
    new URL('wasm-worklet-processor.js', import.meta.url).href;
  await audioContext.audioWorklet.addModule(processorUrl);

  oscillatorNode = new OscillatorNode(audioContext, {
    type: 'sine',
    frequency: 440,
  });

  wasmNode = new AudioWorkletNode(audioContext, 'wasm-worklet-processor');
  oscillatorNode.connect(wasmNode).connect(audioContext.destination);

  return audioContext;
};

/**
 * Starts oscillator playback on user gesture.
 * @param {AudioContext} context
 */
export const start = async (context) => {
  if (oscillatorNode) {
    try {
      oscillatorNode.start();
    } catch {
      // Node already started.
    }
  }
};
