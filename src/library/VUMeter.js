import FIFO from './FIFO.js';

/**
 * @classdesc This VUMeter class implements a volume level meter UI.
 * To initialize it, developers need to provide the ID of the canvas
 * element where the VUMeter will be rendered, the minimum decibel
 * value for the VUMeter, an AnalyserNode, fftSize of the
 * analyserNode, and fifoSize to control the VMMeter update speed. The
 * minimum decibel value defines the range of the VUMeter that will be
 * considered silent. When the VUMeter is created, it requires an
 * AnalyserNode for real-time audio input data. This class requires a
 * canvas element and FIFO class. The FIFO class is used to determine
 * how fast the VUMeter gets updated. The height of the VUMeter is
 * determined by the minimum number in the FIFO class.
 */
class VUMeter {

  /**
   * @constructor
   * ID, minimum decibel value, analyserNode, fftSize, and fifoSize.
   * @param {String} canvasId A canvas element ID where the
   * visualization is drawn to.
   * @param {Number} minDecibel The minimum lower bound decibel of the
   * visualization. If the measured volume is lower than this value,
   * it is considered silent.
   * @param {AnalyserNode} analyserNode The AnalyserNode used for the
   * visualization.
   * @param {Number} fftSize The window size in samples used for
   * performing a Fast Fourier Transform (FFT) to obtain frequency
   * domain data in the AnalyserNode.
   * @param {Number} fifoSize The size of the FIFO queue which
   * determines how fast the VUMeter gets updated.
   */
  constructor(canvasId, minDecibel, analyserNode, fftSize, fifoSize) {
    /** @private @const {!canvas} Selected VUMeter canvas element */
    this.canvas_ = document.querySelector(canvasId);
    /** @private @const {!canvasContext} Canvas context */
    this.canvasContext_ = this.canvas_.getContext('2d');
    /** @private @const {!width} Selected VUMeter canvas width */
    this.width_ = this.canvas_.width;
    /** @private @const {!height} Selected VUMeter canvas height */
    this.height_ = this.canvas_.height;
    /** @private @const {!minDisplayDecibel} Minimum decibel level for
     * the VU meter. Any decibel lower than this value is considered
     * silent and converted to a positive value for calculation and
     * graph convenience. */
    this.minDisplayDecibel_ = Math.abs(minDecibel);
    /** @private @const {!fifo} An instance of FIFO class for caching
     * RMS values and extracting a minimum value over time. */
    this.fifo_ = new FIFO(fifoSize);
    /** @private @const {!analyser} AnalyserNode that will be used for
     * visualization */
    this.analyser_ = analyserNode;
    this.analyser_.fftSize = fftSize;
    /** @private @const {!dataArray} Array to store the frequency data
     * obtained from the AnalyserNode. */
    this.dataArray_ = new Float32Array(this.analyser_.frequencyBinCount);
  }

  /**
   * Render the VU meter on the canvas. This function is called
   * periodically to update the meter display. This class doesn't have
   * a timer or a render loop; it requires an external driver for the
   * actual rendering.
   */
  draw() {
    this.analyser_.getFloatTimeDomainData(this.dataArray_);

    const rootMeanSquare = this.calculateRMS(this.dataArray_);
    const decibel = 20 * Math.log10(rootMeanSquare);
    let absDecibel = Math.abs(decibel);
    this.fifo_.push(absDecibel);
    let minDecibel = this.fifo_.getMinValue();
    let meterHeight = minDecibel > this.minDisplayDecibel_ ?
        this.height_ : minDecibel / this.minDisplayDecibel_ * this.height_;

    this.canvasContext_.clearRect(0, 0, this.width_, this.height_);

    this.canvasContext_.fillStyle = '#000';
    this.canvasContext_.fillRect(0, 0, this.width_, this.height_);
    this.canvasContext_.fillStyle = 'green';
    this.canvasContext_.fillRect(0, meterHeight, this.width_, this.height_ - meterHeight);

    this.canvasContext_.strokeStyle = 'black';
    this.canvasContext_.lineWidth = 1;
    this.canvasContext_.globalAlpha = 0.3;
    this.canvasContext_.beginPath();
    this.canvasContext_.moveTo(0, this.height_ * 0.2);
    this.canvasContext_.lineTo(this.width_, this.height_ * 0.2);
    this.canvasContext_.moveTo(0, this.height_ * 0.4);
    this.canvasContext_.lineTo(this.width_, this.height_ * 0.4);
    this.canvasContext_.moveTo(0, this.height_ * 0.6);
    this.canvasContext_.lineTo(this.width_, this.height_ * 0.6);
    this.canvasContext_.moveTo(0, this.height_ * 0.8);
    this.canvasContext_.lineTo(this.width_, this.height_ * 0.8);
    this.canvasContext_.stroke();
  }

  /**
   * Calculate the root mean square (RMS) value from the inputArray.
   * @param {Array} inputArray The array from which to calculate the
   * RMS value.
   * @returns {Number} The root mean square of the array.
   */
  calculateRMS(inputArray) {
    let sumOfSquares = 0;
    for (let i = 0; i < inputArray.length; i++) {
      sumOfSquares += inputArray[i] * inputArray[i];
    }
    let meanSquare = sumOfSquares / inputArray.length;
    return Math.sqrt(meanSquare);
  }
}

export default VUMeter;
