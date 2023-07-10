// Copyright (c) 2023 The Chromium Authors. All rights reserved.  Use
// of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const sanitizeSinkId = (sinkId) => {
  if (typeof sinkId === 'object' && sinkId.type === 'none')
    return `[silent sink]`;

  if (sinkId === '') return '[default]';

  return sinkId.substring(0, 8);
}

// Handles the button click to activate `setSinkId()` method.
const onDeviceChange = async (event, audioContext, appView) => {
  const deviceId = appView.dropdown.value;
  if (deviceId === 'default') {
    await audioContext.setSinkId('');
  } else if (deviceId === 'silent') {
    await audioContext.setSinkId({type: 'none'});
  } else {
    await audioContext.setSinkId(deviceId);
  }

  appView.inspector.textContent =
      `AudioContext.sinkId = ${sanitizeSinkId(audioContext.sinkId)}
      (${audioContext.destination.maxChannelCount} channels max)`;
};

// The manual test body
const startManualTest = async () => {
  const appView = {
    log: document.getElementById('log'),
    inspector: document.getElementById('inspector'),
    dropdown: document.getElementById('device-dropdown'),
    changeButton: document.getElementById('device-change')
  };

  const audioContext = new AudioContext();
  const osc = new OscillatorNode(audioContext, {type: 'sawtooth'});
  const amp = new GainNode(audioContext, {gain: 0.015});
  osc.connect(amp).connect(audioContext.destination);
  osc.start();

  if (typeof audioContext.setSinkId !== 'function' ||
      typeof audioContext.sinkId != 'string') {
    appView.log.textContent =
        'This browser does not support AudioContext.setSinkId()';
    return;
  }

  appView.inspector.textContent =
      `AudioContext.sinkId = ${sanitizeSinkId(audioContext.sinkId)}
      (${audioContext.destination.maxChannelCount} channels max)`;

  // Get a permission, enumerate devices, and set up the UI.
  try {
    const stream =
        await navigator.mediaDevices.getUserMedia({ audio: true });
    if (stream) {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      let deviceListString = '';
      deviceList.forEach((device) => {
        if (device.kind === 'audiooutput') {
          deviceListString +=
              `<option value="${device.deviceId}">${device.label}</option>`;
        }
      });
      deviceListString +=
          `<option value="silent">none (silent output)</option>`;
      appView.dropdown.innerHTML = deviceListString;
      appView.changeButton.addEventListener('click', (event) => {
        audioContext.resume();
        onDeviceChange(event, audioContext, appView);
      });
      appView.dropdown.disabled = false;
      appView.changeButton.disabled = false;
      appView.log.textContent =
          'Retrieved device information successfully. Ready to test.';
    } else {
      appView.log.textContent =
          'navigator.mediaDevices.getUserMedia() failed.';
    }
  } catch (error) {
    // The permission dialog was dismissed, or acquiring a stream from
    // getUserMedia() failed.
    console.error(error);
    appView.log.textContent = `The initialization failed: ${error}`;
  }
};

// Entry point
window.addEventListener('load', startManualTest);
