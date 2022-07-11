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

const getAudioBufferByFileName = async (
    audioContext, fileName, directoryHandle) => {
  const fileHandle = await directoryHandle.getFileHandle(fileName);
  const file = await fileHandle.getFile();
  const arrayBuffer = await file.arrayBuffer();
  return await audioContext.decodeAudioData(arrayBuffer);
};

const buildDrumCellMap = async (outputNode, directoryHandle) => {
  const drumCellMap = {};
  for await (const entry of directoryHandle.values()) {
    if (entry.name.startsWith('drum') && entry.name.endsWith('mp3')) {
      const audioBuffer = await getAudioBufferByFileName(
          outputNode.context, entry.name, directoryHandle);
      drumCellMap[entry.name] = new DrumCell(outputNode, audioBuffer);
    }
  }

  return drumCellMap;
};

const bindKeyToDrumCellMap = (drumCellMap) => {
  const keys = 'qwerasdfzxcv'.split('');
  const drumCells = Object.values(drumCellMap);
  const keyToDrumCellMap = {};
  for (let i = 0; i < drumCells.length; ++i) {
    keyToDrumCellMap[keys[i]] = drumCells[i];
  }

  window.addEventListener('keydown', (event) => {
    if (event.key in keyToDrumCellMap) {
      keyToDrumCellMap[event.key].playSample();
    }
  });
};

const buildMainBus = async (audioContext, directoryHandle) => {
  const compressor = new DynamicsCompressorNode(audioContext);
  const irBuffer = await getAudioBufferByFileName(
      audioContext, 'ir-hall.mp3', directoryHandle);
  const convolver = new ConvolverNode(audioContext, {buffer: irBuffer});
  const reverbGain = new GainNode(audioContext, {gain: 0.25});

  compressor.connect(audioContext.destination);
  convolver.connect(reverbGain).connect(audioContext.destination);
  compressor.connect(convolver);

  return compressor;
};

const initializeDrumMachine = async (audioContext) => {
  const directoryHandle = await window.showDirectoryPicker();
  const mainBus = await buildMainBus(audioContext, directoryHandle);
  const drumCellMap = await buildDrumCellMap(mainBus, directoryHandle);
  await bindKeyToDrumCellMap(drumCellMap);
};

const audioContext = new AudioContext();

const onLoad = async () => {
  const buttonEl = document.getElementById('button-start');
  buttonEl.disabled = false;
  buttonEl.addEventListener('click', async () => {
    await initializeDrumMachine(audioContext);
    audioContext.resume();
    buttonEl.disabled = true;
    buttonEl.textContent = '파일 로딩 완료';
  }, false);
};

window.addEventListener('load', onLoad);
