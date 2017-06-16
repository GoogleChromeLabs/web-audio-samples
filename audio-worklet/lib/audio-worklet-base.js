// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Base library for AudioWorklet sample projects.
 * @type {Object}
 */
const LibAudioWorklet = (() => {

  const MessageType = ['info', 'warning', 'error'];

  let reporterInitialized_ = false;
  let eReporterDiv;

  /**
   * Check if AudioWorklet feature is available in the browser.
   * @return {Boolean}
   */
  function isAvailable_() {
    return window.audioWorklet
        && typeof window.audioWorklet.addModule === 'function';
  }

  /**
   * Initialize |libaudioworklet-reporter| div element for textual reporting.
   * Should be called after |onload| event.
   */
  function initializeReporter_() {
    if (reporterInitialized_)
      return;

    eReporterDiv = document.createElement('div');
    eReporterDiv.id = 'libaudioworklet-reporter';
    document.body.appendChild(eReporterDiv);
    reporterInitialized_ = true;
  }

  /**
   * Report message to the reporter div.
   * @param {String} type Message type.
   * @param {String} message Message to be printed.
   */
  function reportMessage_(type, message) {
    if (!MessageType.includes(type))
      return;

    let messageDiv = document.createElement('div');
    messageDiv.textContent =
        '[' + type.toUpperCase() + '] ' + String(message);
    messageDiv.className = type;
    eReporterDiv.appendChild(messageDiv);
  }

  return {
    isAvailable: isAvailable_,
    initializeReporter: initializeReporter_,
    reportMessage: reportMessage_
  };

})();
