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

## Overview

Demonstrates trapping runtime exceptions thrown by an `AudioWorkletProcessor`
using the `onprocessorerror` event handler on `AudioWorkletNode`.

The test graph instantiates two distinct error-throwing worklets. The first node
throws during constructor execution, while the second node connects directly to
`AudioContext.destination` to activate the real-time processing loop and throw
inside its `process()` callback.

When an unhandled exception occurs on the audio rendering thread, the browser
dispatches a `processorerror` event to the corresponding `AudioWorkletNode` on
the main thread, allowing developers to catch and log audio failures cleanly.

## Technical Details

### Architecture & Implementation

1. **Catching Construction Errors**: Thrown immediately when
   `new AudioWorkletNode()` instantiates the processor on the audio thread:
   ```javascript
   const constructorNode =
     new AudioWorkletNode(context, 'constructor-error');
   constructorNode.onprocessorerror = (event) => {
     console.error('Caught error during construction phase:', event);
   };
   ```
2. **Catching Render Process Errors**: Thrown during audio graph execution:
   ```javascript
   const processNode = new AudioWorkletNode(context, 'process-error');
   processNode.onprocessorerror = (event) => {
     console.error('Caught error during process() callback:', event);
   };
   processNode.connect(context.destination);
   ```
3. **Audio Thread Exception**:
   ```javascript
   class ProcessErrorProcessor extends AudioWorkletProcessor {
     process() {
       throw new Error('Exception inside process() callback.');
     }
   }
   registerProcessor('process-error', ProcessErrorProcessor);
   ```

### Error Phases

| Phase | Trigger | Processor Behavior |
| :--- | :--- | :--- |
| **Constructor** | In `constructor()` | Instantiation fails; no audio |
| **Process** | In `process()` | Audio halts; emits silence |

### Additional Notes

- **Permanent Error State**: Once a processor throws an unhandled exception in
  `process()`, the browser marks it as errored and permanently stops calling
  `process()`. The node produces silence indefinitely.
- **Diagnostics**: The `processorerror` event object does not leak private
  audio thread memory; details are communicated via structured events.
- **Specification Reference**:
  [W3C Web Audio API: onprocessorerror][spec-link].

[spec-link]: https://www.w3.org/TR/webaudio/#AudioWorkletNode
