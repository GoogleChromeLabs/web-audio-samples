// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

import createLinkFromAudioBuffer from './exporter.mjs';

const context = new AudioContext();

// Make the visulization more clear to the users
const WAVEFROM_SCALE_FACTOR = 5
let isRecording = false;
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
      latency: 0}
  });

  const micSourceNode = context.createMediaStreamSource(micStream);

  const recordingProperties = {
    numberOfChannels: micSourceNode.channelCount,
    sampleRate: context.sampleRate,
    maxFrameCount: context.sampleRate * 300
  };

  const recordingNode = await setupRecordingWorkletNode(recordingProperties);
  const monitorNode = context.createGain();

  // We can pass this port across the app
  // and let components handle their relevant messages
  const visualizerCallback = setupVisualizers(monitorNode);
  const recordingCallback = handleRecording(
      recordingNode.port, recordingProperties);

  setupMonitor(monitorNode);

  recordingNode.port.onmessage = (event) => {
    if (event.data.message === 'UPDATE_VISUALIZERS') {
      visualizerCallback(event);
    } else {
      recordingCallback(event);
    }
  };

  micSourceNode
      .connect(recordingNode)
      .connect(monitorNode)
      .connect(context.destination);
}

/**
 * Creates ScriptProcessor to record and track microphone audio.
 * @param {object} recordingProperties
 * @param {number} properties.numberOfChannels
 * @param {number} properties.sampleRate
 * @param {number} properties.maxFrameCount
 * @return {AudioWorkletNode} Recording node related components for the app.
 */
async function setupRecordingWorkletNode(recordingProperties) {
  await context.audioWorklet.addModule('recording-processor.js');

  const WorkletRecordingNode = new AudioWorkletNode(
      context,
      'recording-processor',
      {
        processorOptions: recordingProperties,
      },
  );

  return WorkletRecordingNode;
}

/**
 * Set events and define callbacks for recording start/stop events.
 * @param {MessagePort} processorPort
 *     Processor port to send recording state events to
 * @param {object} recordingProperties Microphone channel count,
 *     for accurate recording length calculations.
 * @param {number} properties.numberOfChannels
 * @param {number} properties.sampleRate
 * @param {number} properties.maxFrameCount
 * @return {function} Callback for recording-related events.
 */
function handleRecording(processorPort, recordingProperties) {
  const recordButton = document.querySelector('#record');
  const recordText = document.querySelector('#record-text');
  const player = document.querySelector('#player');
  const downloadLink = document.querySelector('#download-link');
  const downloadButton = document.querySelector('#download-button');

  let recordingLength = 0;

  // If the max length is reached, we can no longer record.
  const recordingEventCallback = async (event) => {
    if (event.data.message === 'MAX_RECORDING_LENGTH_REACHED') {
      isRecording = false;
      recordText.textContent = 'Ready to download 5 mins';
      recordButton.disabled = true;
      createRecord(recordingProperties, recordingLength, context.sampleRate,
          downloadLink, downloadButton, event.data.buffer, player);
    }
    if (event.data.message === 'UPDATE_RECORDING_LENGTH') {
      recordingLength = event.data.recordingLength;

      document.querySelector('#data-len').textContent =
          Math.round(recordingLength / context.sampleRate * 100)/100;
    }
    if (event.data.message === 'SHARE_RECORDING_BUFFER') {
      createRecord(recordingProperties, recordingLength, context.sampleRate,
          downloadLink, downloadButton, event.data.buffer, player);
    }
  };

  recordButton.addEventListener('click', (e) => {
    isRecording = !isRecording;

    // Inform processor that recording was paused.
    processorPort.postMessage({
      message: 'UPDATE_RECORDING_STATE',
      setRecording: isRecording,
    });

    recordText.textContent = isRecording ? 'Stop' : 'Start';
    downloadButton.disabled = isRecording ? true : false;
  });

  return recordingEventCallback;
}

/**
 * Sets up monitor functionality, allowing user to listen to mic audio live.
 * @param {GainNode} monitorNode Gain node to adjust for monitor gain.
 */
