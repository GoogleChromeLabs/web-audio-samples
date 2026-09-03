/**
 * Copyright (c) 2026 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

'use strict';

let audioContext = null;
let oscNode = null;
let gainNode = null;
let isRunning = false;

const startBtn = document.getElementById('button-start-test');
const stopBtn = document.getElementById('button-stop-test');
const inspectorEl = document.getElementById('test-inspector');
const logEl = document.getElementById('test-log');
const statusBadge = document.getElementById('test-status-badge');
const clearLogBtn = document.getElementById('button-clear-log');

function logMessage(msg) {
  if (!logEl) return;
  const ts = (performance.now() / 1000).toFixed(3);
  logEl.textContent += `[+${ts}s] ${msg}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

function updateInspector() {
  if (!inspectorEl) return;
  if (!audioContext) {
    inspectorEl.textContent = 'AudioContext not initialized.';
    return;
  }
  const oscState = isRunning ? 'Running (Sine @ 440 Hz)' : 'Stopped';
  const latMs = (audioContext.baseLatency * 1000).toFixed(2);
  inspectorEl.textContent =
    `Context State    : ${audioContext.state}\n` +
    `Configured Rate  : 16000 Hz\n` +
    `Active Rate      : ${audioContext.sampleRate} Hz\n` +
    `Base Latency     : ${latMs} ms\n` +
    `Max Channels     : ${audioContext.destination.maxChannelCount}\n` +
    `Oscillator State : ${oscState}`;
}

async function startTest() {
  if (isRunning) return;

  try {
    // 16 kHz AudioContext per Issue 331682035 repro
    audioContext = new AudioContext({
      latencyHint: 'interactive',
      sampleRate: 16000,
    });

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    gainNode = new GainNode(audioContext, { gain: 0.2 });
    oscNode = new OscillatorNode(audioContext, {
      type: 'sine',
      frequency: 440,
    });

    oscNode.connect(gainNode).connect(audioContext.destination);
    oscNode.start();

    isRunning = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;

    if (statusBadge) {
      statusBadge.textContent = 'RUNNING';
      statusBadge.className =
        'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 ' +
        'text-blue-700';
    }

    logMessage(
      `Started 16 kHz AudioContext (sampleRate: ${audioContext.sampleRate} Hz)`
    );
    const latMs = (audioContext.baseLatency * 1000).toFixed(2);
    logMessage(`Base latency: ${latMs} ms`);
    logMessage('Listen for periodic clicks or glitches in connected devices.');
    updateInspector();
  } catch (err) {
    logMessage(`Initialization failed: ${err.message}`);
  }
}

async function stopTest() {
  if (!isRunning || !audioContext) return;

  try {
    if (oscNode) {
      oscNode.stop();
      oscNode.disconnect();
      oscNode = null;
    }
    await audioContext.close();
    audioContext = null;

    isRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;

    if (statusBadge) {
      statusBadge.textContent = 'STOPPED';
      statusBadge.className =
        'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 ' +
        'text-slate-600';
    }

    logMessage('Test stopped and AudioContext closed.');
    updateInspector();
  } catch (err) {
    logMessage(`Error closing AudioContext: ${err.message}`);
  }
}

startBtn?.addEventListener('click', startTest);
stopBtn?.addEventListener('click', stopTest);
clearLogBtn?.addEventListener('click', () => {
  if (logEl) logEl.textContent = '';
});

window.addEventListener('load', () => {
  updateInspector();
  logMessage('Resampler verification fixture initialized.');
  logMessage('Click START TEST to run 16 kHz resampling test.');
});
