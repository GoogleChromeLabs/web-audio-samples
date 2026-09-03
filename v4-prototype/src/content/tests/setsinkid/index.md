---
title: AudioContext.setSinkId() Manual Test
description: >
  Manual verification fixture for audio output device switching and
  silent sink routing.
category: manual
order: 1
tags:
  - manual
  - routing
  - setsinkid
  - devices
testTitle: AudioContext.setSinkId() Hardware Routing
testDescription: Select an audio output device or silent sink and apply routing.
---

## Overview

The `AudioContext.setSinkId()` method allows web applications to route audio
output directly to specific hardware devices (e.g. external USB DACs,
Bluetooth headphones, or multi-channel interfaces) or to a silent sink without
changing the operating system's default audio output device.

This manual test verifies:
1. Browser support for `AudioContext.setSinkId()` and `AudioContext.sinkId`.
2. Device enumeration via `navigator.mediaDevices.enumerateDevices()`.
3. Dynamic switching between the default system output, specific device IDs,
   and the silent sink (`{ type: 'none' }`).
4. Output channel capability inspection via
   `AudioContext.destination.maxChannelCount`.

## How to Test

1. Click **START TEST** to initialize the `AudioContext` and start a 440 Hz
   sawtooth test tone at low amplitude.
2. If prompted, grant microphone permission so the browser can reveal
   human-readable hardware device names.
3. Select an output device from the dropdown and click **Apply Sink ID**.
4. Confirm that audio immediately transfers to the selected hardware output
   without stuttering or crashing.
5. Select **None (Silent Sink)** to verify that audio processing continues
   while output is muted at the OS driver level.

## Implementation Details

### Device Enumeration & Permissions

To obtain descriptive labels for output devices, the page requests
temporary media stream access via `getUserMedia()`, immediately stopping the
acquired microphone tracks to release the hardware:

```javascript
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
stream.getTracks().forEach((track) => track.stop());

const devices = await navigator.mediaDevices.enumerateDevices();
const audioOutputs = devices.filter((d) => d.kind === 'audiooutput');
```

### Applying Sink ID

The `setSinkId()` method accepts either an empty string for the system default,
a valid `deviceId` string, or an options dictionary for silent sink:

```javascript
// Default output device
await audioContext.setSinkId('');

// Specific hardware device
await audioContext.setSinkId(deviceId);

// Silent sink (audio processed without physical output)
await audioContext.setSinkId({ type: 'none' });
```

## References

- <a
    href="https://webaudio.github.io/web-audio-api/#dom-audiocontext-setsinkid"
    target="_blank"
    rel="noopener"
  >W3C Web Audio API: AudioContext.setSinkId()</a>
- <a target="_blank" rel="noopener"
href="https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/setSinkId"
>MDN Web Docs: AudioContext.setSinkId()</a>
