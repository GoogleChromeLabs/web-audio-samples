// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

let audioContext = null;
let oscillatorNode = null;

/**
 * Sets up the AudioContext, loads the worklet processor, and builds graph.
 * @return {Promise<AudioContext>} The initialized AudioContext.
 */
export const setup = async () => {
  audioContext = new AudioContext();
  await audioContext.suspend();

  const processorUrl =
    new URL('bypass-processor.js', import.meta.url).href;
  await audioContext.audioWorklet.addModule(processorUrl);

  oscillatorNode = new OscillatorNode(audioContext);
  const bypasser = new AudioWorkletNode(audioContext, 'bypass-processor');

  oscillatorNode.connect(bypasser).connect(audioContext.destination);

  return audioContext;
};

/**
 * Starts audio rendering following a user gesture.
 * @param {AudioContext} context - The active AudioContext.
 */
export const start = async (context) => {
  if (oscillatorNode) {
    try {
      oscillatorNode.start();
    } catch {
      // Node was already started.
    }
  }
};
