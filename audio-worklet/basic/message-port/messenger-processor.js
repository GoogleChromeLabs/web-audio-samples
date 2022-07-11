// Copyright (c) 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* global currentTime */

/**
 * A simple MessagePort tester.
 *
 * @class MessengerProcessor
 * @extends AudioWorkletProcessor
 */
class MessengerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._lastUpdate = currentTime;
    this.port.onmessage = this.handleMessage_.bind(this);
  }

  handleMessage_(event) {
    console.log('[Processor:Received] ' + event.data.message +
                ' (' + event.data.contextTimestamp + ')');
  }

  process() {
    // Post a message to the node for every 1 second.
    if (currentTime - this._lastUpdate > 1.0) {
      this.port.postMessage({
        message: '1 second passed.',
        contextTimestamp: currentTime,
      });
      this._lastUpdate = currentTime;
    }

    return true;
  }
}

registerProcessor('messenger-processor', MessengerProcessor);
