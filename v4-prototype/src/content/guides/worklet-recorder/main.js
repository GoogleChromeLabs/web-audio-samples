// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import createLinkFromAudioBuffer from './exporter.js';
import Waveform from './Waveform.js';
import VUMeter from './VUMeter.js';

let audioContext = null;
let micSource = null;
let recordingNode = null;
let analyserNode = null;
let waveform = null;
let vuMeter = null;
let isRecording = false;
let statusEl = null;
let canvasEl = null;
let vuMeterEl = null;
let playerEl = null;
let downloadLinkEl = null;
let animFrameId = null;

const MAX_RECORDING_SECONDS = 300;

/**
 * Renders the scrolling audio waveform and VU volume meter visualizers.
 */
const drawVisualizers = () => {
  if (waveform) {
    waveform.draw();
  }
  if (vuMeter) {
    vuMeter.draw();
  }
  if (isRecording) {
    animFrameId = requestAnimationFrame(drawVisualizers);
  }
};

/**
 * Converts recorded raw channel arrays from the worklet into an AudioBuffer.
 * @param {Float32Array[]} buffer
 * @param {number} length
 * @return {AudioBuffer|null}
 */
const createAudioBufferFromWorklet = (buffer, length) => {
  if (!audioContext || length === 0) return null;

  const channelCount = buffer.length;
  const audioBuffer = audioContext.createBuffer(
    channelCount,
    length,
    audioContext.sampleRate
  );

  for (let ch = 0; ch < channelCount; ++ch) {
    audioBuffer.getChannelData(ch).set(buffer[ch].subarray(0, length));
  }

  return audioBuffer;
};

/**
 * Handles incoming recording buffer from the worklet processor.
 * @param {Float32Array[]} buffer
 * @param {number} length
 */
const handleRecordingResult = (buffer, length) => {
  const audioBuffer = createAudioBufferFromWorklet(buffer, length);
  if (!audioBuffer) return;

  const wavUrl = createLinkFromAudioBuffer(audioBuffer, false);
  if (playerEl) {
    playerEl.src = wavUrl;
    playerEl.parentElement?.classList.remove('hidden');
  }
  if (downloadLinkEl) {
    downloadLinkEl.href = wavUrl;
    downloadLinkEl.download = `worklet-recording-${Date.now()}.wav`;
    downloadLinkEl.classList.remove('hidden');
  }
};

/**
 * Injects UI elements into the demo box.
 */
const mountUI = () => {
  if (document.getElementById('worklet-recorder-ui')) return;

  const container = document.createElement('div');
  container.id = 'worklet-recorder-ui';
  container.className = 'space-y-3 py-2 text-xs text-slate-700';

  const header = document.createElement('div');
  header.className = 'flex items-center justify-between font-mono';

  statusEl = document.createElement('span');
  statusEl.className = 'font-semibold text-slate-800';
  statusEl.textContent = 'Recorded: 0.00s';

  const badge = document.createElement('span');
  badge.className =
    'px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 ' +
    'text-emerald-800 border border-emerald-300';
  badge.textContent = 'AudioWorklet (Modern)';

  header.appendChild(statusEl);
  header.appendChild(badge);

  const displayRow = document.createElement('div');
  displayRow.className = 'flex items-center gap-2';

  canvasEl = document.createElement('canvas');
  canvasEl.width = 560;
  canvasEl.height = 100;
  canvasEl.className =
    'flex-1 h-24 rounded-lg border border-slate-700 bg-slate-900 shadow-inner';

  vuMeterEl = document.createElement('canvas');
  vuMeterEl.width = 30;
  vuMeterEl.height = 100;
  vuMeterEl.className =
    'w-8 h-24 rounded-lg border border-slate-700 bg-slate-900 ' +
    'shadow-inner shrink-0';

  displayRow.appendChild(canvasEl);
  displayRow.appendChild(vuMeterEl);

  const previewRow = document.createElement('div');
  previewRow.className = 'hidden flex flex-wrap items-center gap-3 pt-1';

  playerEl = document.createElement('audio');
  playerEl.controls = true;
  playerEl.className = 'h-8 flex-1 min-w-[200px]';

  downloadLinkEl = document.createElement('a');
  downloadLinkEl.className =
    'hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ' +
    'bg-emerald-600 hover:bg-emerald-700 text-white font-medium ' +
    'shadow-xs transition-colors';
  downloadLinkEl.textContent = 'Download WAV';

  previewRow.appendChild(playerEl);
  previewRow.appendChild(downloadLinkEl);

  container.appendChild(header);
  container.appendChild(displayRow);
  container.appendChild(previewRow);

  const panel = document.querySelector('[data-control-panel]');
  if (panel && panel.parentNode) {
    panel.parentNode.insertBefore(container, panel);
  }

  waveform = new Waveform(canvasEl);
  vuMeter = new VUMeter(vuMeterEl, {
    minDecibel: -40,
    fifoSize: 6,
    backgroundColor: '#0f172a',
  });
  vuMeter.reset();
};