function setupMonitor(monitorNode) {
  // Leave audio volume at zero by default.
  monitorNode.gain.value = 0;

  let isMonitoring = false;

  const monitorButton = document.querySelector('#monitor');
  const monitorText = monitorButton.querySelector('span');

  monitorButton.addEventListener('click', (event) => {
    isMonitoring = !isMonitoring;
    const newVal = isMonitoring ? 1 : 0;

    // Set gain to quickly but smoothly slide to new value.
    monitorNode.gain.setTargetAtTime(newVal, context.currentTime, 0.01);

    monitorText.textContent = isMonitoring ? 'off' : 'on';
  });
}

/**
 * Sets up and handles calculations and rendering for all visualizers.
 * @param {GainNode} monitorNode Gain node to adjust for monitor gain.
 * @return {function} Callback for visualizer events from the processor.
 */
function setupVisualizers(monitorNode) {
  const drawLiveGain = setupLiveGainVis();
  const drawRecordingGain = setupRecordingGainVis();

  let initialized = false;
  let gain = 0;

  // Wait for processor to start sending messages before beginning to render.
  const visualizerEventCallback = async (event) => {
    if (event.data.message === 'UPDATE_VISUALIZERS') {
      gain = event.data.gain;

      if (!initialized) {
        initialized = true;
        draw();
      }
    }
  };

  function draw() {
    if (visualizationEnabled) {
      const liveGain = gain * monitorNode.gain.value;
      drawLiveGain(liveGain * WAVEFROM_SCALE_FACTOR);
    }

    if (isRecording) {
      const recordGain = gain;
      drawRecordingGain(recordGain * WAVEFROM_SCALE_FACTOR);
    }

    // Request render frame regardless.
    // If visualizers are disabled, function can still wait for enable.
    requestAnimationFrame(draw);
  }

  const visToggle = document.querySelector('#viz-toggle');
  visToggle.addEventListener('click', (e) => {
    visualizationEnabled = !visualizationEnabled;
    visToggle.querySelector('span').textContent =
      visualizationEnabled ? 'Pause' : 'Play';
  });

  return visualizerEventCallback;
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

  let currentX = 0;

  function draw(currentSampleGain) {
    const centerY = ((1 - currentSampleGain) * height) / 2;
    const gainHeight = currentSampleGain * height;

    // Clear current Y-axis.
    canvasContext.clearRect(currentX, 0, 1, height);

    // Draw recording bar 1 ahead.
    canvasContext.fillStyle = 'red';
    canvasContext.fillRect(currentX+1, 0, 1, height);

    // Draw current gain.
    canvasContext.fillStyle = 'black';
    canvasContext.fillRect(currentX, centerY, 1, gainHeight);

    if (currentX < width - 2) {
      // Keep drawing new waveforms rightwards until canvas is full.
      currentX++;
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

/**
 * Creating the downloadable .wav file for the recorded voice and set
 * the download button clickable.
 * @param {object} recordingProperties Microphone channel count,
 *     for accurate recording length calculations.
 * @param {number} recordingLength The current length of recording
 * @param {number} sampleRate The sample rate of audio content
 * @param {object} downloadLink The download link for recording file
 * @param {object} downloadButton The download button in web
 * @param {number[]} dataBuffer The dataBuffer of recording
 * @param {object} player The audio player in the web
 */
const createRecord = (recordingProperties, recordingLength, sampleRate,
    downloadLink, downloadButton, dataBuffer, player) => {
  const recordingBuffer = context.createBuffer(
      recordingProperties.numberOfChannels,
      recordingLength,
      sampleRate);

  for (let i = 0; i < recordingProperties.numberOfChannels; i++) {
    recordingBuffer.copyToChannel(dataBuffer[i], i, 0);
  }

  const audioFileUrl = createLinkFromAudioBuffer(recordingBuffer, true);

  player.src = audioFileUrl;
  downloadLink.href = audioFileUrl;
  downloadLink.download =
      `recording-${new Date().getMilliseconds().toString()}.wav`;
  downloadButton.disabled = false;
};
