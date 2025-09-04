/**
 * @classdesc This Waveform class implements a waveform UI that mimics
 * professional audio editing software with stereo track visualization.
 * Features logarithmic dB view, amplitude-based rendering, and smooth
 * waveform display similar to audio editing applications.
 */
class Waveform {
  /**
   * @constructor
   * @param {String} canvasId A canvas element ID where the
   * visualization is drawn to.
   * @param {AnalyserNode} analyserNode The AnalyserNode used for
   * visualization.
   * @param {Number} fftSize The window size in samples used for Fast
   * Fourier Transform (FFT) to obtain frequency domain data.
   */
  constructor(canvasId, analyserNode, fftSize) {
    /** @private @const {!canvas} Selected waveform canvas element */
    this.canvas_ = document.querySelector(canvasId);
    /** @private @const {!canvasContext} Canvas context */
    this.canvasContext_ = this.canvas_.getContext('2d');
        
    // Set canvas dimensions
    const rect = this.canvas_.getBoundingClientRect();
    this.canvas_.width = rect.width > 0 ? rect.width : (this.canvas_.offsetWidth || 800);
    this.canvas_.height = rect.height > 0 ? rect.height : (this.canvas_.offsetHeight || 200);
    
    // Ensure reasonable dimensions
    if (this.canvas_.width < 400) this.canvas_.width = 400;
    if (this.canvas_.height < 100) this.canvas_.height = 100;
        
    /** @private @const {!width} Canvas width */
    this.width_ = this.canvas_.width;
    /** @private @const {!height} Canvas height */
    this.height_ = this.canvas_.height;
    
    /** @private {!number} Width of each waveform sample column */
    this.barWidth_ = 1; // Thin bars for smooth appearance
    /** @private {!number} Horizontal scroll step */
    this.scrollStep_ = this.barWidth_;
    /** @private {!number} Current X position */
    this.currentX_ = 0;
    
    /** @private {!number} Amplitude scale for logarithmic display */
    this.amplitudeScale_ = 0.5; // Scale factor for dB conversion - reduced for shorter waves
    /** @private {!number} Minimum dB threshold */
    this.minDb_ = -60; // Minimum dB level to display
    /** @private {!number} Maximum dB reference */
    this.maxDb_ = 0; // Maximum dB level (0 dB)
    
    /** @private @const {!analyser} AnalyserNode for visualization */
    this.analyser_ = analyserNode;
    this.analyser_.fftSize = fftSize;
    this.analyser_.smoothingTimeConstant = 0.3; // Smooth out rapid changes
    
    /** @private @const {!dataArray} Time domain data array */
    this.dataArray_ = new Float32Array(this.analyser_.frequencyBinCount);
    
    /** @private {!Array} Buffer to store recent samples for smoother display */
    this.sampleBuffer_ = [];
    this.bufferSize_ = 5; // Average over 5 samples
    
    // Initialize canvas
    this.drawBackground_();
  }

  /**
   * Draw the background with audio track styling
   * @private
   */
  drawBackground_() {
    // Create gradient background similar to audio software
    const gradient = this.canvasContext_.createLinearGradient(0, 0, 0, this.height_);
    gradient.addColorStop(0, '#f8f9fc');
    gradient.addColorStop(0.5, '#e8ebf0');
    gradient.addColorStop(1, '#f8f9fc');
    
    this.canvasContext_.fillStyle = gradient;
    this.canvasContext_.fillRect(0, 0, this.width_, this.height_);
    
    // Draw center line (zero amplitude)
    const centerY = this.height_ / 2;
    this.canvasContext_.strokeStyle = '#d0d4db';
    this.canvasContext_.lineWidth = 1;
    this.canvasContext_.setLineDash([2, 2]);
    this.canvasContext_.beginPath();
    this.canvasContext_.moveTo(0, centerY);
    this.canvasContext_.lineTo(this.width_, centerY);
    this.canvasContext_.stroke();
    this.canvasContext_.setLineDash([]); // Reset line dash
    
    // Draw amplitude reference lines
    this.drawAmplitudeLines_();
  }

  /**
   * Draw amplitude reference lines
   * @private
   */
  drawAmplitudeLines_() {
    const centerY = this.height_ / 2;
    const quarterHeight = this.height_ / 4;
    
    this.canvasContext_.strokeStyle = '#e2e5ea';
    this.canvasContext_.lineWidth = 0.5;
    this.canvasContext_.setLineDash([1, 3]);
    
    // Draw reference lines at 25%, 50%, 75% amplitude
    [quarterHeight, centerY - quarterHeight, centerY + quarterHeight, this.height_ - quarterHeight].forEach(y => {
      if (y !== centerY) { // Don't redraw center line
        this.canvasContext_.beginPath();
        this.canvasContext_.moveTo(0, y);
        this.canvasContext_.lineTo(this.width_, y);
        this.canvasContext_.stroke();
      }
    });
    
    this.canvasContext_.setLineDash([]);
  }

  /**
   * Convert amplitude to logarithmic dB scale
   * @private
   * @param {number} amplitude Linear amplitude value
   * @return {number} dB value
   */
  amplitudeToDb_(amplitude) {
    if (amplitude <= 0) return this.minDb_;
    return Math.max(this.minDb_, 20 * Math.log10(Math.abs(amplitude)));
  }

