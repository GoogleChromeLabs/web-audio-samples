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

## Overview

Demonstrates asynchronous bi-directional communication between the main
thread (`AudioWorkletNode.port`) and the audio rendering thread
(`AudioWorkletProcessor.port`) using the HTML5 `MessagePort` interface.

The audio graph connects the `AudioWorkletNode` (`messenger-processor`)
directly to `AudioContext.destination` to maintain continuous render cycles
while passing messages across thread boundaries.

Because AudioWorklet runs on a real-time thread where blocking locks or
synchronous RPCs are prohibited, `MessagePort` provides a thread-safe,
non-blocking IPC mechanism for telemetry, parameter changes, and state events.

## Technical Details

### Architecture & Implementation

1. **Audio Thread Transmission**: The processor posts timestamped messages
   via `this.port.postMessage()`:
   ```javascript
   if (currentTime - this._lastUpdate > 1.0) {
     this.port.postMessage({
       message: '1 second passed.',
       contextTimestamp: currentTime,
     });
     this._lastUpdate = currentTime;
   }
   ```
2. **Main Thread Reception & Response**: The node listens to `port.onmessage`
   and dispatches replies back through the port:
   ```javascript
   this.port.onmessage = (event) => {
     console.log('Received from processor:', event.data);
     if (++this.counter === 10) {
       this.port.postMessage({
         message: '10 messages received!',
         contextTimestamp: this.context.currentTime,
       });
       this.counter = 0;
     }
   };
   ```

### Messaging Protocol

| Channel | Trigger | Payload |
| :--- | :--- | :--- |
| Processor → Node | Every 1.0s in `process()` | `{ message, timestamp }` |
| Node → Processor | Every 10 messages | `{ message, timestamp }` |

### Additional Notes

- **Non-Blocking IPC**: `postMessage` delivers structured clones without
  blocking the high-priority audio rendering thread.
- **Transferable Objects**: For large typed arrays, pass transferables
  `[buffer]` to transfer memory ownership with zero copy overhead.
- **Specification Reference**:
  [W3C Web Audio API: MessagePort][spec-link].

[spec-link]: https://www.w3.org/TR/webaudio/#dom-audioworkletnode-port
