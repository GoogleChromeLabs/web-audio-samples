/**
 * This is the library for creating the waveform. 
 * It requires the ID of canvas element where the waveform
 * will be rendered as initialization input. When the waveform
 * is created, it requires the analyserNode as real-time audio 
 * input data for drawing the correct waveform.
 * 
 * There is no library dependence, this entire waveform is
 * created based on the canvas element.
 */

class Waveform {

  /**
   * @constructor This is the constructor for initializing waveform
   * Since width and height is initialized in contructor, the
   * waveform's width and height can not be changed after initialization.
   * @param {String} canvasId  An ID of a canvas element where
   *     the waveform will be rendered.
   * @param {AnalyserNode} analyserNode The analysis node
   *    which connect with the audio context.
   * @param {Number} fftSize The window size in samples that is used 
   *    when performing a Fast Fourier Transform (FFT) to get frequency
   *    domain data in the AnalyserNode.
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
    /** @private @const {!currentX} Current X axis in waveform */
    this.currentX_ = 0;
    /** @private @const {!previousY} Previous Y axis in waveform */
    this.previousY_ = this.height_ / 2;
    /** @private @const {!analyser} AnalyserNode of audio context */
    this.analyser_ = analyserNode;
    this.analyser_.fftSize = fftSize;
    /** @private @const {!bufferLength} Total number of data 
     *     points avliable to AudioContext sampleRate. */
    this.bufferLength_ = this.analyser_.frequencyBinCount;
    /** @private @const {!dataArray} AnalyserNode of audio context */
    this.dataArray_ = new Float32Array(this.bufferLength_);
  }

  /**
   * This is the draw function for creating waveform.
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
