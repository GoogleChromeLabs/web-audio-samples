// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

import createLinkFromAudioBuffer from './exporter.mjs';

const context = new AudioContext();

// Arbitrary buffer size, not specific for a reason
const BUFFER_SIZE = 256;
let recordingLength = 0;
let recordBuffer = [[], []];
let isRecording = false;
let isMonitoring = false;
let visualizationEnabled = true;

let recordButton = document.querySelector('#record');
let recordText = document.querySelector('#record-text');
let player = document.querySelector('#player');
let downloadButton = document.querySelector('#download-button');
let downloadLink = document.querySelector('#download-link');

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
      latency: 0
    },
  });

  const micSourceNode = context.createMediaStreamSource(micStream);

  // Prepare max recording buffer for recording.
  const recordingProperties = {
    numberOfChannels: 2,
    sampleRate: context.sampleRate,
    maxFrameCount: context.sampleRate * 300
  };

  // Obtain samples passthrough function for visualizers
  const passSampleToVisualizers = setupVisualizers();
  const spNode =
      setupScriptProcessor(recordingProperties, passSampleToVisualizers);

  const monitorNode = context.createGain();
  const inputGain = context.createGain();
  const medianEnd = context.createGain();

  setupMonitor(monitorNode);
  setupRecording(recordingProperties);

  micSourceNode
      .connect(inputGain)
      .connect(medianEnd)
      .connect(spNode)
      .connect(monitorNode)
      .connect(context.destination);
}

/**
 * Creates ScriptProcessor to record and track microphone audio.
 * @param {Object} recordingProperties The properties of the recording
 * @param {function} passSampleToVisualizers
 *    Function to pass current samples to visualizers.
 * @return {ScriptProcessorNode} ScriptProcessorNode to pass audio into.
 */
function setupScriptProcessor(recordingProperties, passSampleToVisualizers) {
  const processor = context.createScriptProcessor(BUFFER_SIZE);
  const currentSamples =
     new Array(recordingProperties.numberOfChannels).fill([]);

  // Main SPN callback. Handles recording data and tracking recording length.
  processor.onaudioprocess = function(event) {
    // Display current recording length.
    document.querySelector('#data-len').textContent =
        Math.round(recordingLength / recordingProperties.sampleRate * 100)/100;
    // Perform logic on all input channels, regardless of setup.
    for (let channel = 0; channel < currentSamples.length; channel++) {
      const inputData = event.inputBuffer.getChannelData(channel);

      // Provide current sample to visualizers.
      currentSamples[channel] = inputData;

      // While recording, feed data to recording buffer at the proper time.
      if (isRecording) {
        // FrameNumber has to be an INTEGER for using as an index in 2D array.
        // Since JS don't have INTEGER type, We use Math.floor to ensure the
        // recordingLength/BUFFER_SIZE is INTEGER.
        let frameNumber = Math.floor(recordingLength / BUFFER_SIZE);
        recordBuffer[channel][frameNumber] = 
            new Float32Array(currentSamples[channel]);
      }

      // Pass audio data through to next node.
      event.outputBuffer.copyToChannel(inputData, channel, 0);
    }

    // Update tracked recording length.
    if (isRecording) {
      recordingLength += BUFFER_SIZE;
      
      if (recordingLength > recordingProperties.maxFrameCount) {
        isRecording = !isRecording;

        const finalRecordBuffer =
            createFinalRecordBuffer(recordingProperties);
        const audioFileUrl = createLinkFromAudioBuffer(finalRecordBuffer, true);
        player.src = audioFileUrl;
        downloadLink.href = audioFileUrl;
        downloadLink.download =
            `recording-${new Date().getMilliseconds().toString()}.wav`;
        downloadButton.disabled = false;
        recordText.textContent = 'Ready to download 5 mins';
        recordButton.disabled = true;
      }
    }

    passSampleToVisualizers(currentSamples);
  };

  return processor;
}

/**
 * Set events and define callbacks for recording start/stop events.
 * @param {object} recordingProperties Buffer of the current recording.
 */
function setupRecording(recordingProperties) {
  recordButton.addEventListener('click', (event) => {
    isRecording = !isRecording;

    // When recording is paused, process clip.
    if (!isRecording) {
      const finalRecordBuffer = createFinalRecordBuffer(recordingProperties);
      prepareClip(finalRecordBuffer);
    }

    recordText.textContent = isRecording ? 'Stop' : 'Start';
    downloadButton.disabled = isRecording ? true: false;
  });
}

/**
 * An async function to create the audioFileURL and assign URL
 * to media player and download button.
 * @param {AudioBuffer} finalRecordBuffer This is the final
 * audio buffer which is created for audio context.
 */
async function prepareClip(finalRecordBuffer) {
  // Create recording file URL for playback and download.
  const audioFileUrl =
     createLinkFromAudioBuffer(finalRecordBuffer, true, recordingLength);

  player.src = audioFileUrl;
  downloadLink.href = audioFileUrl;
  downloadLink.download =
      `recording-${new Date().getMilliseconds().toString()}.wav`;
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

    monitorText.textContent = isMonitoring ? 'off' : 'on';
  });
}

/**
 * Sets up and handles calculations and rendering for all visualizers.
 * @return {function} Function to set current input samples for visualization.
 */
function setupVisualizers() {
  const drawLiveGain = setupLiveGainVis();
  const drawRecordingGain = setupRecordingGainVis();
  let currentSamples = [];
  let firstSamplesReceived = false;

  const setCurrentSamples = (newSamples) => {
    currentSamples = newSamples;

    if (!firstSamplesReceived) {
      draw();
      firstSamplesReceived = true;
    }
  };

  const visToggle = document.querySelector('#viz-toggle');
  visToggle.addEventListener('click', (event) => {
    visualizationEnabled = !visualizationEnabled;
    visToggle.querySelector('span').textContent =
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

      currentSampleGain /= (currentSamples.length * currentSamples[0].length);

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
 * Create the recording buffer with right size
 * @param {object} recordingProperties Properties of record buffer
 * @returns {AudioBuffer} Record buffer for current recording
 */
const createFinalRecordBuffer = (recordingProperties) => {
  const contextRecordBuffer = context.createBuffer(
      2, recordingLength, context.sampleRate);
  //The start index of each 256 float32Array
  let startIndex = 0;

  for (let frame = 0; frame < recordBuffer[0].length; frame++){
    for (let channel = 0; 
        channel < recordingProperties.numberOfChannels;
        channel++) {
      contextRecordBuffer
          .copyToChannel(recordBuffer[channel][frame], channel, startIndex);
    }
    startIndex += BUFFER_SIZE;
  }
  return contextRecordBuffer;
};
