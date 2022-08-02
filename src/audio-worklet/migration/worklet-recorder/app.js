// Copyright (c) 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

import createLinkFromAudioBuffer from './exporter.mjs';

const context = new AudioContext();

// Arbitrary buffer size, not specific for a reason
const BUFFER_SIZE = 256;
let recordingLength = 0;
let isRecording = false;
let isMonitoring = false;
let visualizationEnabled = true;

// Wait for user interaction to initialize audio, as per specification.
document.addEventListener('click', (element) => {
  init();
  document.querySelector('#click-to-start').remove();
}, {once: true});

/**
 * Defines overall audio chain and initializes all functionality.
 */
async function init() {
  if (context.state === 'suspended') {
    await context.resume();
  }

  // Get user's microphone and connect it to the AudioContext.
  const micStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      autoGainControl: false,
      noiseSuppression: false,
      latency: 0,
    },
  });

  const micSourceNode = context.createMediaStreamSource(micStream);

  // Prepare buffer for recording.
  const recordBuffer = context.createBuffer(
      2,
      // 10 seconds seems reasonable for demo purposes.
      context.sampleRate * 10,
      context.sampleRate,
  );

  // Obtain samples passthrough function for visualizers
  const passSampleToVisualizers = setupVisualizers();
  const recordingNode = await setupRecordingWorkletNode(recordBuffer, passSampleToVisualizers);

  const monitorNode = context.createGain();
  const inputGain = context.createGain();
  const medianEnd = context.createGain();

  setupMonitor(monitorNode);
  setupRecording(recordBuffer);

  micSourceNode
      .connect(inputGain)
      .connect(medianEnd)
      .connect(recordingNode)
      .connect(monitorNode)
      .connect(context.destination);
}

/**
 * Creates ScriptProcessor to record and track microphone audio.
 * @param {AudioBuffer} recordBuffer
 * @param {function} passSampleToVisualizers
 *    Function to pass current samples to visualizers.
 * @return {ScriptProcessorNode} ScriptProcessorNode to pass audio into.
 */
async function setupRecordingWorkletNode(recordBuffer, passSampleToVisualizers) {
  // Must await bc its promise based right???
  const WorkletRecordingNode =
      await context.audioWorklet.addModule("recording-processor.js").then(() => {
        const out = new AudioWorkletNode(context, "recording-processor");

        out.port.onmessage = (event) => {
          passSampleToVisualizers(event.data);
        }

        return out;
      });

  WorkletRecordingNode.port.postMessage("hi recording node!!! :)))")

  return WorkletRecordingNode;
}

/**
 * Set events and define callbacks for recording start/stop events.
 * @param {AudioBuffer} recordBuffer Buffer of the current recording.
 */
function setupRecording(recordBuffer) {
  const recordButton = document.querySelector('#record');
  const recordText = recordButton.querySelector('span');
  const player = document.querySelector('#player');
  const downloadButton = document.querySelector('#download');

  async function prepareClip() {
    // Create recording file URL for playback and download.
    const wavUrl = createLinkFromAudioBuffer(recordBuffer, true);

    player.src = wavUrl;
    downloadButton.src = wavUrl;
    downloadButton.download = 'recording.wav';

    // Display current recording length.
    document.querySelector('#data-len').innerHTML =
        Math.round(recordingLength / recordBuffer.sampleRate * 100)/100;
  }

  recordButton.addEventListener('click', (e) => {
    isRecording = !isRecording;

    // When recording is paused, process clip.
    if (!isRecording) {
      prepareClip();
    }

    recordText.innerHTML = isRecording ? 'Stop' : 'Start';
  });
}

/**
 * Sets up monitor functionality, allowing user to listen to mic audio live.
 * @param {GainNode} monitorNode Gain node to adjust for monitor gain.
 */
function setupMonitor(monitorNode) {
  // Leave audio volume at zero by default.
  monitorNode.gain.value = 0;

  const monitorButton = document.querySelector('#monitor');
  const monitorText = monitorButton.querySelector('span');

  monitorButton.addEventListener('click', (event) => {
    isMonitoring = !isMonitoring;
    const newVal = isMonitoring ? 1 : 0;

    // Set gain to quickly but smoothly slide to new value.
    monitorNode.gain.setTargetAtTime(newVal, context.currentTime, 0.01);

    monitorText.innerHTML = isMonitoring ? 'off' : 'on';
  });
}

