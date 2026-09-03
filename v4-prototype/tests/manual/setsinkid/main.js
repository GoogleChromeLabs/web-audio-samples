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

let dropdownEl = null;

function logMessage(msg) {
  if (!logEl) return;
  const ts = (performance.now() / 1000).toFixed(3);
  logEl.textContent += `[+${ts}s] ${msg}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

function sanitizeSinkId(sinkId) {
  if (typeof sinkId === 'object' && sinkId !== null) {
    if (sinkId.type === 'none') return '[silent sink: {type: "none"}]';
    return JSON.stringify(sinkId);
  }
  if (!sinkId) return '[default output]';
  return sinkId;
}

function updateInspector() {
  if (!inspectorEl || !audioContext) return;
  const currentSink = sanitizeSinkId(audioContext.sinkId);
  const maxChannels = audioContext.destination.maxChannelCount;
  inspectorEl.textContent =
    `Context State    : ${audioContext.state}\n` +
    `Sample Rate      : ${audioContext.sampleRate} Hz\n` +
    `Base Latency     : ${(audioContext.baseLatency * 1000).toFixed(2)} ms\n` +
    `Active sinkId    : ${currentSink}\n` +
    `Max Channels     : ${maxChannels}\n` +
    `Test Tone        : ${isRunning ? '440 Hz Sawtooth (Active)' : 'Stopped'}`;
}

async function onDeviceChange() {
  if (!audioContext || !dropdownEl) return;
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  const deviceId = dropdownEl.value;
  logMessage(`Applying setSinkId target: "${deviceId}"`);

  try {
    if (deviceId === 'default') {
      await audioContext.setSinkId('');
    } else if (deviceId === 'silent') {
      await audioContext.setSinkId({ type: 'none' });
    } else {
      await audioContext.setSinkId(deviceId);
    }
    const sinkStr = sanitizeSinkId(audioContext.sinkId);
    logMessage(`setSinkId() succeeded. sinkId: ${sinkStr}`);
  } catch (err) {
    logMessage(`setSinkId() failed: ${err.name} - ${err.message}`);
  }

  updateInspector();
}

function setupDeviceControls() {
  const box = document.getElementById('test-harness-box');
  if (!box || document.getElementById('setsinkid-controls')) return;

  const controlContainer = document.createElement('div');
  controlContainer.id = 'setsinkid-controls';
  controlContainer.className =
    'p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2';

  const label = document.createElement('label');
  label.className = 'block font-semibold text-slate-800 text-xs';
  label.textContent = 'Audio Output Hardware Device:';

  const row = document.createElement('div');
  row.className = 'flex flex-col sm:flex-row gap-2.5';

  dropdownEl = document.createElement('select');
  dropdownEl.id = 'device-dropdown';
  dropdownEl.disabled = true;
  dropdownEl.className =
    'grow p-2 rounded-lg border border-slate-300 bg-white text-slate-800 ' +
    'text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500';
  dropdownEl.innerHTML = '<option>Requesting permissions...</option>';

  const applyBtn = document.createElement('button');
  applyBtn.type = 'button';
  applyBtn.textContent = 'Apply Sink ID';
  applyBtn.className =
    'px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white ' +
    'font-medium text-xs transition-colors cursor-pointer shrink-0';
  applyBtn.addEventListener('click', onDeviceChange);

  row.appendChild(dropdownEl);
  row.appendChild(applyBtn);
  controlContainer.appendChild(label);
  controlContainer.appendChild(row);

  const headerBar = box.querySelector('.border-b');
  if (headerBar) {
    headerBar.appendChild(controlContainer);
  }
}

async function discoverDevices() {
  if (typeof audioContext?.setSinkId !== 'function') {
    logMessage('AudioContext.setSinkId() is NOT supported in this browser.');
    if (dropdownEl) {
      dropdownEl.innerHTML = '<option>setSinkId() not supported</option>';
    }
    return;
  }

  logMessage('Requesting mediaDevices permission to discover device names...');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    logMessage('Microphone access granted. Enumerating audio hardware...');

    const devices = await navigator.mediaDevices.enumerateDevices();
    let optionsHtml =
      '<option value="default">Default System Audio Output</option>';
    let count = 0;

    devices.forEach((dev) => {
      if (dev.kind === 'audiooutput') {
        count++;
        const shortId = dev.deviceId.slice(0, 8);
        const name = dev.label || `Output Device ${count} (${shortId})`;
        optionsHtml += `<option value="${dev.deviceId}">${name}</option>`;
      }
    });

    optionsHtml +=
      '<option value="silent">' +
      'None (Silent Sink: {type: "none"})' +
      '</option>';

    if (dropdownEl) {
      dropdownEl.innerHTML = optionsHtml;
      dropdownEl.disabled = false;
    }

    logMessage(`Discovered ${count} audio output device(s). Ready.`);
  } catch (err) {
    logMessage(`Device enumeration note: ${err.message}`);
    if (dropdownEl) {
      dropdownEl.innerHTML =
        '<option value="default">Default System Audio Output</option>' +
        '<option value="silent">' +
        'None (Silent Sink: {type: "none"})' +
        '</option>';
      dropdownEl.disabled = false;
    }
  }
}

async function startTest() {
  if (isRunning) return;

  if (!audioContext) {
    audioContext = new AudioContext();
    await discoverDevices();
  }

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  oscNode = new OscillatorNode(audioContext, {
    type: 'sawtooth',
    frequency: 440,
  });
  gainNode = new GainNode(audioContext, { gain: 0.04 });
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

  logMessage('Test started: 440 Hz sawtooth tone playing.');
  updateInspector();
}

async function stopTest() {
  if (!isRunning) return;

  if (oscNode) {
    oscNode.stop();
    oscNode.disconnect();
    oscNode = null;
  }

  isRunning = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  if (statusBadge) {
    statusBadge.textContent = 'STOPPED';
    statusBadge.className =
      'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 ' +
      'text-slate-600';
  }

  logMessage('Test stopped: tone muted.');
  updateInspector();
}

startBtn?.addEventListener('click', startTest);
stopBtn?.addEventListener('click', stopTest);
clearLogBtn?.addEventListener('click', () => {
  if (logEl) logEl.textContent = '';
});

window.addEventListener('load', () => {
  setupDeviceControls();
  logMessage('AudioContext.setSinkId() test initialized.');
  logMessage('Click START TEST to begin.');
});
