/**
 * Copyright 2021 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import DrumCell from './DrumCell.js';

const BUNDLED_SAMPLE_NAMES = [
  'drum-kd-01.mp3',
  'drum-kd-02.mp3',
  'drum-sd-01.mp3',
  'drum-sd-02.mp3',
  'drum-hh-01.mp3',
  'drum-hh-02.mp3',
  'drum-oh-01.mp3',
  'drum-oh-02.mp3',
  'drum-perc-01.mp3',
  'drum-perc-02.mp3',
  'drum-fx-01.mp3',
  'drum-fx-02.mp3',
];

const KEY_LAYOUT = [
  { key: 'q', label: 'Q' },
  { key: 'w', label: 'W' },
  { key: 'e', label: 'E' },
  { key: 'r', label: 'R' },
  { key: 'a', label: 'A' },
  { key: 's', label: 'S' },
  { key: 'd', label: 'D' },
  { key: 'f', label: 'F' },
  { key: 'z', label: 'Z' },
  { key: 'x', label: 'X' },
  { key: 'c', label: 'C' },
  { key: 'v', label: 'V' },
];

let audioContext = null;
let drumCellMap = {};
let keyToCellMap = {};
let padElements = {};

function getOrCreateAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

async function fetchAudioBuffer(ctx, url) {
  const resp = await fetch(url);
  const buf = await resp.arrayBuffer();
  return await ctx.decodeAudioData(buf);
}

function buildMainBus(ctx, irBuffer) {
  const compressor = new DynamicsCompressorNode(ctx);
  const convolver = new ConvolverNode(ctx, { buffer: irBuffer });
  const reverbGain = new GainNode(ctx, { gain: 0.25 });

  compressor.connect(ctx.destination);
  convolver.connect(reverbGain).connect(ctx.destination);
  compressor.connect(convolver);
  return compressor;
}

function renderPads(sampleNames) {
  const grid = document.getElementById('pad-grid');
  grid.innerHTML = '';
  padElements = {};

  sampleNames.forEach((name, i) => {
    const keyInfo = KEY_LAYOUT[i] || { key: `${i + 1}`, label: `${i + 1}` };
    const pad = document.createElement('div');
    pad.className = 'pad';
    pad.innerHTML = `
      <span class="key">${keyInfo.label}</span>
      <span class="name">${name.replace(/\.mp3$/, '')}</span>
    `;

    pad.addEventListener('pointerdown', () => {
      triggerSample(keyInfo.key);
    });

    grid.appendChild(pad);
    padElements[keyInfo.key] = pad;
  });
}

function triggerSample(key) {
  const cell = keyToCellMap[key.toLowerCase()];
  if (cell) {
    cell.playSample();
    const pad = padElements[key.toLowerCase()];
    if (pad) {
      pad.classList.add('active');
      setTimeout(() => pad.classList.remove('active'), 100);
    }
  }
}

function bindKeys() {
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (k in keyToCellMap) {
      triggerSample(k);
    }
  });
}

async function loadBundledSamples() {
  const ctx = getOrCreateAudioContext();
  const statusEl = document.getElementById('status-text');
  statusEl.textContent = '샘플 로딩 중 (Loading samples)...';

  try {
    const irBuffer = await fetchAudioBuffer(ctx, './samples/ir-hall.mp3');
    const mainBus = buildMainBus(ctx, irBuffer);

    drumCellMap = {};
    keyToCellMap = {};

    const loadPromises = BUNDLED_SAMPLE_NAMES.map(async (fileName, i) => {
      const url = `./samples/${fileName}`;
      const buffer = await fetchAudioBuffer(ctx, url);
      const cell = new DrumCell(mainBus, buffer);
      drumCellMap[fileName] = cell;
      const keyInfo = KEY_LAYOUT[i];
      if (keyInfo) {
        keyToCellMap[keyInfo.key] = cell;
      }
    });

    await Promise.all(loadPromises);
    renderPads(BUNDLED_SAMPLE_NAMES);
    bindKeys();

    statusEl.textContent = '12개 샘플 로드 완료 (키보드 또는 패드 클릭)';
    document.getElementById('btn-load-bundled').disabled = true;
  } catch (err) {
    console.error(err);
    statusEl.textContent = `로딩 실패: ${err.message}`;
  }
}

async function loadFromDirectory() {
  if (!('showDirectoryPicker' in window)) {
    alert('이 브라우저는 File System Access API를 지원하지 않습니다.');
    return;
  }

  const ctx = getOrCreateAudioContext();
  const statusEl = document.getElementById('status-text');

  try {
    const dirHandle = await window.showDirectoryPicker();
    statusEl.textContent = '폴더 읽는 중...';

    const irFile = await dirHandle.getFileHandle('ir-hall.mp3');
    const irFileObj = await irFile.getFile();
    const irBuf = await ctx.decodeAudioData(await irFileObj.arrayBuffer());
    const mainBus = buildMainBus(ctx, irBuf);

    drumCellMap = {};
    keyToCellMap = {};
    const loadedNames = [];

    for await (const entry of dirHandle.values()) {
      if (entry.name.startsWith('drum') && entry.name.endsWith('.mp3')) {
        const subHandle = await dirHandle.getFileHandle(entry.name);
        const fileObj = await subHandle.getFile();
        const buf = await ctx.decodeAudioData(await fileObj.arrayBuffer());
        const cell = new DrumCell(mainBus, buf);
        drumCellMap[entry.name] = cell;
        loadedNames.push(entry.name);
      }
    }

    loadedNames.sort();
    loadedNames.forEach((name, i) => {
      const keyInfo = KEY_LAYOUT[i];
      if (keyInfo) {
        keyToCellMap[keyInfo.key] = drumCellMap[name];
      }
    });

    renderPads(loadedNames);
    bindKeys();
    statusEl.textContent = `${loadedNames.length}개 샘플 로드 완료`;
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error(err);
      statusEl.textContent = `오류: ${err.message}`;
    }
  }
}

window.addEventListener('load', () => {
  renderPads(BUNDLED_SAMPLE_NAMES);
  const pads = document.querySelectorAll('.pad');
  pads.forEach((p) => p.classList.add('disabled'));

  document.getElementById('btn-load-bundled').addEventListener('click', () => {
    loadBundledSamples();
  });

  document.getElementById('btn-select-dir').addEventListener('click', () => {
    loadFromDirectory();
  });
});