/**
 * Sets up and handles calculations and rendering for all visualizers.
 * @return {function} Function to set current input samples for visualization.
 */
function setupVisualizers() {
  const drawLiveGain = setupLiveGainVis();
  const drawRecordingGain = setupRecordingGainVis();
  let currentSamples;
  let firstSamplesReceived = false;

  const setCurrentSamples = (newSamples) => {
    currentSamples = newSamples;

    if (!firstSamplesReceived) {
      draw();
      firstSamplesReceived = true;
    }
  };

  const visToggle = document.querySelector('#viz-toggle');
  visToggle.addEventListener('click', (e) => {
    visualizationEnabled = !visualizationEnabled;
    visToggle.querySelector('span').innerHTML =
      visualizationEnabled ? 'Pause' : 'Play';
  });

  function draw() {
    if (visualizationEnabled && currentSamples) {
      // Calculate current sample's average gain for visualizers to draw with.
      // We only need to calculate this value once per render frame.
      let currentSampleGain = 0;

      for (let i = 0; i < currentSamples.length; i++) {
        for (let j = 0; j < currentSamples[i].length; j++) {
          currentSampleGain += currentSamples[i][j];
        }
      }

      currentSampleGain /= (currentSamples.length *currentSamples[0].length);

      drawLiveGain(currentSampleGain);

      if (isRecording) {
        drawRecordingGain(currentSampleGain);
      }
    }

    // Request render frame regardless.
    // If visualizers are disabled, function can still wait for enable.
    requestAnimationFrame(draw);
  }


  return setCurrentSamples;
}

/**
 * Prepares and defines render function for the live gain visualizer.
 * @return {function} Draw function to render incoming live audio.
 */
const setupLiveGainVis = () => {
  const canvas = document.querySelector('#live-canvas');
  const canvasContext = canvas.getContext('2d');

  const width = canvas.width;
  const height = canvas.height;

  const drawStart = width-1;

  function draw(currentSampleGain) {
    // Determine center and height.
    const centerY = ((1 - currentSampleGain) * height) / 2;
    const gainHeight = currentSampleGain * height;

    // Draw gain bar.
    canvasContext.fillStyle = 'black';
    canvasContext.fillRect(drawStart, centerY, 1, gainHeight);

    // Copy visualizer left.
    canvasContext.globalCompositeOperation = 'copy';
    canvasContext.drawImage(canvas, -1, 0);

    // Return to original state, where new visuals.
    // are drawn without clearing the canvas.
    canvasContext.globalCompositeOperation = 'source-over';
  }

  return draw;
};

/**
 * Prepares and defines render function for the recording gain visualizer.
 * @return {function} Draw function to render incoming recorded audio.
 */
function setupRecordingGainVis() {
  const canvas = document.querySelector('#recording-canvas');
  const canvasContext = canvas.getContext('2d');

  const width = canvas.width;
  const height = canvas.height;

  canvasContext.fillStyle = 'red';
  canvasContext.fillRect(0, 0, 1, 1);

  let currX = 0;

  function draw(currentSampleGain) {
    const centerY = ((1 - currentSampleGain) * height) / 2;
    const gainHeight = currentSampleGain * height;

    // Clear current Y-axis.
    canvasContext.clearRect(currX, 0, 1, height);

    // Draw recording bar 1 ahead.
    canvasContext.fillStyle = 'red';
    canvasContext.fillRect(currX+1, 0, 1, height);

    // Draw current gain.
    canvasContext.fillStyle = 'black';
    canvasContext.fillRect(currX, centerY, 1, gainHeight);

    if (currX < width - 2) {
      // Keep drawing new waveforms rightwards until canvas is full.
      currX++;
    } else {
      // If the waveform fills the canvas,
      // move it by one pixel to the left to make room.
      canvasContext.globalCompositeOperation = 'copy';
      canvasContext.drawImage(canvas, -1, 0);

      // Return to original state, where new visuals
      // are drawn without clearing the canvas.
      canvasContext.globalCompositeOperation = 'source-over';
    }
  }

  return draw;
}