  /**
   * Convert dB to canvas Y coordinate
   * @private
   * @param {number} db dB value
   * @return {number} Y coordinate
   */
  dbToY_(db) {
    const normalizedDb = (db - this.minDb_) / (this.maxDb_ - this.minDb_);
    return this.height_ * (1 - normalizedDb * this.amplitudeScale_);
  }

  /**
   * Get smoothed amplitude from recent samples
   * @private
   * @return {number} Smoothed amplitude
   */
  getSmoothedAmplitude_() {
    this.analyser_.getFloatTimeDomainData(this.dataArray_);
    
    // Calculate RMS (Root Mean Square) for more stable amplitude
    let sum = 0;
    for (let i = 0; i < this.dataArray_.length; i++) {
      sum += this.dataArray_[i] * this.dataArray_[i];
    }
    const rms = Math.sqrt(sum / this.dataArray_.length);
    
    // Add to buffer and maintain size
    this.sampleBuffer_.push(rms);
    if (this.sampleBuffer_.length > this.bufferSize_) {
      this.sampleBuffer_.shift();
    }
    
    // Return averaged amplitude
    const avgAmplitude = this.sampleBuffer_.reduce((a, b) => a + b, 0) / this.sampleBuffer_.length;
    return avgAmplitude;
  }

  /**
   * Set amplitude scale
   * @param {number} scale Scale factor (0.1 to 2.0 recommended)
   */
  setAmplitudeScale(scale) {
    this.amplitudeScale_ = Math.max(0.1, Math.min(2.0, scale));
  }

  /**
   * Render the waveform with audio track styling
   */
  draw() {
    const amplitude = this.getSmoothedAmplitude_();
    const db = this.amplitudeToDb_(amplitude);
    
    const centerY = this.height_ / 2;
    const amplitudeHeight = Math.abs(centerY - this.dbToY_(db));
    
    // Create waveform bar extending from center
    const topY = Math.max(0, centerY - amplitudeHeight);
    const bottomY = Math.min(this.height_, centerY + amplitudeHeight);
    const barHeight = bottomY - topY;
    
    // Color based on amplitude level (like professional audio software)
    let fillColor;
    if (db > -6) {
      fillColor = '#ff4444'; // Red for high levels
    } else if (db > -12) {
      fillColor = '#ffaa00'; // Orange for medium-high levels
    } else if (db > -24) {
      fillColor = '#4488ff'; // Blue for normal levels
    } else {
      fillColor = '#6699dd'; // Light blue for low levels
    }
    
    // Draw the waveform bar
    this.canvasContext_.fillStyle = fillColor;
    this.canvasContext_.fillRect(this.currentX_, topY, this.barWidth_, barHeight);
    
    // Add subtle shadow for depth
    this.canvasContext_.fillStyle = 'rgba(0,0,0,0.1)';
    this.canvasContext_.fillRect(this.currentX_ + 1, topY + 1, this.barWidth_, barHeight);
    
    // Handle scrolling when reaching edge
    if (this.currentX_ >= this.width_) {
      // Scroll the canvas left
      this.canvasContext_.globalCompositeOperation = 'copy';
      this.canvasContext_.drawImage(this.canvas_, -this.scrollStep_, 0);
      this.canvasContext_.globalCompositeOperation = 'source-over';
      
      // Clear and redraw the rightmost area
      const clearX = this.width_ - this.scrollStep_;
      this.canvasContext_.fillStyle = '#f8f9fc';
      this.canvasContext_.fillRect(clearX, 0, this.scrollStep_, this.height_);
      
      // Redraw background elements in cleared area
      this.redrawBackgroundSection_(clearX);
      
      // Draw new waveform data in cleared area
      this.canvasContext_.fillStyle = fillColor;
      this.canvasContext_.fillRect(clearX, topY, this.barWidth_, barHeight);
      this.canvasContext_.fillStyle = 'rgba(0,0,0,0.1)';
      this.canvasContext_.fillRect(clearX + 1, topY + 1, this.barWidth_, barHeight);
      
      this.currentX_ = clearX;
    } else {
      this.currentX_ += this.scrollStep_;
    }
  }

  /**
   * Redraw background elements for a specific section
   * @private
   * @param {number} x X coordinate of section to redraw
   */
  redrawBackgroundSection_(x) {
    const centerY = this.height_ / 2;
    
    // Redraw center line
    this.canvasContext_.strokeStyle = '#d0d4db';
    this.canvasContext_.lineWidth = 1;
    this.canvasContext_.setLineDash([2, 2]);
    this.canvasContext_.beginPath();
    this.canvasContext_.moveTo(x, centerY);
    this.canvasContext_.lineTo(x + this.scrollStep_, centerY);
    this.canvasContext_.stroke();
    this.canvasContext_.setLineDash([]);
    
    // Redraw amplitude reference lines
    const quarterHeight = this.height_ / 4;
    this.canvasContext_.strokeStyle = '#e2e5ea';
    this.canvasContext_.lineWidth = 0.5;
    this.canvasContext_.setLineDash([1, 3]);
    
    [quarterHeight, centerY - quarterHeight, centerY + quarterHeight, this.height_ - quarterHeight].forEach(y => {
      if (y !== centerY) {
        this.canvasContext_.beginPath();
        this.canvasContext_.moveTo(x, y);
        this.canvasContext_.lineTo(x + this.scrollStep_, y);
        this.canvasContext_.stroke();
      }
    });
    
    this.canvasContext_.setLineDash([]);
  }
}

export default Waveform;