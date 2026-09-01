---
title: Handling Errors
description: >
  Demonstrates catching AudioWorkletProcessor runtime errors with the
  onprocessorerror event handler.
category: basic
order: 6
tags:
  - basic
  - errors
  - onprocessorerror
  - debugging
  - audioworklet
demoTitle: Handling Errors
demoDescription: >
  Click START to trigger and catch processor construction and process errors.
---

This example demonstrates catching runtime exceptions thrown by an
`AudioWorkletProcessor` using the `onprocessorerror` event handler on
`AudioWorkletNode`.

Errors can occur during two distinct phases of a processor lifecycle:
1. **Construction Phase (`constructor`)**: When the processor instance is being
   instantiated upon `new AudioWorkletNode()`.
2. **Audio Rendering Phase (`process`)**: When the processor callback executes
   on the audio rendering thread.

This Web Audio setup tests two dedicated error-throwing processors:
1. **`constructor-error`**: Throws an exception inside its constructor
   function.
2. **`process-error`**: Throws an exception inside its `process()` loop when
   connected to the audio graph.

### Main Thread Setup

On the main thread, the `AudioWorkletProcessor` module is loaded
asynchronously using `audioContext.audioWorklet.addModule()`. When started,
the nodes are created and their `onprocessorerror` handlers listen for error
events:

```javascript
// main.js
import ConsoleLogger from './ConsoleLogger.js';

let audioContext = null;
let logger = null;

// 1. Setup AudioContext and register processor module
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

// 2. Instantiate error-throwing nodes upon user gesture
export const start = async (context) => {
  logger.log('Starting error test nodes...');

  // Handle an error from the construction phase:
  const constructorErrorNode =
    new AudioWorkletNode(context, 'constructor-error');
  constructorErrorNode.onprocessorerror = (event) => {
    logErrorDetails(
      'constructor',
      event,
      'ConstructorErrorProcessor: an error thrown from constructor.'
    );
  };

  // Handle an error from the process callback:
  const processErrorNode =
    new AudioWorkletNode(context, 'process-error');
  processErrorNode.onprocessorerror = (event) => {
    logErrorDetails(
      'process',
      event,
      'ProcessErrorProcessor: an error thrown from process method.'
    );
  };

  processErrorNode.connect(context.destination);
};
```

### Audio Thread Setup

This script defines two processors that intentionally throw errors to verify
that `onprocessorerror` triggers correctly:

```javascript
// error-processor.js
class ConstructorErrorProcessor extends AudioWorkletProcessor {
  constructor() {
    throw new Error(
      'ConstructorErrorProcessor: an error thrown from constructor.'
    );
  }

  process() {
    return true;
  }
}

class ProcessErrorProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process() {
    throw new Error(
      'ProcessErrorProcessor: an error thrown from process method.'
    );
  }
}

registerProcessor('constructor-error', ConstructorErrorProcessor);
registerProcessor('process-error', ProcessErrorProcessor);
```

For more background on the architecture, see the
[Chrome Developers article on AudioWorklet][article-link].

[article-link]: https://developer.chrome.com/blog/audio-worklet/
