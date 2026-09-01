---
title: MessagePort Communication
description: >
  Demonstrates bi-directional message communication between AudioWorkletNode
  and AudioWorkletProcessor using MessagePort.
category: basic
order: 7
tags:
  - basic
  - messageport
  - ipc
  - audioworklet
demoTitle: MessagePort Communication
demoDescription: >
  Click START to initiate bi-directional MessagePort IPC communication.
---

This example demonstrates bi-directional communication between the main thread
(`AudioWorkletNode`) and the audio rendering thread (`AudioWorkletProcessor`)
using the HTML5 `MessagePort` interface.

The communication flow operates as follows:
1. Every second, the `MessengerProcessor` on the audio thread sends a
   timestamped notification message to the main thread via
   `this.port.postMessage()`.
2. The `MessengerWorkletNode` receives the message in its `port.onmessage`
   handler and logs it to the console.
3. Every 10 received messages, the node posts a reply back to the processor
   via `this.port.postMessage()`, closing the loop.

This Web Audio setup connects two core components:
1. **`AudioWorkletNode`** and **`AudioWorkletProcessor`**: Exchanges structured
   messages asynchronously between threads without blocking audio rendering.
2. **`AudioDestinationNode`**: Kept connected to pull audio rendering ticks
   steadily through the worklet.

### Main Thread Setup

On the main thread, the `AudioWorkletProcessor` module is loaded
asynchronously using `audioContext.audioWorklet.addModule()`. A custom
subclass of `AudioWorkletNode` encapsulates message dispatching:

```javascript
// main.js
import ConsoleLogger from './ConsoleLogger.js';

let audioContext = null;
let messengerNode = null;
let logger = null;

class MessengerWorkletNode extends AudioWorkletNode {
  constructor(context) {
    super(context, 'messenger-processor');
    this.counter_ = 0;
    this.port.onmessage = this.handleMessage_.bind(this);
    logger.log('[Node:constructor] created.');
  }

  handleMessage_(event) {
    logger.log(
      `[Node:Received] ${event.data.message} ` +
      `(${event.data.contextTimestamp})`
    );

    // Send a reply every 10 messages:
    if (++this.counter_ === 10) {
      logger.warn('[Node:postMessage] 10 messages received! Replying.');
      this.port.postMessage({
        message: '10 messages received!',
        contextTimestamp: this.context.currentTime,
      });
      this.counter_ = 0;
    }
  }
}

// 1. Setup AudioContext and register processor module
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

// 2. Instantiate node and connect on user gesture
export const start = async (context) => {
  if (!messengerNode) {
    messengerNode = new MessengerWorkletNode(context);
    messengerNode.connect(context.destination);
  }
};
```

### Audio Thread Setup

This `AudioWorkletProcessor` script runs on the audio rendering thread,
posting periodic messages to the node and logging replies from the main thread:

```javascript
// messenger-processor.js
class MessengerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._lastUpdate = currentTime;
    this.port.onmessage = this.handleMessage_.bind(this);
  }

  handleMessage_(event) {
    console.log(
      `[Processor:Received] ${event.data.message} ` +
      `(${event.data.contextTimestamp})`
    );
  }

  process() {
    // Post a message to the node every 1 second:
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
```

For more background on the architecture, see the
[Chrome Developers article on AudioWorklet][article-link].

[article-link]: https://developer.chrome.com/blog/audio-worklet/
