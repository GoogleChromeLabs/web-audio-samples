---
title: PannerNode Spatialization & Glitch Verification
description: >
  Manual verification fixture for HRTF spatialization sweeps across
  X, Y, and Z axes without audio clicks or discontinuities.
category: manual
order: 2
tags:
  - manual
  - spatial
  - pannernode
  - hrtf
testTitle: 3-Axis HRTF Spatialization Sweep
testDescription: Runs consecutive 3-second sweeps across X, Y, and Z axes.
---

## Overview

In the Web Audio API, the `PannerNode` provides 3D spatial positioning using
either simple equal-power panning or sophisticated Head-Related Transfer
Function (HRTF) convolution kernels.

During dynamic coordinate interpolation (e.g. `linearRampToValueAtTime` on
`AudioParam` positions `positionX`, `positionY`, and `positionZ`), the internal
convolution kernels and crossfades must smoothly transition between elevation
and azimuth angles without audible clicks, zipper noise, or sudden amplitude
drops.

This test plays three consecutive 3-second segments of a
`ConstantSourceNode` with a DC offset of 0.5 through an HRTF `PannerNode`.
Because the input signal is flat DC, any sound heard other than smooth,
continuous spatial localization indicates an audio rendering artifact.

## Test Sequence

The sweep executes in three distinct 3-second phases (9 seconds total):

1. **Phase 1: X-Axis Sweep (0s – 3s)**:
   Source pans from left (`positionX = -1.0`) to right (`positionX = +1.0`)
   at fixed `positionY = 0.1` and `positionZ = 0.1`.
2. **Phase 2: Y-Axis Sweep (3s – 6s)**:
   Source pans from bottom (`positionY = -1.0`) to top (`positionY = +1.0`)
   at fixed `positionX = 0.1` and `positionZ = 0.1`.
3. **Phase 3: Z-Axis Sweep (6s – 9s)**:
   Source pans from front (`positionZ = -1.0`) to back (`positionZ = +1.0`)
   at fixed `positionX = 0.1` and `positionY = 0.1`.

## Implementation Details

The audio graph connects a DC offset source to an HRTF panner:

```javascript
const audioContext = new AudioContext();
const source = new ConstantSourceNode(audioContext, { offset: 0.5 });
const gain = new GainNode(audioContext, { gain: 0.25 });
const panner = new PannerNode(audioContext, { panningModel: 'HRTF' });

source.connect(gain).connect(panner).connect(audioContext.destination);
source.start();

// Schedule continuous linear parameter automation
const now = audioContext.currentTime;
panner.positionX.setValueAtTime(-1.0, now);
panner.positionX.linearRampToValueAtTime(1.0, now + 3.0);
```

## References

- [W3C Web Audio API: Spatialization Specification][spatial-spec]
- [W3C Web Audio API: PannerNode Interface][panner-spec]

[spatial-spec]: https://webaudio.github.io/web-audio-api/#Spatialization
[panner-spec]: https://webaudio.github.io/web-audio-api/#PannerNode
