// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import createLinkFromAudioBuffer from './exporter.js';
import Waveform from './Waveform.js';
import VUMeter from './VUMeter.js';

let audioContext = null;
let micSource = null;
let spNode = null;
let analyserNode = null;
let waveform = null;
let vuMeter = null;
let isRecording = false;
let recordingFrames = 0;
let recordedBuffers = [[], []]; // Stereo buffers
let statusEl = null;
let canvasEl = null;
let vuMeterEl = null;
let playerEl = null;
let downloadLinkEl = null;
let animFrameId = null;

const BUFFER_SIZE = 512;
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
 * Flattens chunk arrays and creates the exported AudioBuffer.
 * @return {AudioBuffer|null}
 */
const exportRecordedBuffer = () => {
  if (!audioContext || recordingFrames === 0) return null;

  const audioBuffer = audioContext.createBuffer(
    2,
    recordingFrames,
    audioContext.sampleRate
  );

  for (let ch = 0; ch < 2; ++ch) {
    const channelData = audioBuffer.getChannelData(ch);
    let offset = 0;
    for (const chunk of recordedBuffers[ch]) {
      channelData.set(chunk, offset);
      offset += chunk.length;
    }
  }

  return audioBuffer;
};

/**
 * Finalizes current recording, updates audio preview player and download link.
 */
const finalizeRecording = () => {
  const finalBuffer = exportRecordedBuffer();
  if (!finalBuffer) return;

  const wavUrl = createLinkFromAudioBuffer(finalBuffer, false);
  if (playerEl) {
    playerEl.src = wavUrl;
    playerEl.parentElement?.classList.remove('hidden');
  }
  if (downloadLinkEl) {
    downloadLinkEl.href = wavUrl;
    downloadLinkEl.download = `recording-${Date.now()}.wav`;
    downloadLinkEl.classList.remove('hidden');
  }
};

/**
 * Injects UI elements into the demo box.
 */
const mountUI = () => {
  if (document.getElementById('spn-recorder-ui')) return;

  const container = document.createElement('div');
  container.id = 'spn-recorder-ui';
  container.className = 'space-y-3 py-2 text-xs text-slate-700';

  // Status and duration
  const header = document.createElement('div');
  header.className = 'flex items-center justify-between font-mono';

  statusEl = document.createElement('span');
  statusEl.className = 'font-semibold text-slate-800';
  statusEl.textContent = 'Recorded: 0.00s';

  const badge = document.createElement('span');
  badge.className =
    'px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 ' +
    'text-amber-800 border border-amber-300';
  badge.textContent = 'ScriptProcessorNode (Legacy)';

  header.appendChild(statusEl);
  header.appendChild(badge);

  const displayRow = document.createElement('div');
  displayRow.className = 'flex items-center gap-2';

  // Waveform canvas
  canvasEl = document.createElement('canvas');
  canvasEl.width = 560;
  canvasEl.height = 100;
  canvasEl.className =
    'flex-1 h-24 rounded-lg border border-slate-700 bg-slate-900 shadow-inner';

  // VU volume meter canvas
  vuMeterEl = document.createElement('canvas');
  vuMeterEl.width = 30;
  vuMeterEl.height = 100;
  vuMeterEl.className =
    'w-8 h-24 rounded-lg border border-slate-700 bg-slate-900 ' +
    'shadow-inner shrink-0';

  displayRow.appendChild(canvasEl);
  displayRow.appendChild(vuMeterEl);

  // Audio preview & download row
  const previewRow = document.createElement('div');
  previewRow.className = 'hidden flex flex-wrap items-center gap-3 pt-1';

  playerEl = document.createElement('audio');
  playerEl.controls = true;
  playerEl.className = 'h-8 flex-1 min-w-[200px]';

  downloadLinkEl = document.createElement('a');
  downloadLinkEl.className =
    'hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ' +
    'bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs ' +
    'transition-colors';
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
 * Initializes AudioContext and mounts recording UI.
 * @return {Promise<AudioContext>}
 */
export const setup = async () => {
  audioContext = new AudioContext();
  await audioContext.suspend();

  mountUI();

  audioContext.addEventListener('statechange', () => {
    if (audioContext.state === 'suspended') {
      isRecording = false;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (vuMeter) vuMeter.reset();
      finalizeRecording();
    } else if (audioContext.state === 'running' && micSource) {
      isRecording = true;
      drawVisualizers();
    }
  });

  return audioContext;
};

/**
 * Requests microphone input and starts ScriptProcessor recording loop.
 * @param {AudioContext} context
 */
export const start = async (context) => {
  if (micSource) {
    isRecording = true;
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

    // Legacy ScriptProcessorNode running onaudioprocess on main thread
    spNode = context.createScriptProcessor(BUFFER_SIZE, 2, 2);

    const maxFrames = context.sampleRate * MAX_RECORDING_SECONDS;

    spNode.onaudioprocess = (event) => {
      if (!isRecording) return;

      const inputBuffer = event.inputBuffer;
      const numChannels = Math.min(inputBuffer.numberOfChannels, 2);

      for (let ch = 0; ch < numChannels; ++ch) {
        const data = inputBuffer.getChannelData(ch);
        recordedBuffers[ch].push(new Float32Array(data));
      }

      recordingFrames += BUFFER_SIZE;
      const seconds = (recordingFrames / context.sampleRate).toFixed(2);
      if (statusEl) {
        statusEl.textContent = `Recorded: ${seconds}s`;
      }

      if (recordingFrames >= maxFrames) {
        isRecording = false;
        if (animFrameId) cancelAnimationFrame(animFrameId);
        if (vuMeter) vuMeter.reset();
        finalizeRecording();
      }
    };

    // Gain node muted to prevent feedback
    const gainNode = new GainNode(context, { gain: 0 });

    micSource.connect(analyserNode);
    analyserNode.connect(spNode);
    spNode.connect(gainNode);
    gainNode.connect(context.destination);

    isRecording = true;
    drawVisualizers();
  } catch (err) {
    console.error('Microphone access failed:', err);
    if (statusEl) {
      statusEl.textContent = 'Microphone access denied';
    }
  }
};
