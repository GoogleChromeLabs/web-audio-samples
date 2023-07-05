// Copyright (c) 2022 The Chromium Authors. All rights reserved.  Use
// of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

import createLinkFromAudioBuffer from './exporter.mjs';
import Waveform from '../../../library/Waveform.js';
import VUMeter from '../../../library/VUMeter.js';

// This enum states the current recording state.
const RecorderStates = {
  UNINITIALIZED: 0,
  RECORDING: 1,
  PAUSED: 2,
  FINISHED: 3,
};

const context = new AudioContext();

let recordingState = RecorderStates.UNINITIALIZED;

let recordButton = document.querySelector('#record');
let recordText = document.querySelector('#record-text');
let stopButton = document.querySelector('#stop');
let player = document.querySelector('#player');
let downloadLink = document.querySelector('#download-link');
let downloadButton = document.querySelector('#download-button');

recordButton.disabled = false;

// Wait for user interaction to initialize audio, as per
// specification.
recordButton.disabled = false;
recordButton.addEventListener('click', (element) => {
  initializeAudio();
  changeButtonStatus();
  recordText.textContent = 'Continue';
}, {once: true});

/**
 * Define overall audio chain and initializes all functionality.
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

  const micSourceNode = new MediaStreamAudioSourceNode(context, 
      {mediaStream: micStream});
  const gainNode = new GainNode(context);
  const analyserNode = new AnalyserNode(context);

  const recordingProperties = {
    numberOfChannels: micSourceNode.channelCount,
    sampleRate: context.sampleRate,
    maxFrameCount: context.sampleRate * 300
  };

  const recordingNode = await setupRecordingWorkletNode(recordingProperties);

  const waveform = new Waveform('#recording-canvas', analyserNode, 32);
  const vuMeter = new VUMeter('#vu-meter', -40, analyserNode, 32, 6);

  // We can pass this port across the app and let components handle
  // their relevant messages.
  const visualizerCallback = setupVisualizers(waveform, vuMeter);
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
      .connect(analyserNode)
      .connect(recordingNode)
      .connect(gainNode)
      .connect(context.destination);
}

/**
 * Create and set up a WorkletNode to record audio from a microphone.
 * @param {object} recordingProperties
 * @return {AudioWorkletNode} Recording node related components for
 * the app.
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
 * @param {MessagePort} processorPort Processor port to send recording
 * state events to.
 * @param {object} recordingProperties Microphone channel count, for
 * accurate recording length calculations.
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
 * Set up and handles calculations and rendering for all visualizers.
 * @param {Waveform} waveform An instance of the Waveform object for
 * visualization.
 * @param {VUMeter} vuMeter An instance of the Waveform object for
 * visualization.
 * @return {function} Callback for visualizer events from the
 * processor.
 */
function setupVisualizers(waveform, vuMeter) {
  let initialized = false;

  // Wait for processor to start sending messages before beginning to
  // render.
  const visualizerEventCallback = async (event) => {
    if (event.data.message === 'UPDATE_VISUALIZERS') {

      if (!initialized) {
        initialized = true;
        draw();
      }
    }
  };

  function draw() {
    if (recordingState === RecorderStates.RECORDING) {
      vuMeter.draw();
      waveform.draw();
    }

    // Request render frame regardless.  If visualizers are disabled,
    // function can still wait for enable.
    requestAnimationFrame(draw);
  }

  return visualizerEventCallback;
}

/**
 * Create the downloadable .wav file for the recorded voice and set
 * the download button clickable.
 * @param {object} recordingProperties Microphone channel count, for
 * accurate recording length calculations.
 * @param {number} recordingLength The current length of recording.
 * @param {number} sampleRate The sample rate of audio content.
 * @param {number[]} dataBuffer The dataBuffer of recording.
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
