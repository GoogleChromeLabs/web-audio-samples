// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

import createLinkFromAudioBuffer from './exporter.mjs';

const context = new AudioContext();

// Arbitrary buffer size, not specific for a reason
const BUFFER_SIZE = 256;
// Make the visulization more clear to the users
const WAVEFROM_SCALE_FACTOR = 5
let recordingLength = 0;
let recordBuffer = [[], []];
let isRecording = false;
let initCount = 0;

let recordButton = document.querySelector('#record');
let recordText = document.querySelector('#record-text');
let stopButton = document.querySelector('#stop');
let player = document.querySelector('#player');
let downloadButton = document.querySelector('#download-button');
let downloadLink = document.querySelector('#download-link');

// Wait for user interaction to initialize audio, as per specification.
if (!initCount){
  recordButton.disabled = false;
  recordButton.addEventListener('click', (element) => {
    init();
    isRecording = true;
    initCount++;
    recordText.textContent = "Continue";
    changeButtonDisabled();
  }, {once: true});
}

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

  const gainNode = context.createGain();

  // Obtain samples passthrough function for visualizers
  const passSampleToVisualizers = setupVisualizers();
  const spNode =
      setupScriptProcessor(recordingProperties, passSampleToVisualizers);

  setupRecording(recordingProperties);

  gainNode.gain.value = 0;
  
  micSourceNode
      .connect(spNode)
      .connect(gainNode)
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
        window.alert("The recording length reach the max limit!");
        const finalRecordBuffer =
            createFinalRecordBuffer(recordingProperties);
        const audioFileUrl = createLinkFromAudioBuffer(finalRecordBuffer, true);
        player.src = audioFileUrl;
        downloadLink.href = audioFileUrl;
        downloadLink.download =
            `recording-${new Date().getMilliseconds().toString()}.wav`;
        downloadButton.disabled = false;
        stopButton.disabled = true;
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
    isRecording = true;
    changeButtonDisabled();
  });

  stopButton.addEventListener('click', (event) => {
    // When recording is paused, process clip.
    isRecording = false;
    const finalRecordBuffer = createFinalRecordBuffer(recordingProperties);
    prepareClip(finalRecordBuffer);
    changeButtonDisabled();
  });


}

function changeButtonDisabled() {
  recordButton.disabled = isRecording ? true : false;
  stopButton.disabled = isRecording ? false: true;
  downloadButton.disabled = isRecording ? true: false;
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
 * Sets up and handles calculations and rendering for all visualizers.
 * @return {function} Function to set current input samples for visualization.
 */
function setupVisualizers() {
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

  function draw() {
    if (currentSamples) {
      // Calculate current sample's average gain for visualizers to draw with.
      // We only need to calculate this value once per render frame.
      let currentSampleGain = 0;

      for (let i = 0; i < currentSamples.length; i++) {
        for (let j = 0; j < currentSamples[i].length; j++) {
          currentSampleGain += currentSamples[i][j];
        }
      }

      currentSampleGain /= (currentSamples.length * currentSamples[0].length);

      if (isRecording) {
        const recordGain = currentSampleGain;
        drawRecordingGain(recordGain * WAVEFROM_SCALE_FACTOR);
      }
    }

    // Request render frame regardless.
    // If visualizers are disabled, function can still wait for enable.
    requestAnimationFrame(draw);
  }

  return setCurrentSamples;
}

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
  let previousY = height / 2;
  // Adjust the amplitude value to increase or decrease the size of the waveform
  const amplitude = height * 2;

  function draw(currentSampleGain) {
    const centerY = height / 2 - currentSampleGain * amplitude;

    // Clear current Y-axis.
    canvasContext.clearRect(currentX, 0, 1, height);

    // Draw recording bar 1 ahead.
    canvasContext.fillStyle = 'red';
    canvasContext.fillRect(currentX + 1, 0, 1, height);

    // Draw line plot.
    canvasContext.beginPath();
    canvasContext.moveTo(currentX, previousY);
    canvasContext.lineTo(currentX + 1, centerY);
    canvasContext.strokeStyle = 'black';
    // Decrease the line width for better visibility
    canvasContext.lineWidth = 0.8;
    canvasContext.stroke();

    previousY = centerY;

    if (currentX < width - 2) {
      // Keep drawing new waveforms rightwards until the canvas is full.
      currentX++;
    } else {
      // If the waveform fills the canvas,
      // move it by one pixel to the left to make room.
      canvasContext.globalCompositeOperation = 'copy';
      canvasContext.drawImage(canvas, -1, 0);

      // Return to the original state, where new visuals
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
