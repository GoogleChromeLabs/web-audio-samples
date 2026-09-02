// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @classdesc A FIFO (First-In-First-Out) class specifically designed for
 * caching values and extracting a minimum value over time for VUMeter.
 */
class FIFO {
  /**
   * @param {number} size The size of the FIFO queue.
   */
  constructor(size) {
    this.size_ = size;
    this.data_ = new Float32Array(size);
    this.head_ = 0;
    this.tail_ = 0;
    this.count_ = 0;
  }

  /**
   * Pushes a new value into the FIFO.
   * @param {number} value
   */
  push(value) {
    if (this.count_ === this.size_) {
      this.head_ = (this.head_ + 1) % this.size_;
      this.count_--;
    }
    this.data_[this.tail_] = value;
    this.tail_ = (this.tail_ + 1) % this.size_;
    this.count_++;
  }

  /**
   * Returns array of FIFO contents in insertion order.
   * @returns {number[]}
   */
  toArray() {
    const result = [];
    let index = this.head_;
    for (let i = 0; i < this.count_; i++) {
      result.push(this.data_[index]);
      index = (index + 1) % this.size_;
    }
    return result;
  }

  /**
   * Finds and returns the minimum element among active entries in the FIFO.
   * @returns {number}
   */
  getMinValue() {
    if (this.count_ === 0) {
      return 0;
    }
    let minValue = this.data_[this.head_];
    let index = this.head_;
    for (let i = 0; i < this.count_; i++) {
      if (this.data_[index] < minValue) {
        minValue = this.data_[index];
      }
      index = (index + 1) % this.size_;
    }
    return minValue;
  }

  /**
   * Clears all elements from the FIFO queue.
   */
  clear() {
    this.head_ = 0;
    this.tail_ = 0;
    this.count_ = 0;
    this.data_.fill(0);
  }
}

export default FIFO;
