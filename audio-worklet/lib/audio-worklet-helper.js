// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Singleton/global object for AudioWorklet demo projects.
 * @type {Object}
 */
const AudioWorkletHelper = (() => {

  const MessageType = ['info', 'warning', 'error'];

  let reporterInitialized_ = false;
  let eReporterDiv;

  function isAvailable_() {
    return window.audioWorklet &&
        typeof window.audioWorklet.addModule === 'function';
  }

  function initializeReporter_() {
    if (reporterInitialized_) return;

    eReporterDiv = document.createElement('div');
    eReporterDiv.id = 'libaudioworklet-reporter';
    document.body.appendChild(eReporterDiv);
    reporterInitialized_ = true;
  }

  function reportMessage_(type, message) {
    if (!MessageType.includes(type)) return;

    let messageDiv = document.createElement('div');
    messageDiv.textContent = '[' + type.toUpperCase() + '] ' + String(message);
    messageDiv.className = type;
    eReporterDiv.appendChild(messageDiv);
  }

  return {
    /**
     * Sniff AudioWorklet interface and run demo function if possible.
     * @param {Function} demoFunc Function contains demo script.
     */
    startDemo: (demoFunc) => {
      window.addEventListener('load', () => {
        initializeReporter_();
        if (isAvailable_()) {
          reportMessage_('info',
                         'AudioWorklet is available. Start running demo...');
          demoFunc();
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
