/**
 * @classdesc This Waveform class implements a waveform UI. To
 * initialize it, you need to provide the ID of the canvas element
 * where the waveform will be rendered and the fftSize value for the
 * analyserNode. The fftSize value defines the window size in samples
 * used when performing a Fast Fourier Transform (FFT) to obtain
 * frequency domain data in the AnalyserNode. When the waveform is
 * created, it requires an AnalyserNode for real-time audio input
 * data. This class only requires a canvas element, and there are no
 * additional dependencies.
 */
class Waveform {
  /**
   * @constructor
   * visuals. The width and height of the waveform canvas are
   * initialized in the constructor and cannot be changed after
   * initialization.
   * @param {String} canvasId A canvas element ID where the
   * visualization is drawn to.
   * @param {AnalyserNode} analyserNode The AnalyserNode used for
   * visualization.
   * @param {Number} fftSize The window size in samples used for Fast
   * Fourier Transform (FFT) to obtain frequency domain data in the
   * AnalyserNode.
   */
  constructor(canvasId, analyserNode, fftSize) {
    /** @private @const {!canvas} Selected waveform canvas element */
    this.canvas_ = document.querySelector(canvasId);
    /** @private @const {!canvasContext} Canvas context */
    this.canvasContext_ = this.canvas_.getContext('2d');
        
    // Set canvas dimensions - use full available size or fallback to reasonable defaults
    const rect = this.canvas_.getBoundingClientRect();
    this.canvas_.width = rect.width > 0 ? rect.width : (this.canvas_.offsetWidth || 800);
    this.canvas_.height = rect.height > 0 ? rect.height : (this.canvas_.offsetHeight || 400);
    
    // Ensure minimum dimensions
    if (this.canvas_.width < 400) this.canvas_.width = 800;
    if (this.canvas_.height < 200) this.canvas_.height = 400;
        
    /** @private @const {!width} Selected waveform canvas width */
    this.width_ = this.canvas_.width;
    /** @private @const {!height} Selected waveform canvas height */
    this.height_ = this.canvas_.height;
    /** @private {!currentX} Current X axis in the waveform */
    this.currentX_ = 0;
    /** @private {!previousY} Previous Y axis in the waveform */
    this.previousY_ = this.height_ / 2;
    /** @private @const {!analyser} AnalyserNode that will be used for
     * visualization */
    this.analyser_ = analyserNode;
    this.analyser_.fftSize = fftSize;
    /** @private @const {!dataArray} The array that the time domain
     * data will be copied to */
    this.dataArray_ = new Float32Array(this.analyser_.frequencyBinCount);
        
    // Initialize canvas with background grid
    this.drawBackground_();
  }

  /**
   * Draw the background grid pattern
   * @private
   */
  drawBackground_() {
    // Fill with white background
    this.canvasContext_.fillStyle = 'white';
    this.canvasContext_.fillRect(0, 0, this.width_, this.height_);
    
    // Grid configuration
    const gridSpacing = 20; // Space between grid lines
    const majorGridSpacing = 100; // Space between major grid lines
    
    // Draw minor grid lines
    this.canvasContext_.strokeStyle = '#f0f0f0';
    this.canvasContext_.lineWidth = 0.5;
    this.canvasContext_.beginPath();
    
    // Vertical minor grid lines
    for (let x = gridSpacing; x < this.width_; x += gridSpacing) {
      this.canvasContext_.moveTo(x, 0);
      this.canvasContext_.lineTo(x, this.height_);
    }
    
    // Horizontal minor grid lines
    for (let y = gridSpacing; y < this.height_; y += gridSpacing) {
      this.canvasContext_.moveTo(0, y);
      this.canvasContext_.lineTo(this.width_, y);
    }
    
    this.canvasContext_.stroke();
    
    // Draw major grid lines
    this.canvasContext_.strokeStyle = '#e0e0e0';
    this.canvasContext_.lineWidth = 1;
    this.canvasContext_.beginPath();
    
    // Vertical major grid lines
    for (let x = majorGridSpacing; x < this.width_; x += majorGridSpacing) {
      this.canvasContext_.moveTo(x, 0);
      this.canvasContext_.lineTo(x, this.height_);
    }
    
    // Horizontal major grid lines
    for (let y = majorGridSpacing; y < this.height_; y += majorGridSpacing) {
      this.canvasContext_.moveTo(0, y);
      this.canvasContext_.lineTo(this.width_, y);
    }
    
    this.canvasContext_.stroke();
    
    // Draw center line (zero amplitude reference)
    this.canvasContext_.strokeStyle = '#d0d0d0';
    this.canvasContext_.lineWidth = 1.5;
    this.canvasContext_.beginPath();
    this.canvasContext_.moveTo(0, this.height_ / 2);
    this.canvasContext_.lineTo(this.width_, this.height_ / 2);
    this.canvasContext_.stroke();
  }

