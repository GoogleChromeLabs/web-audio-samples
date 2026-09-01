// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

let audioContext = null;
let oscillatorNode = null;
let bitCrusherNode = null;
let paramBitDepth = null;
let paramReduction = null;

/**
 * Sets up the AudioContext, loads the worklet processor, and builds graph.
 * @return {Promise<AudioContext>} The initialized AudioContext.
 */
export const setup = async () => {
  audioContext = new AudioContext();
  await audioContext.suspend();

  const processorUrl =
    new URL('bit-crusher-processor.js', import.meta.url).href;
  await audioContext.audioWorklet.addModule(processorUrl);

  oscillatorNode = new OscillatorNode(audioContext, {
    type: 'sawtooth',
    frequency: 5000,
  });
  bitCrusherNode =
    new AudioWorkletNode(audioContext, 'bit-crusher-processor');

  paramBitDepth = bitCrusherNode.parameters.get('bitDepth');
  paramReduction = bitCrusherNode.parameters.get('frequencyReduction');

  oscillatorNode.connect(bitCrusherNode).connect(audioContext.destination);

  return audioContext;
};

/**
 * Starts audio rendering and applies parameter automations upon user gesture.
 * @param {AudioContext} context - The active AudioContext.
 */
export const start = async (context) => {
  if (oscillatorNode) {
    const now = context.currentTime;
    paramBitDepth.setValueAtTime(1, now);

    // `frequencyReduction` parameters will be automated and changing over
    // time. Thus its parameter array will have 128 values.
    paramReduction.setValueAtTime(0.01, now);
    paramReduction.linearRampToValueAtTime(0.1, now + 4);
    paramReduction.exponentialRampToValueAtTime(0.01, now + 8);

    try {
      oscillatorNode.start();
      oscillatorNode.stop(now + 8);
    } catch {
      // Node was already started.
    }
  }
};
