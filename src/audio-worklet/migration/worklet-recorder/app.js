// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

import createLinkFromAudioBuffer from './exporter.mjs';

// This enum states the current recording state
const recorderState = {
  UNINITIALIZED: 0,
  RECORDING: 1,
  FINISHED: 2,
};

const context = new AudioContext();

// Make the visulization more clear to the users
const WAVEFROM_SCALE_FACTOR = 5
let isRecording = false;
let recordingState = recorderState.UNINITIALIZED;

let recordButton = document.querySelector('#record');
let recordText = document.querySelector('#record-text');
let stopButton = document.querySelector('#stop');
let player = document.querySelector('#player');
let downloadLink = document.querySelector('#download-link');
let downloadButton = document.querySelector('#download-button');

// Wait for user interaction to initialize audio, as per specification.
if (recordingState === recorderState.UNINITIALIZED) {
  recordButton.disabled = false;
  recordButton.addEventListener('click', (element) => {
    init();
    isRecording = true;
    changeButtonStatus();
    recordText.textContent = 'Continue';
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
      latency: 0}
  });

  const micSourceNode = context.createMediaStreamSource(micStream);

  const recordingProperties = {
    numberOfChannels: micSourceNode.channelCount,
    sampleRate: context.sampleRate,
    maxFrameCount: context.sampleRate * 300
  };

  const recordingNode = await setupRecordingWorkletNode(recordingProperties);
  const gainNode = context.createGain();

  // We can pass this port across the app
  // and let components handle their relevant messages
  const visualizerCallback = setupVisualizers();
  const recordingCallback = handleRecording(
      recordingNode.port, recordingProperties);

  recordingNode.port.onmessage = (event) => {
    if (event.data.message === 'UPDATE_VISUALIZERS') {
      visualizerCallback(event);
    } else {
      recordingCallback(event);
    }
  };

  gainNode.gain.value = 0;

  micSourceNode
      .connect(recordingNode)
      .connect(gainNode)
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
  let recordingLength = 0;

  // If the max length is reached, we can no longer record.
  const recordingEventCallback = async (event) => {
    if (event.data.message === 'MAX_RECORDING_LENGTH_REACHED') {
      isRecording = false;
      stopButton.disabled = true;
      recordText.textContent = 'Reach the maximum length of';
      recordingState = recorderState.FINISHED;
      createRecord(recordingProperties, recordingLength, context.sampleRate,
          event.data.buffer);
    }
    if (event.data.message === 'UPDATE_RECORDING_LENGTH') {
      recordingLength = event.data.recordingLength;

      document.querySelector('#data-len').textContent =
          Math.round(recordingLength / context.sampleRate * 100)/100;
    }
    if (event.data.message === 'SHARE_RECORDING_BUFFER') {
      createRecord(recordingProperties, recordingLength, context.sampleRate,
          event.data.buffer);
    }
  };

  if (recordingState === recorderState.UNINITIALIZED) {
    isRecording = true;
    processorPort.postMessage({
      message: 'UPDATE_RECORDING_STATE',
      setRecording: isRecording,
    });
    changeButtonStatus();
    recordingState = recorderState.RECORDING;
  }

  recordButton.addEventListener('click', (e) => {
    isRecording = true;
    processorPort.postMessage({
      message: 'UPDATE_RECORDING_STATE',
      setRecording: isRecording,
    });
    changeButtonStatus();
  });

  stopButton.addEventListener('click', (e) => {
    isRecording = false;
    processorPort.postMessage({
      message: 'UPDATE_RECORDING_STATE',
      setRecording: isRecording,
    });
    changeButtonStatus();
  });

  return recordingEventCallback;
}

function changeButtonStatus() {
  // Inform processor that recording was paused.
  recordButton.disabled = isRecording ? true : false;
  stopButton.disabled = isRecording ? false: true;
  downloadButton.disabled = isRecording ? true: false;
}

/**
 * Sets up and handles calculations and rendering for all visualizers.
 * @return {function} Callback for visualizer events from the processor.
 */
function setupVisualizers() {
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
    if (isRecording) {
      const recordGain = gain;
      drawRecordingGain(recordGain * WAVEFROM_SCALE_FACTOR);
    }

    // Request render frame regardless.
    // If visualizers are disabled, function can still wait for enable.
    requestAnimationFrame(draw);
  }

  return visualizerEventCallback;
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
 * Creating the downloadable .wav file for the recorded voice and set
 * the download button clickable.
 * @param {object} recordingProperties Microphone channel count,
 *     for accurate recording length calculations.
 * @param {number} recordingLength The current length of recording
 * @param {number} sampleRate The sample rate of audio content
 * @param {number[]} dataBuffer The dataBuffer of recording
 */
const createRecord = (recordingProperties, recordingLength, sampleRate,
    dataBuffer) => {
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
