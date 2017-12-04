// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Singleton/global object for AudioWorklet demo projects.
 * @type {Object}
 */
const AudioWorkletHelper = (() => {

  const MessageType = ['info', 'warning', 'error'];

  let demoFunction_ = new Function();
  let reporterInitialized_ = false;
  let eReporterDiv_;

  // Check if BaseAudioContext has AudioWorklet.
  let IsAudioWorkletInBaseAudioContext_ = (() => {
    let context = new OfflineAudioContext(1, 1, 44100);
    return context.audioWorklet &&
        typeof context.audioWorklet.addModule === 'function';
  });

  function isAvailable_() {
    return IsAudioWorkletInBaseAudioContext_;
  }

  function initializeHelper_() {
    if (reporterInitialized_) return;

    eReporterDiv_ = document.createElement('div');
    eReporterDiv_.id = 'lib-audioworklet-reporter';
    document.body.appendChild(eReporterDiv_);
    reporterInitialized_ = true;
  }

  function addButton_() {
    let eButton = document.createElement('button');
    eButton.textContent = 'Start Demo';
    eButton.className = 'demo-start';
    eReporterDiv_.appendChild(eButton);
    eButton.onclick = () => {
      eButton.disabled = true;
      demoFunction_();
    };
  }

  function reportMessage_(type, message) {
    if (!MessageType.includes(type)) return;

    let messageDiv = document.createElement('div');
    messageDiv.textContent = String(message);
    messageDiv.className = type;
    eReporterDiv_.appendChild(messageDiv);
  }

  return {
    /**
     * Sniff AudioWorklet interface and run demo function if possible.
     * @param {Function} demoFunction - Function contains demo script.
     */
    addDemo: (demoFunction) => {
      window.addEventListener('load', () => {
        initializeHelper_();
        if (isAvailable_()) {
          demoFunction_ = demoFunction;
          addButton_();
          reportMessage_('info',
                         'AudioWorklet is available and the demo is ready.');
        } else {
          reportMessage_('error',
                         'The browser does not support AudioWorklet yet.');
        }
      });
    },

    /**
     * Check if the browser supports AudioWorklet.
     * @return {Boolean} true if the browser supports AudioWorklet.
     */
    isAvailable: isAvailable_
  };
})();
