// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @classdesc Waveform implements an audio track waveform visualization that
 * scrolls horizontally to capture recorded audio over time. Features
 * logarithmic dB scaling, amplitude-based color levels, and smooth scrolling.
 */
class Waveform {
  /**
   * @constructor
   * @param {string|HTMLCanvasElement} canvasTarget Element or CSS selector.
   * @param {AnalyserNode} [analyserNode=null] AnalyserNode for visualization.
   * @param {number} [fftSize=1024] FFT window size for AnalyserNode.
   * @param {number} [barWidth=2] Bar width and horizontal scroll step.
   */
  constructor(canvasTarget, analyserNode = null, fftSize = 1024, barWidth = 2) {
    this.canvas_ =
      typeof canvasTarget === 'string'
        ? document.querySelector(canvasTarget)
        : canvasTarget;
    this.canvasContext_ = this.canvas_.getContext('2d');

    const rect = this.canvas_.getBoundingClientRect();
    const w =
      rect.width > 0
        ? rect.width
        : this.canvas_.offsetWidth || this.canvas_.width || 600;
    const h =
      rect.height > 0
        ? rect.height
        : this.canvas_.offsetHeight || this.canvas_.height || 100;

    this.canvas_.width = Math.max(300, Math.round(w));
    this.canvas_.height = Math.max(60, Math.round(h));

    this.width_ = this.canvas_.width;
    this.height_ = this.canvas_.height;

    this.barWidth_ = barWidth;
    this.scrollStep_ = this.barWidth_;
    this.currentX_ = 0;

    this.amplitudeScale_ = 0.85;
    this.minDb_ = -60;
    this.maxDb_ = 0;

    this.analyser_ = null;
    this.dataArray_ = null;
    if (analyserNode) {
      this.setAnalyserNode(analyserNode, fftSize);
    }

    this.sampleBuffer_ = [];
    this.bufferSize_ = 5;

    this.drawBackground_();
  }

  /**
   * Connects or updates the AnalyserNode source.
   * @param {AnalyserNode} analyserNode
   * @param {number} [fftSize=1024]
   */
  setAnalyserNode(analyserNode, fftSize = 1024) {
    this.analyser_ = analyserNode;
    if (this.analyser_) {
      this.analyser_.fftSize = fftSize;
      this.analyser_.smoothingTimeConstant = 0.3;
      this.dataArray_ = new Float32Array(this.analyser_.frequencyBinCount);
    }
  }

  /**
   * Sets amplitude scale factor.
   * @param {number} scale Scale factor (0.1 to 2.0).
   */
  setAmplitudeScale(scale) {
    this.amplitudeScale_ = Math.max(0.1, Math.min(2.0, scale));
  }

  /**
   * Resets the waveform canvas to the starting position and redraws background.
   */
  reset() {
    this.currentX_ = 0;
    this.sampleBuffer_ = [];
    this.drawBackground_();
  }

  /**
   * Draws initial background with audio track gradient and center guides.
   * @private
   */
  drawBackground_() {
    const gradient = this.canvasContext_.createLinearGradient(
      0,
      0,
      0,
      this.height_
    );
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(0.5, '#1e293b');
    gradient.addColorStop(1, '#0f172a');

    this.canvasContext_.fillStyle = gradient;
    this.canvasContext_.fillRect(0, 0, this.width_, this.height_);

    const centerY = this.height_ / 2;
    this.canvasContext_.strokeStyle = '#334155';
    this.canvasContext_.lineWidth = 1;
    this.canvasContext_.lineDashOffset = 0;
    this.canvasContext_.setLineDash([2, 2]);
    this.canvasContext_.beginPath();
    this.canvasContext_.moveTo(0, centerY);
    this.canvasContext_.lineTo(this.width_, centerY);
    this.canvasContext_.stroke();
    this.canvasContext_.setLineDash([]);

    this.drawAmplitudeLines_();
  }

  /**
   * Draws dashed amplitude reference lines across the canvas.
   * @private
   */
  drawAmplitudeLines_() {
    const centerY = this.height_ / 2;
    const quarterHeight = this.height_ / 4;

    this.canvasContext_.strokeStyle = '#1e293b';
    this.canvasContext_.lineWidth = 0.5;
    this.canvasContext_.lineDashOffset = 0;
    this.canvasContext_.setLineDash([1, 3]);

    [
      quarterHeight,
      centerY - quarterHeight,
      centerY + quarterHeight,
      this.height_ - quarterHeight,
    ].forEach((y) => {
      if (y !== centerY) {
        this.canvasContext_.beginPath();
        this.canvasContext_.moveTo(0, y);
        this.canvasContext_.lineTo(this.width_, y);
        this.canvasContext_.stroke();
      }
    });

    this.canvasContext_.setLineDash([]);
  }

  /**
   * Converts linear amplitude to logarithmic decibels.
   * @private
   * @param {number} amplitude
   * @return {number}
   */
  amplitudeToDb_(amplitude) {
    if (amplitude <= 0) return this.minDb_;
    return Math.max(this.minDb_, 20 * Math.log10(Math.abs(amplitude)));
  }

