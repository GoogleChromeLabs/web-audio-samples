/**
 * Copyright (c) 2026 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

'use strict';

let audioContext = null;
let sourceNode = null;
let pannerNode = null;
let gainNode = null;
let isRunning = false;
let animFrameId = null;

const startBtn = document.getElementById('button-start-test');
const stopBtn = document.getElementById('button-stop-test');
const inspectorEl = document.getElementById('test-inspector');
const logEl = document.getElementById('test-log');
const statusBadge = document.getElementById('test-status-badge');
const clearLogBtn = document.getElementById('button-clear-log');

let cardX = null;
let cardY = null;
let cardZ = null;
let statusX = null;
let statusY = null;
let statusZ = null;

function logMessage(msg, delayInSec = 0) {
  setTimeout(() => {
    if (!logEl) return;
    const ts = (performance.now() / 1000).toFixed(3);
    logEl.textContent += `[+${ts}s] ${msg}\n`;
    logEl.scrollTop = logEl.scrollHeight;
  }, delayInSec * 1000);
}

function updateInspector(phase, x, y, z) {
  if (!inspectorEl || !audioContext) return;
  const distModel = pannerNode ? pannerNode.distanceModel : 'inverse';
  inspectorEl.textContent =
    `Context State    : ${audioContext.state}\n` +
    `Sample Rate      : ${audioContext.sampleRate} Hz\n` +
    `Panning Model    : ${pannerNode ? pannerNode.panningModel : 'HRTF'}\n` +
    `Distance Model   : ${distModel}\n` +
    `Active Phase     : ${phase}\n` +
    `Coordinates      : X=${x.toFixed(2)}, Y=${y.toFixed(2)}, ` +
    `Z=${z.toFixed(2)}`;
}

function setupAxisIndicators() {
  const box = document.getElementById('test-harness-box');
  if (!box || document.getElementById('axis-indicators')) return;

  const container = document.createElement('div');
  container.id = 'axis-indicators';
  container.className = 'grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2';

  function createAxisCard(axis, range, timing) {
    const card = document.createElement('div');
    card.className =
      'p-3 rounded-lg border border-slate-200 bg-slate-50 transition-colors';

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between mb-1';

    const title = document.createElement('span');
    title.className = 'font-bold text-slate-800 text-xs';
    title.textContent = `${axis}-Axis`;

    const badge = document.createElement('span');
    badge.className = 'text-[11px] font-semibold text-slate-400';
    badge.textContent = 'Idle';

    const desc = document.createElement('div');
    desc.className = 'text-[11px] text-slate-500';
    desc.textContent = `${range} [${timing}]`;

    header.appendChild(title);
    header.appendChild(badge);
    card.appendChild(header);
    card.appendChild(desc);

    return { card, badge };
  }

  const resX = createAxisCard('1. X', 'Left (-1) to Right (+1)', '0s – 3s');
  cardX = resX.card;
  statusX = resX.badge;

  const resY = createAxisCard('2. Y', 'Bottom (-1) to Top (+1)', '3s – 6s');
  cardY = resY.card;
  statusY = resY.badge;

  const resZ = createAxisCard('3. Z', 'Front (-1) to Back (+1)', '6s – 9s');
  cardZ = resZ.card;
  statusZ = resZ.badge;

  container.appendChild(cardX);
  container.appendChild(cardY);
  container.appendChild(cardZ);

  const headerBar = box.querySelector('.border-b');
  if (headerBar) {
    headerBar.appendChild(container);
  }
}

function setCardState(card, badge, state) {
  if (!card || !badge) return;
  if (state === 'active') {
    card.className =
      'p-3 rounded-lg border border-blue-400 bg-blue-50 transition-colors';
    badge.textContent = 'Ramping...';
    badge.className = 'text-[11px] font-semibold text-blue-600';
  } else if (state === 'done') {
    card.className =
      'p-3 rounded-lg border border-emerald-300 bg-emerald-50 ' +
      'transition-colors';
    badge.textContent = 'Passed';
    badge.className = 'text-[11px] font-semibold text-emerald-600';
  } else {
    card.className =
      'p-3 rounded-lg border border-slate-200 bg-slate-50 transition-colors';
    badge.textContent = 'Idle';
    badge.className = 'text-[11px] font-semibold text-slate-400';
  }
}

async function startTest() {
  if (isRunning) return;

  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  sourceNode = new ConstantSourceNode(audioContext, { offset: 0.5 });
  gainNode = new GainNode(audioContext, { gain: 0.25 });
  pannerNode = new PannerNode(audioContext, { panningModel: 'HRTF' });

  sourceNode.connect(gainNode).connect(pannerNode).connect(
    audioContext.destination
  );
  sourceNode.start();

  isRunning = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  if (statusBadge) {
    statusBadge.textContent = 'RUNNING';
    statusBadge.className =
      'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 ' +
      'text-blue-700';
  }

  const duration = 3.0;
  const nonZero = 0.1;
  const startTime = audioContext.currentTime;

  logMessage('Test started: monitoring HRTF 3-axis spatial interpolation.');

  // Phase 1: X-Axis (-1 to +1)
  const t0 = startTime;
  const t1 = t0 + duration;
  pannerNode.positionX.setValueAtTime(-1.0, t0);
  pannerNode.positionY.setValueAtTime(nonZero, t0);
  pannerNode.positionZ.setValueAtTime(nonZero, t0);
  pannerNode.positionX.linearRampToValueAtTime(1.0, t1);
  setCardState(cardX, statusX, 'active');
  setCardState(cardY, statusY, 'idle');
  setCardState(cardZ, statusZ, 'idle');
  logMessage('Phase 1: X-Axis left (-1.0) to right (+1.0) [0s – 3s]');

  // Phase 2: Y-Axis (-1 to +1)
  const t2 = t1 + duration;
  pannerNode.positionX.setValueAtTime(nonZero, t1);
  pannerNode.positionY.setValueAtTime(-1.0, t1);
  pannerNode.positionZ.setValueAtTime(nonZero, t1);
  pannerNode.positionY.linearRampToValueAtTime(1.0, t2);
  setTimeout(() => {
    if (!isRunning) return;
    setCardState(cardX, statusX, 'done');
    setCardState(cardY, statusY, 'active');
  }, duration * 1000);
  logMessage(
    'Phase 2: Y-Axis bottom (-1.0) to top (+1.0) [3s – 6s]',
    duration
  );

  // Phase 3: Z-Axis (-1 to +1)
  const t3 = t2 + duration;
  pannerNode.positionX.setValueAtTime(nonZero, t2);
  pannerNode.positionY.setValueAtTime(nonZero, t2);
  pannerNode.positionZ.setValueAtTime(-1.0, t2);
  pannerNode.positionZ.linearRampToValueAtTime(1.0, t3);
  setTimeout(() => {
    if (!isRunning) return;
    setCardState(cardY, statusY, 'done');
    setCardState(cardZ, statusZ, 'active');
  }, 2 * duration * 1000);
  logMessage(
    'Phase 3: Z-Axis front (-1.0) to back (+1.0) [6s – 9s]',
    2 * duration
  );

  sourceNode.stop(t3);

  function pollProgress() {
    if (!isRunning) return;
    const elapsed = audioContext.currentTime - startTime;
    let phaseName = 'Idle';
    let curX = nonZero;
    let curY = nonZero;
    let curZ = nonZero;

    if (elapsed < duration) {
      phaseName = 'Phase 1 (X-Axis Sweep)';
      const ratio = Math.max(0, Math.min(1, elapsed / duration));
      curX = -1.0 + 2.0 * ratio;
    } else if (elapsed < 2 * duration) {
      phaseName = 'Phase 2 (Y-Axis Sweep)';
      const ratio = Math.max(0, Math.min(1, (elapsed - duration) / duration));
      curY = -1.0 + 2.0 * ratio;
    } else if (elapsed < 3 * duration) {
      const rem = elapsed - 2 * duration;
      phaseName = 'Phase 3 (Z-Axis Sweep)';
      const ratio = Math.max(0, Math.min(1, rem / duration));
      curZ = -1.0 + 2.0 * ratio;
    } else {
      phaseName = 'Completed';
    }

    updateInspector(phaseName, curX, curY, curZ);

    if (elapsed < 3 * duration) {
      animFrameId = requestAnimationFrame(pollProgress);
    } else {
      setCardState(cardZ, statusZ, 'done');
      stopTest(false);
      logMessage('Spatial sweep test completed without interruption.', 0);
    }
  }

  animFrameId = requestAnimationFrame(pollProgress);
}

function stopTest(manual = true) {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }

  if (sourceNode) {
    try {
      sourceNode.stop();
      sourceNode.disconnect();
    } catch {}
    sourceNode = null;
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

  if (manual) {
    logMessage('Test stopped manually.');
  }

  updateInspector('Stopped', 0, 0, 0);
}

startBtn?.addEventListener('click', startTest);
stopBtn?.addEventListener('click', () => stopTest(true));
clearLogBtn?.addEventListener('click', () => {
  if (logEl) logEl.textContent = '';
});

window.addEventListener('load', () => {
  setupAxisIndicators();
  logMessage('PannerNode spatialization fixture initialized.');
  logMessage('Click START TEST to run 3-axis sweep.');
});
