// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

import createLinkFromAudioBuffer from './exporter.mjs';
import Waveform from '../../../library/Waveform.js';

// This enum states the current recording state
const RecorderStates = {
  UNINITIALIZED: 0,
  RECORDING: 1,
  PAUSED: 2,
  FINISHED: 3,
};

const context = new AudioContext();

// Arbitrary buffer size, not specific for a reason
const BUFFER_SIZE = 256;
// Make the visualization clearer to the users
const SCALE_FACTOR = 10;
// Make the visualization of vu meter more clear to the users
const MAX_GAIN = 1;

let recordingLength = 0;
let recordBuffer = [[], []];
let recordingState = RecorderStates.UNINITIALIZED;

let recordButton = document.querySelector('#record');
let recordText = document.querySelector('#record-text');
let stopButton = document.querySelector('#stop');
let player = document.querySelector('#player');
let downloadButton = document.querySelector('#download-button');
let downloadLink = document.querySelector('#download-link');

recordButton.disabled = false;

// Wait for user interaction to initialize audio, as per specification.
recordButton.disabled = false;
recordButton.addEventListener('click', (element) => {
  initializeAudio();
  recordingState = RecorderStates.RECORDING;
  recordText.textContent = 'Continue';
  changeButtonStatus();
}, {once: true});

/**
 * Defines overall audio chain and initializes all functionality.
 */
async function initializeAudio() {
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
  const gainNode = new GainNode(context);
  const analyserNode = new AnalyserNode(context);

  const waveform = new Waveform('#recording-canvas', analyserNode, 32);

  // Prepare max recording buffer for recording.
  const recordingProperties = {
    numberOfChannels: 2,
    sampleRate: context.sampleRate,
    maxFrameCount: context.sampleRate * 300
  };


  // Obtain samples passthrough function for visualizers
  const passSampleToVisualizers = setupVisualizers(waveform);
  const spNode =
      setupScriptProcessor(recordingProperties, passSampleToVisualizers);

  setupRecording(recordingProperties);

  gainNode.gain.value = 0;
  
  micSourceNode
      .connect(analyserNode)
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
      if (recordingState === RecorderStates.RECORDING) {
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
    if (recordingState === RecorderStates.RECORDING) {
      recordingLength += BUFFER_SIZE;
      if (recordingLength > recordingProperties.maxFrameCount) {
        recordingState = RecorderStates.FINISHED;
        recordText.textContent = 'Reached the maximum length of';
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
    recordingState = RecorderStates.RECORDING;
    changeButtonStatus();
  });

  stopButton.addEventListener('click', (event) => {
    // When recording is paused, process clip.
    recordingState = RecorderStates.PAUSED;
    const finalRecordBuffer = createFinalRecordBuffer(recordingProperties);
    prepareClip(finalRecordBuffer);
    changeButtonStatus();
  });

}

function changeButtonStatus() {
  let isRecording = recordingState === RecorderStates.RECORDING;
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
 * @param {Waveform} waveform An instance of the Waveform object for visualization.
 * @return {function} Function to set current input samples for visualization.
 */
function setupVisualizers(waveform) {
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

      if (recordingState === RecorderStates.RECORDING) {
        const recordGain = currentSampleGain;
        drawVUMeter(recordGain);
        waveform.draw();
      }
    }

    // Request render frame regardless.
    // If visualizers are disabled, function can still wait for enable.
    requestAnimationFrame(draw);
  }

  return setCurrentSamples;
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

  for (let frame = 0; frame < recordBuffer[0].length; frame++) {
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

function drawVUMeter(volume) {
  var canvas = document.getElementById('vu-meter');
  var ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  var meterHeight = canvas.height *
      (volume / MAX_GAIN) * SCALE_FACTOR;
  
  ctx.fillStyle = '#f00';
  ctx.fillRect(0, canvas.height - meterHeight, canvas.width, meterHeight);
  
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height * 0.2);
  ctx.lineTo(canvas.width, canvas.height * 0.2);
  ctx.moveTo(0, canvas.height * 0.4);
  ctx.lineTo(canvas.width, canvas.height * 0.4);
  ctx.moveTo(0, canvas.height * 0.6);
  ctx.lineTo(canvas.width, canvas.height * 0.6);
  ctx.moveTo(0, canvas.height * 0.8);
  ctx.lineTo(canvas.width, canvas.height * 0.8);
  ctx.stroke();
}
