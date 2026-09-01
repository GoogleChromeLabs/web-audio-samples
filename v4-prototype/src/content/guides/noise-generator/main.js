// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

let audioContext = null;
let modulatorNode = null;
let modGainNode = null;
let noiseGeneratorNode = null;

/**
 * Sets up the AudioContext, loads the worklet processor, and builds graph.
 * @return {Promise<AudioContext>} The initialized AudioContext.
 */
export const setup = async () => {
  audioContext = new AudioContext();
  await audioContext.suspend();

  const processorUrl =
    new URL('noise-generator.js', import.meta.url).href;
  await audioContext.audioWorklet.addModule(processorUrl);

  modulatorNode = new OscillatorNode(audioContext, {
    frequency: 0.5,
  });
  modGainNode = new GainNode(audioContext, {
    gain: 0.75,
  });
  noiseGeneratorNode =
    new AudioWorkletNode(audioContext, 'noise-generator');

  noiseGeneratorNode.connect(audioContext.destination);

  // Connect the oscillator to 'amplitude' AudioParam.
  const paramAmp = noiseGeneratorNode.parameters.get('amplitude');
  modulatorNode.connect(modGainNode).connect(paramAmp);

  return audioContext;
};

/**
 * Starts audio rendering following a user gesture.
 * @param {AudioContext} context - The active AudioContext.
 */
export const start = async (context) => {
  if (modulatorNode) {
    try {
      modulatorNode.start();
    } catch {
      // Node was already started.
    }
  }
};
