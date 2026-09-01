// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

let audioContext = null;
let oscillatorNode = null;
let filterNode = null;

/**
 * Sets up the AudioContext, loads the worklet processor, and builds graph.
 * @return {Promise<AudioContext>} The initialized AudioContext.
 */
export const setup = async () => {
  audioContext = new AudioContext();
  await audioContext.suspend();

  const processorUrl =
    new URL('one-pole-processor.js', import.meta.url).href;
  await audioContext.audioWorklet.addModule(processorUrl);

  oscillatorNode = new OscillatorNode(audioContext, {type: 'sawtooth'});
  filterNode = new AudioWorkletNode(audioContext, 'one-pole-processor');

  oscillatorNode.connect(filterNode).connect(audioContext.destination);

  return audioContext;
};

/**
 * Starts audio rendering and schedules filter frequency sweep on user gesture.
 * @param {AudioContext} context - The active AudioContext.
 */
export const start = async (context) => {
  if (oscillatorNode && filterNode) {
    const frequencyParam = filterNode.parameters.get('frequency');
    const now = context.currentTime;

    frequencyParam.cancelScheduledValues(now);
    frequencyParam
      .setValueAtTime(200, now)
      .exponentialRampToValueAtTime(context.sampleRate * 0.5, now + 4.0)
      .exponentialRampToValueAtTime(200, now + 8.0);

    try {
      oscillatorNode.start();
    } catch {
      // Node was already started.
    }
  }
};