/**
 * Initializes AudioContext and registers recording worklet module.
 * @return {Promise<AudioContext>}
 */
export const setup = async () => {
  audioContext = new AudioContext();
  await audioContext.suspend();

  mountUI();

  const processorUrl =
    new URL('recording-processor.js', import.meta.url).href;
  await audioContext.audioWorklet.addModule(processorUrl);

  audioContext.addEventListener('statechange', () => {
    if (audioContext.state === 'suspended') {
      isRecording = false;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (vuMeter) vuMeter.reset();
      if (recordingNode) {
        recordingNode.port.postMessage({
          message: 'UPDATE_RECORDING_STATE',
          setRecording: false,
        });
      }
    } else if (audioContext.state === 'running' && recordingNode) {
      isRecording = true;
      recordingNode.port.postMessage({
        message: 'UPDATE_RECORDING_STATE',
        setRecording: true,
      });
      drawVisualizers();
    }
  });

  return audioContext;
};

/**
 * Requests microphone input, connects the recording worklet node, and starts.
 * @param {AudioContext} context
 */
export const start = async (context) => {
  if (recordingNode) {
    isRecording = true;
    recordingNode.port.postMessage({
      message: 'UPDATE_RECORDING_STATE',
      setRecording: true,
    });
    drawVisualizers();
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    if (statusEl) statusEl.textContent = 'getUserMedia not supported';
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        autoGainControl: false,
        noiseSuppression: false,
      },
    });

    micSource = context.createMediaStreamSource(stream);
    analyserNode = new AnalyserNode(context, { fftSize: 1024 });

    if (waveform) {
      waveform.setAnalyserNode(analyserNode);
      waveform.reset();
    }
    if (vuMeter) {
      vuMeter.setAnalyserNode(analyserNode, 32);
      vuMeter.reset();
    }

    const maxFrameCount = context.sampleRate * MAX_RECORDING_SECONDS;
    recordingNode = new AudioWorkletNode(context, 'recording-processor', {
      processorOptions: {
        numberOfChannels: micSource.channelCount,
        sampleRate: context.sampleRate,
        maxFrameCount,
      },
    });

    recordingNode.port.onmessage = (event) => {
      const data = event.data;
      if (data.message === 'UPDATE_RECORDING_LENGTH') {
        const seconds = (data.recordingLength / context.sampleRate).toFixed(2);
        if (statusEl) {
          statusEl.textContent = `Recorded: ${seconds}s`;
        }
      } else if (
        data.message === 'SHARE_RECORDING_BUFFER' ||
        data.message === 'MAX_RECORDING_LENGTH_REACHED'
      ) {
        if (data.message === 'MAX_RECORDING_LENGTH_REACHED') {
          isRecording = false;
          if (animFrameId) cancelAnimationFrame(animFrameId);
          if (vuMeter) vuMeter.reset();
        }
        handleRecordingResult(data.buffer, data.recordingLength);
      }
    };

    const gainNode = new GainNode(context, { gain: 0 });

    micSource.connect(analyserNode);
    analyserNode.connect(recordingNode);
    recordingNode.connect(gainNode);
    gainNode.connect(context.destination);

    isRecording = true;
    recordingNode.port.postMessage({
      message: 'UPDATE_RECORDING_STATE',
      setRecording: true,
    });
    drawVisualizers();
  } catch (err) {
    console.error('Microphone access failed:', err);
    if (statusEl) {
      statusEl.textContent = 'Microphone access denied';
    }
  }
};
