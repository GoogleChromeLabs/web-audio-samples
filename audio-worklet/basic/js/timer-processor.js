// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * This processor class is for the life cycle and the processor state event.
 * It only lives for 1 second.
 *
 * @class TimerProcessor
 * @extends AudioWorkletProcessor
 */
class TimerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.createdAt_ = currentTime;
    this.lifetime_ = 1.0;
  }

  process() {
    return currentTime - this.createdAt_ > this.lifetime_ ? false : true;
  }
}

registerProcessor('timer-processor', TimerProcessor);
