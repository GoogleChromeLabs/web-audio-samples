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
  }
  
  /**
   * Render the waveform on the canvas. This function is called
   * periodically to update the waveform display. This class doesn't
   * have a timer or a render loop; it requires an external driver for
   * the actual rendering.
   */
  draw() {
    this.canvasContext_.fillStyle = 'red';
    this.canvasContext_.fillRect(0, 0, 1, 1);

    this.canvasContext_.clearRect(this.currentX_, 0, 1, this.height_);

    this.analyser_.getFloatTimeDomainData(this.dataArray_);
    const average = this.dataArray_.reduce((a, b) => a + b) / this.dataArray_.length;

    const currentY = (average + 1) * (this.height_ / 2);

    this.canvasContext_.fillStyle = 'red';
    this.canvasContext_.fillRect(this.currentX_ + 2, 0, 1, this.height_);

    this.canvasContext_.beginPath();
    this.canvasContext_.moveTo(this.currentX_, this.previousY_);
    this.canvasContext_.lineTo(this.currentX_ + 2, currentY);
    this.canvasContext_.strokeStyle = 'black';
    this.canvasContext_.lineWidth = 0.8;
    this.canvasContext_.stroke();

    this.previousY_ = currentY;

    if (this.currentX_ < this.width_ - 2) {
      this.currentX_ += 2;
    } else {
      this.canvasContext_.globalCompositeOperation = 'copy';
      this.canvasContext_.drawImage(this.canvas_, -2, 0);
      this.canvasContext_.globalCompositeOperation = 'source-over';
    }
  }
}

export default Waveform;
