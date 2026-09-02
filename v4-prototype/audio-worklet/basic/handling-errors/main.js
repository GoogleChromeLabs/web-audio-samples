// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import ConsoleLogger from './ConsoleLogger.js';

let audioContext = null;
let logger = null;

/**
 * Sets up the AudioContext and registers the error processor module.
 * @return {Promise<AudioContext>} The initialized AudioContext.
 */
export const setup = async () => {
  audioContext = new AudioContext();
  await audioContext.suspend();

  logger = new ConsoleLogger('#console-logger', {
    title: 'Handling Errors - Live Log',
    maxHeight: '22rem',
    minHeight: '12rem',
  });

  const processorUrl =
    new URL('error-processor.js', import.meta.url).href;
  await audioContext.audioWorklet.addModule(processorUrl);

  return audioContext;
};

/**
 * Formats and logs comprehensive details from an onprocessorerror event.
 * @param {string} phase - 'constructor' | 'process'.
 * @param {Event} event - The processorerror Event object.
 * @param {string} description - The error thrown by the processor.
 */
const logErrorDetails = (phase, event, description) => {
  let details =
    `[onprocessorerror] Exception caught in ${phase}()\n` +
    `  • Thrown: "${description}"\n` +
    `  • Event Type: "${event?.type || 'processorerror'}"\n` +
    `  • Node: "${event?.target?.constructor?.name || 'AudioWorkletNode'}"`;

  if (event?.error) {
    const err = event.error;
    details += `\n  • Error: ${err.message || err}`;
    if (err.stack) {
      details += `\n  • Stack:\n    ${err.stack.split('\n').join('\n    ')}`;
    }
  } else if (event?.message) {
    details += `\n  • Message: ${event.message}`;
  }

  if (logger) {
    logger.error(details);
  } else {
    console.error(details);
  }
};

/**
 * Instantiates error-throwing nodes and listens for onprocessorerror events.
 * @param {AudioContext} context - The active AudioContext.
 */
export const start = async (context) => {
  if (logger) {
    logger.log('Starting error test nodes...');
  }

  // To handle an error from the construction phase.
  const constructorErrorWorkletNode =
    new AudioWorkletNode(context, 'constructor-error');
  constructorErrorWorkletNode.onprocessorerror = (event) => {
    logErrorDetails(
      'constructor',
      event,
      'ConstructorErrorProcessor: an error thrown from constructor.'
    );
  };

  // To handle an error from AudioWorkletProcessor.process() function.
  const processErrorWorkletNode =
    new AudioWorkletNode(context, 'process-error');
  processErrorWorkletNode.onprocessorerror = (event) => {
    logErrorDetails(
      'process',
      event,
      'ProcessErrorProcessor: an error thrown from process method.'
    );
  };

  // To update processor's internal timer, the node must be connected to
  // the graph.
  processErrorWorkletNode.connect(context.destination);
};
