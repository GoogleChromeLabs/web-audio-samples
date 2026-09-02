// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import VUMeter from './VUMeter.js';

let audioContext = null;
let micNode = null;
let volumeMeterNode = null;
let mediaStream = null;
let vuMeter = null;

/**
 * Sets up the AudioContext, loads the worklet processor, and builds graph.
 * @return {Promise<AudioContext>} The initialized AudioContext.
 */
export const setup = async () => {
  audioContext = new AudioContext();
  await audioContext.suspend();

  const processorUrl =
    new URL('volume-meter-processor.js', import.meta.url).href;
  await audioContext.audioWorklet.addModule(processorUrl);

  volumeMeterNode = new AudioWorkletNode(audioContext, 'volume-meter');

  // Mount canvas if not already present in DOM
  let canvas = document.getElementById('vu-meter');
  if (!canvas) {
    const container = document.createElement('div');
    container.id = 'vu-meter-container';
    container.className =
      'my-2 flex flex-col items-center justify-center';

    canvas = document.createElement('canvas');
    canvas.id = 'vu-meter';
    canvas.width = 60;
    canvas.height = 140;
    canvas.className =
      'rounded border border-blue-400/40 bg-transparent';

    const label = document.createElement('span');
    label.className =
      'mt-2 text-[11px] font-mono font-medium text-slate-500 uppercase';
    label.textContent = 'Microphone Input Level';

    container.appendChild(canvas);
    container.appendChild(label);

    const panel = document.querySelector('[data-control-panel]');
    if (panel && panel.parentNode) {
      panel.parentNode.insertBefore(container, panel);
    }
  }

  vuMeter = new VUMeter(canvas, {
    minDecibel: -40,
    fifoSize: 6,
    backgroundColor: 'transparent',
  });

  // Initial draw at zero volume
  vuMeter.reset();

  audioContext.addEventListener('statechange', () => {
    if (audioContext.state === 'suspended' && vuMeter) {
      vuMeter.reset();
    }
  });

  volumeMeterNode.port.onmessage = ({data}) => {
    if (vuMeter) {
      vuMeter.draw(data);
    }
  };

  volumeMeterNode.connect(audioContext.destination);

  return audioContext;
};

/**
 * Requests microphone stream and connects it to the worklet on user gesture.
 * @param {AudioContext} context - The active AudioContext.
 */
export const start = async (context) => {
  if (!micNode && navigator.mediaDevices?.getUserMedia) {
    try {
      mediaStream =
        await navigator.mediaDevices.getUserMedia({audio: true});
      micNode = context.createMediaStreamSource(mediaStream);
      micNode.connect(volumeMeterNode);
    } catch (err) {
      console.warn('Microphone access denied or unavailable:', err);
    }
  }
};