  /**
   * Render the waveform on the canvas. This function is called
   * periodically to update the waveform display. This class doesn't
   * have a timer or a render loop; it requires an external driver for
   * the actual rendering.
   */
  draw() {
    // Get the time domain data
    this.analyser_.getFloatTimeDomainData(this.dataArray_);
    
    // Calculate the average amplitude
    const average = this.dataArray_.reduce((a, b) => a + b) / this.dataArray_.length;
    const currentY = (average + 1) * (this.height_ / 2);
    
    // Draw the waveform line
    this.canvasContext_.beginPath();
    this.canvasContext_.moveTo(this.currentX_, this.previousY_);
    this.canvasContext_.lineTo(this.currentX_ + 1, currentY);
    this.canvasContext_.strokeStyle = '#2196F3'; // Material Design blue
    this.canvasContext_.lineWidth = 2;
    this.canvasContext_.stroke();
    
    this.previousY_ = currentY;
    
    // Handle scrolling
    if (this.currentX_ >= this.width_) {
      // Scroll the canvas
      this.canvasContext_.globalCompositeOperation = 'copy';
      this.canvasContext_.drawImage(this.canvas_, -1, 0);
      this.canvasContext_.globalCompositeOperation = 'source-over';
      
      // Redraw the rightmost column background to maintain grid appearance
      this.canvasContext_.fillStyle = 'white';
      this.canvasContext_.fillRect(this.width_ - 1, 0, 1, this.height_);
      
      // Redraw grid lines for the rightmost column
      const gridSpacing = 20;
      const majorGridSpacing = 100;
      const x = this.width_ - 1;
      
      // Check if this column needs grid lines
      if ((this.width_ - 1) % gridSpacing === 0) {
        this.canvasContext_.strokeStyle = (this.width_ - 1) % majorGridSpacing === 0 ? '#e0e0e0' : '#f0f0f0';
        this.canvasContext_.lineWidth = (this.width_ - 1) % majorGridSpacing === 0 ? 1 : 0.5;
        this.canvasContext_.beginPath();
        this.canvasContext_.moveTo(x, 0);
        this.canvasContext_.lineTo(x, this.height_);
        this.canvasContext_.stroke();
      }
      
      // Redraw center line for the rightmost column
      this.canvasContext_.strokeStyle = '#d0d0d0';
      this.canvasContext_.lineWidth = 1.5;
      this.canvasContext_.beginPath();
      this.canvasContext_.moveTo(x, this.height_ / 2);
      this.canvasContext_.lineTo(x + 1, this.height_ / 2);
      this.canvasContext_.stroke();
      
      // Ensure waveform line continues smoothly
      this.canvasContext_.beginPath();
      this.canvasContext_.moveTo(x, this.previousY_);
      this.canvasContext_.lineTo(x + 1, currentY);
      this.canvasContext_.strokeStyle = '#2196F3';
      this.canvasContext_.lineWidth = 2;
      this.canvasContext_.stroke();
      
      this.currentX_ = this.width_ - 1;
    } else {
      this.currentX_++;
    }
  }
}

export default Waveform;