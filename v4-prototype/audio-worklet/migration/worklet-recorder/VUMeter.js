// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import FIFO from './FIFO.js';

/**
 * @classdesc Renders a volume level (VU) meter onto a Canvas element.
 * Supports rendering from an AnalyserNode or directly from volume levels.
 */
class VUMeter {
  /**
   * @param {string|HTMLCanvasElement} canvasTarget Canvas selector or element.
   * @param {number|object} [minDecibelOrOptions=-40] Min dB or options object.
   * @param {AnalyserNode} [analyserNode=null] AnalyserNode for audio data.
   * @param {number} [fftSize=32] FFT window size.
   * @param {number} [fifoSize=6] FIFO queue size for smoothing.
   */
  constructor(
    canvasTarget,
    minDecibelOrOptions = -40,
    analyserNode = null,
    fftSize = 32,
    fifoSize = 6
  ) {
    if (typeof canvasTarget === 'string') {
      this.canvas_ = document.querySelector(canvasTarget);
    } else {
      this.canvas_ = canvasTarget;
    }

    if (!this.canvas_) {
      throw new Error(`VUMeter: canvas element not found (${canvasTarget})`);
    }

    this.canvasContext_ = this.canvas_.getContext('2d');

    const rect = this.canvas_.getBoundingClientRect();
    const w =
      rect.width > 0
        ? rect.width
        : this.canvas_.offsetWidth || this.canvas_.width || 32;
    const h =
      rect.height > 0
        ? rect.height
        : this.canvas_.offsetHeight || this.canvas_.height || 100;

    this.canvas_.width = Math.max(16, Math.round(w));
    this.canvas_.height = Math.max(40, Math.round(h));

    this.width_ = this.canvas_.width;
    this.height_ = this.canvas_.height;

    let minDecibel = -40;
    let actualAnalyser = analyserNode;
    let actualFftSize = fftSize;
    let actualFifoSize = fifoSize;
    let backgroundColor = 'transparent';

    if (
      typeof minDecibelOrOptions === 'object' &&
      minDecibelOrOptions !== null
    ) {
      minDecibel = minDecibelOrOptions.minDecibel ?? -40;
      actualAnalyser = minDecibelOrOptions.analyser ?? analyserNode;
      actualFftSize = minDecibelOrOptions.fftSize ?? fftSize;
      actualFifoSize = minDecibelOrOptions.fifoSize ?? fifoSize;
      backgroundColor = minDecibelOrOptions.backgroundColor ?? 'transparent';
    } else if (typeof minDecibelOrOptions === 'number') {
      minDecibel = minDecibelOrOptions;
    }

    this.minDisplayDecibel_ = Math.abs(minDecibel);
    this.backgroundColor_ = backgroundColor;
    this.fifo_ = new FIFO(actualFifoSize);

    this.analyser_ = null;
    this.dataArray_ = null;
    if (actualAnalyser) {
      this.setAnalyserNode(actualAnalyser, actualFftSize);
    }
  }

  /**
   * Sets or updates the connected AnalyserNode.
   * @param {AnalyserNode} analyserNode
   * @param {number} [fftSize=32]
   */
  setAnalyserNode(analyserNode, fftSize = 32) {
    this.analyser_ = analyserNode;
    if (this.analyser_) {
      this.analyser_.fftSize = fftSize;
      this.dataArray_ = new Float32Array(this.analyser_.frequencyBinCount);
    } else {
      this.dataArray_ = null;
    }
  }

  /**
   * Calculates Root Mean Square (RMS) value from input array.
   * @param {Float32Array|number[]} inputArray
   * @returns {number}
   */
  calculateRMS(inputArray) {
    let sumOfSquares = 0;
    for (let i = 0; i < inputArray.length; i++) {
      sumOfSquares += inputArray[i] * inputArray[i];
    }
    const meanSquare = sumOfSquares / inputArray.length;
    return Math.sqrt(meanSquare);
  }

  /**
   * Resets the FIFO buffer and draws the meter at zero volume (silent).
   */
  reset() {
    this.fifo_.clear();
    for (let i = 0; i < this.fifo_.size_; i++) {
      this.fifo_.push(this.minDisplayDecibel_);
    }
    this.draw(0);
  }

  /**
   * Renders the VU meter on canvas.
   * Can be invoked with a direct numeric volume level or without arguments
   * to sample from the connected AnalyserNode.
   * @param {number} [volume] Optional direct RMS volume level (0.0 to 1.0).
   */
  draw(volume) {
    let rootMeanSquare;
    if (typeof volume === 'number') {
      rootMeanSquare = volume;
    } else if (this.analyser_ && this.dataArray_) {
      this.analyser_.getFloatTimeDomainData(this.dataArray_);
      rootMeanSquare = this.calculateRMS(this.dataArray_);
    } else {
      return;
    }

    if (rootMeanSquare <= 0) {
      rootMeanSquare = 1e-5;
    }

    const decibel = 20 * Math.log10(rootMeanSquare);
    const absDecibel = Math.abs(decibel);
    this.fifo_.push(absDecibel);
    const minDecibel = this.fifo_.getMinValue();

    const meterHeight =
      minDecibel > this.minDisplayDecibel_
        ? this.height_
        : (minDecibel / this.minDisplayDecibel_) * this.height_;

    this.canvasContext_.clearRect(0, 0, this.width_, this.height_);

    if (this.backgroundColor_ && this.backgroundColor_ !== 'transparent') {
      this.canvasContext_.fillStyle = this.backgroundColor_;
      this.canvasContext_.fillRect(0, 0, this.width_, this.height_);
    }

    if (meterHeight < this.height_) {
      const gradient = this.canvasContext_.createLinearGradient(
        0,
        0,
        0,
        this.height_
      );
      gradient.addColorStop(0, '#ef4444');
      gradient.addColorStop(0.15, '#f59e0b');
      gradient.addColorStop(0.35, '#eab308');
      gradient.addColorStop(0.6, '#10b981');
      gradient.addColorStop(1, '#059669');

      this.canvasContext_.fillStyle = gradient;
      this.canvasContext_.fillRect(
        0,
        meterHeight,
        this.width_,
        this.height_ - meterHeight
      );
    }

    this.canvasContext_.strokeStyle = '#475569';
    this.canvasContext_.lineWidth = 1;
    this.canvasContext_.globalAlpha = 0.4;
    this.canvasContext_.beginPath();
    for (let p = 0.2; p < 1.0; p += 0.2) {
      const y = Math.round(this.height_ * p);
      this.canvasContext_.moveTo(0, y);
      this.canvasContext_.lineTo(this.width_, y);
    }
    this.canvasContext_.stroke();
    this.canvasContext_.globalAlpha = 1.0;
  }
}

export default VUMeter;
