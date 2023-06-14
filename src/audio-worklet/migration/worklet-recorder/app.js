// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

import createLinkFromAudioBuffer from './exporter.mjs';
import WaveformDrawer from '../../../library/waveform.js';

// This enum states the current recording state
const RecorderStates = {
  UNINITIALIZED: 0,
  RECORDING: 1,
  PAUSED: 2,
  FINISHED: 3,
};

const context = new AudioContext();

// Make the visulization clearer to the users
const SCALE_FACTOR = 10;
// Make the visulization of vu meter more clear to the users
const MAX_GAIN = 1;
let recordingState = RecorderStates.UNINITIALIZED;
const waveformDrawer = new WaveformDrawer('#recording-canvas');

let recordButton = document.querySelector('#record');
let recordText = document.querySelector('#record-text');
let stopButton = document.querySelector('#stop');
let player = document.querySelector('#player');
let downloadLink = document.querySelector('#download-link');
let downloadButton = document.querySelector('#download-button');

recordButton.disabled = false;

// Wait for user interaction to initialize audio, as per specification.
recordButton.disabled = false;
recordButton.addEventListener('click', (element) => {
  initializeAudio();
  changeButtonStatus();
  recordText.textContent = 'Continue';
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
  const analyser = context.createAnalyser();

  // We can pass this port across the app
  // and let components handle their relevant messages
  const visualizerCallback = setupVisualizers(analyser);
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
      .connect(analyser)
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
      stopButton.disabled = true;
      recordText.textContent = 'Reached the maximum length of';
      recordingState = RecorderStates.FINISHED;
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

  if (recordingState === RecorderStates.UNINITIALIZED) {
    recordingState = RecorderStates.RECORDING;
    processorPort.postMessage({
      message: 'UPDATE_RECORDING_STATE',
      setRecording: true,
    });
    changeButtonStatus();
  }

  recordButton.addEventListener('click', (e) => {
    recordingState = RecorderStates.RECORDING;
    processorPort.postMessage({
      message: 'UPDATE_RECORDING_STATE',
      setRecording: true,
    });
    changeButtonStatus();
  });

  stopButton.addEventListener('click', (e) => {
    recordingState = RecorderStates.PAUSED;
    processorPort.postMessage({
      message: 'UPDATE_RECORDING_STATE',
      setRecording: false,
    });
    changeButtonStatus();
  });

  return recordingEventCallback;
}

function changeButtonStatus() {
  let isRecording = recordingState === RecorderStates.RECORDING;
  recordButton.disabled = isRecording ? true : false;
  stopButton.disabled = isRecording ? false: true;
  downloadButton.disabled = isRecording ? true: false;
}

/**
 * Sets up and handles calculations and rendering for all visualizers.
 * @param {AnalyserNode} analyser The analyser node will then capture 
 * audio data using a Fast Fourier Transform (fft) in a certain frequency domain
 * depending on what you specify as the AnalyserNode.fftSize property value
 * @return {function} Callback for visualizer events from the processor.
 */
function setupVisualizers(analyser) {
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
    if (recordingState === RecorderStates.RECORDING) {
      const recordGain = gain;
      drawVUMeter(recordGain);
      waveformDrawer.drawWaveform(analyser);
    }

    // Request render frame regardless.
    // If visualizers are disabled, function can still wait for enable.
    requestAnimationFrame(draw);
  }

  return visualizerEventCallback;
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
