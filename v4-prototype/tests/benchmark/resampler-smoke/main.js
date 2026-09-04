/**
 * Copyright (c) 2026 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

'use strict';

let audioContext = null;
let contextGain = null;
let audioA = null;
let audioB = null;
let isPlaying = false;

const startBtn = document.getElementById('button-start-test');
const stopBtn = document.getElementById('button-stop-test');
const inspectorEl = document.getElementById('test-inspector');
const logEl = document.getElementById('test-log');
const statusBadge = document.getElementById('test-status-badge');
const clearLogBtn = document.getElementById('button-clear-log');

let toggleEl = null;
let labelNative = null;
let labelResampled = null;
let activeDesc = null;

// The sound asset is hosted under base URL /sounds/fx/human-voice.mp3
const soundUrl = '/sounds/fx/human-voice.mp3';

function logMessage(msg) {
  if (!logEl) return;
  const ts = (performance.now() / 1000).toFixed(3);
  logEl.textContent += `[+${ts}s] ${msg}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

function updateInspector() {
  if (!inspectorEl) return;
  if (!isPlaying || !audioContext) {
    inspectorEl.textContent =
      'Audio streams stopped.\n' +
      'Press "START TEST" to begin A/B comparison.';
    return;
  }

  const isResampled = toggleEl?.checked;
  const bufSize = (audioContext.baseLatency * audioContext.sampleRate)
    .toFixed(1);
  const latMs = (audioContext.baseLatency * 1000).toFixed(2);
  const streamLabel = isResampled
    ? '8 kHz AudioContext (Resampled)'
    : 'Native AudioElement (Original)';

  inspectorEl.textContent =
    `Context State    : ${audioContext.state}\n` +
    `Context Rate     : ${audioContext.sampleRate} Hz (Resampled)\n` +
    `Base Latency     : ${latMs} ms\n` +
    `Buffer Size      : ~${bufSize} samples\n` +
    `Active Stream    : ${streamLabel}\n` +
    `Resampled Gain   : ${contextGain ? contextGain.gain.value : 0}\n` +
    `Native Volume    : ${audioB ? audioB.volume : 0}`;
}

function onToggle() {
  if (!isPlaying || !toggleEl) return;

  if (toggleEl.checked) {
    // 8kHz AudioContext active
    contextGain.gain.setValueAtTime(1.0, audioContext.currentTime);
    audioB.volume = 0.0;
    labelNative.className =
      'text-xs font-semibold text-slate-400 transition-colors';
    labelResampled.className =
      'text-xs font-bold text-blue-600 transition-colors';
    activeDesc.textContent =
      '8 kHz AudioContext (Resampled stream with bandwidth limit)';
    logMessage('Playing AudioContext (8,000 Hz resampled)');
  } else {
    // Native AudioElement active
    contextGain.gain.setValueAtTime(0.0, audioContext.currentTime);
    audioB.volume = 1.0;
    labelNative.className =
      'text-xs font-bold text-slate-900 transition-colors';
    labelResampled.className =
      'text-xs font-semibold text-slate-400 transition-colors';
    activeDesc.textContent =
      'Original AudioElement (Unresampled native playback)';
    logMessage('Playing AudioElement (Original native audio)');
  }

  updateInspector();
}

function setupToggleControls() {
  const box = document.getElementById('test-harness-box');
  if (!box || document.getElementById('resampler-toggle-controls')) return;

  const container = document.createElement('div');
  container.id = 'resampler-toggle-controls';
  container.className =
    'p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap ' +
    'items-center justify-between gap-4';

  const leftText = document.createElement('div');
  const title = document.createElement('div');
  title.className = 'font-semibold text-slate-900 text-xs';
  title.textContent = 'Active Playback Stream:';

  activeDesc = document.createElement('div');
  activeDesc.className = 'text-slate-600 text-xs mt-0.5';
  activeDesc.textContent =
    'Original AudioElement (Unresampled native playback)';
  leftText.appendChild(title);
  leftText.appendChild(activeDesc);

  const rightSwitch = document.createElement('div');
  rightSwitch.className = 'flex items-center gap-3';

  labelNative = document.createElement('span');
  labelNative.className = 'text-xs font-bold text-slate-900 transition-colors';
  labelNative.textContent = 'Native AudioElement';

  const labelWrap = document.createElement('label');
  labelWrap.className =
    'relative inline-flex items-center cursor-pointer select-none';

  toggleEl = document.createElement('input');
  toggleEl.type = 'checkbox';
  toggleEl.disabled = true;
  toggleEl.className = 'sr-only peer';
  toggleEl.addEventListener('change', onToggle);

  const track = document.createElement('div');
  track.className =
    'w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer ' +
    'peer-checked:after:translate-x-full peer-checked:after:border-white ' +
    'after:content-[""] after:absolute after:top-[2px] after:left-[2px] ' +
    'after:bg-white after:border-slate-300 after:border after:rounded-full ' +
    'after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ' +
    'peer-disabled:opacity-50';

  labelResampled = document.createElement('span');
  labelResampled.className =
    'text-xs font-semibold text-slate-400 transition-colors';
  labelResampled.textContent = '8 kHz AudioContext';

  labelWrap.appendChild(toggleEl);
  labelWrap.appendChild(track);
  rightSwitch.appendChild(labelNative);
  rightSwitch.appendChild(labelWrap);
  rightSwitch.appendChild(labelResampled);

  container.appendChild(leftText);
  container.appendChild(rightSwitch);

  const headerBar = box.querySelector('.border-b');
  if (headerBar) {
    headerBar.appendChild(container);
  }
}

async function startTest() {
  if (isPlaying) return;

  try {
    audioA = new Audio();
    audioA.src = soundUrl;
    audioA.loop = true;

    audioB = new Audio();
    audioB.src = soundUrl;
    audioB.loop = true;
    audioB.volume = 1.0;

    audioContext = new AudioContext({ sampleRate: 8000 });
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const elemSource = audioContext.createMediaElementSource(audioA);
    contextGain = new GainNode(audioContext, { gain: 0.0 });
    elemSource.connect(contextGain).connect(audioContext.destination);

    await Promise.all([audioA.play(), audioB.play()]);

    isPlaying = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    if (toggleEl) {
      toggleEl.disabled = false;
      toggleEl.checked = false;
    }

    if (statusBadge) {
      statusBadge.textContent = 'RUNNING';
      statusBadge.className =
        'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 ' +
        'text-blue-700';
    }

    logMessage(`Started streams: sampleRate = ${audioContext.sampleRate} Hz`);
    const latMs = (audioContext.baseLatency * 1000).toFixed(2);
    logMessage(`AudioContext baseLatency = ${latMs} ms`);
    logMessage(
      'Use the A/B toggle switch to compare 8kHz resampled vs native.'
    );
    updateInspector();
  } catch (err) {
    logMessage(`Start audio failed: ${err.message}`);
  }
}

async function stopTest() {
  if (!isPlaying) return;

  if (audioA) {
    audioA.pause();
    audioA.currentTime = 0;
  }
  if (audioB) {
    audioB.pause();
    audioB.currentTime = 0;
  }
  if (audioContext) {
    await audioContext.close();
    audioContext = null;
  }

  isPlaying = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  if (toggleEl) {
    toggleEl.disabled = true;
  }

  if (statusBadge) {
    statusBadge.textContent = 'STOPPED';
    statusBadge.className =
      'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 ' +
      'text-slate-600';
  }

  logMessage('Audio streams stopped.');
  updateInspector();
}

startBtn?.addEventListener('click', startTest);
stopBtn?.addEventListener('click', stopTest);
clearLogBtn?.addEventListener('click', () => {
  if (logEl) logEl.textContent = '';
});

window.addEventListener('load', () => {
  setupToggleControls();
  updateInspector();
  logMessage('Resampler smoke test initialized.');
  logMessage('Click START TEST to run synchronized streams.');
});
