// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import ConsoleLogger from './ConsoleLogger.js';

let audioContext = null;
let messengerNode = null;
let logger = null;

// Extends AudioWorkletNode to simplify cross-thread message posting.
class MessengerWorkletNode extends AudioWorkletNode {
  constructor(context) {
    super(context, 'messenger-processor');
    this.counter_ = 0;
    this.port.onmessage = this.handleMessage_.bind(this);
    if (logger) {
      logger.log('[Node:constructor] created.');
    } else {
      console.log('[Node:constructor] created.');
    }
  }

  handleMessage_(event) {
    const text =
      `[Node:handleMessage_] ${event.data.message} ` +
      `(${event.data.contextTimestamp})`;
    if (logger) {
      logger.log(text);
    } else {
      console.log(text);
    }

    if (++this.counter_ === 10) {
      if (logger) {
        logger.warn(
          '[Node:postMessage] 10 messages received! Replying to processor.'
        );
      }
      this.port.postMessage({
        message: '10 messages received!',
        contextTimestamp: this.context.currentTime,
      });
      this.counter_ = 0;
    }
  }
}

/**
 * Sets up the AudioContext and registers the messenger processor module.
 * @return {Promise<AudioContext>} The initialized AudioContext.
 */
export const setup = async () => {
  audioContext = new AudioContext();
  await audioContext.suspend();

  logger = new ConsoleLogger('#console-logger', {
    title: 'MessagePort IPC - Live Log',
  });

  const processorUrl =
    new URL('messenger-processor.js', import.meta.url).href;
  await audioContext.audioWorklet.addModule(processorUrl);

  return audioContext;
};

/**
 * Instantiates the messenger node and initiates message exchange.
 * @param {AudioContext} context - The active AudioContext.
 */
export const start = async (context) => {
  if (!messengerNode) {
    messengerNode = new MessengerWorkletNode(context);
    // Connect to destination to ensure the worklet is processed continuously.
    messengerNode.connect(context.destination);
  }
};