  /**
   * Computes smoothed RMS amplitude from time-domain samples.
   * @private
   * @return {number}
   */
  getSmoothedAmplitude_() {
    if (!this.analyser_ || !this.dataArray_) return 0;

    this.analyser_.getFloatTimeDomainData(this.dataArray_);

    let sum = 0;
    for (let i = 0; i < this.dataArray_.length; ++i) {
      sum += this.dataArray_[i] * this.dataArray_[i];
    }
    const rms = Math.sqrt(sum / this.dataArray_.length);

    this.sampleBuffer_.push(rms);
    if (this.sampleBuffer_.length > this.bufferSize_) {
      this.sampleBuffer_.shift();
    }

    return (
      this.sampleBuffer_.reduce((a, b) => a + b, 0) /
      this.sampleBuffer_.length
    );
  }

  /**
   * Renders the waveform bar and scrolls horizontally.
   */
  draw() {
    const amplitude = this.getSmoothedAmplitude_();
    const db = this.amplitudeToDb_(amplitude);

    const centerY = this.height_ / 2;
    const normalizedDb = Math.max(
      0,
      (db - this.minDb_) / (this.maxDb_ - this.minDb_)
    );
    const amplitudeHeight =
      (this.height_ / 2) * normalizedDb * this.amplitudeScale_;

    const barHeight =
      amplitudeHeight > 0.5 ? Math.max(2, Math.round(amplitudeHeight * 2)) : 0;
    const barTop = Math.round(centerY - barHeight / 2);

    let fillColor;
    if (db > -6) {
      fillColor = '#ef4444'; // Red for near-clipping levels
    } else if (db > -12) {
      fillColor = '#f59e0b'; // Amber for medium-high levels
    } else if (db > -24) {
      fillColor = '#10b981'; // Emerald for nominal levels
    } else {
      fillColor = '#38bdf8'; // Sky blue for low levels
    }

    if (this.currentX_ < this.width_ - this.barWidth_) {
      this.redrawBackgroundSection_(this.currentX_);

      if (barHeight > 0) {
        this.canvasContext_.fillStyle = fillColor;
        this.canvasContext_.fillRect(
          this.currentX_,
          barTop,
          this.barWidth_,
          barHeight
        );
      }

      this.currentX_ += this.scrollStep_;
    } else {
      // Scroll canvas content left
      this.canvasContext_.drawImage(
        this.canvas_,
        this.scrollStep_,
        0,
        this.width_ - this.scrollStep_,
        this.height_,
        0,
        0,
        this.width_ - this.scrollStep_,
        this.height_
      );

      const clearX = this.width_ - this.scrollStep_;
      this.redrawBackgroundSection_(clearX);

      if (barHeight > 0) {
        this.canvasContext_.fillStyle = fillColor;
        this.canvasContext_.fillRect(
          clearX,
          barTop,
          this.barWidth_,
          barHeight
        );
      }

      this.currentX_ = clearX;
    }
  }

  /**
   * Redraws background slice for the specified horizontal section.
   * @private
   * @param {number} x
   */
  redrawBackgroundSection_(x) {
    const gradient = this.canvasContext_.createLinearGradient(
      0,
      0,
      0,
      this.height_
    );
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(0.5, '#1e293b');
    gradient.addColorStop(1, '#0f172a');

    this.canvasContext_.fillStyle = gradient;
    this.canvasContext_.fillRect(x, 0, this.scrollStep_, this.height_);

    const centerY = this.height_ / 2;
    this.canvasContext_.strokeStyle = '#334155';
    this.canvasContext_.lineWidth = 1;
    this.canvasContext_.lineDashOffset = -x;
    this.canvasContext_.setLineDash([2, 2]);
    this.canvasContext_.beginPath();
    this.canvasContext_.moveTo(x, centerY);
    this.canvasContext_.lineTo(x + this.scrollStep_, centerY);
    this.canvasContext_.stroke();
    this.canvasContext_.lineDashOffset = 0;
    this.canvasContext_.setLineDash([]);

    const quarterHeight = this.height_ / 4;
    this.canvasContext_.strokeStyle = '#1e293b';
    this.canvasContext_.lineWidth = 0.5;
    this.canvasContext_.lineDashOffset = -x;
    this.canvasContext_.setLineDash([1, 3]);

    [
      quarterHeight,
      centerY - quarterHeight,
      centerY + quarterHeight,
      this.height_ - quarterHeight,
    ].forEach((y) => {
      if (y !== centerY) {
        this.canvasContext_.beginPath();
        this.canvasContext_.moveTo(x, y);
        this.canvasContext_.lineTo(x + this.scrollStep_, y);
        this.canvasContext_.stroke();
      }
    });

    this.canvasContext_.lineDashOffset = 0;
    this.canvasContext_.setLineDash([]);
  }
}

export default Waveform;
