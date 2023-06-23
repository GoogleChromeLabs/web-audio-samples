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
   * This is the constructor for initializing waveform
   * @param {String} canvasId  An ID of a canvas element where
   *     the waveform will be rendered.
   * @param {AnalyserNode} analyserNode The analysis node
   *    which connect with the audio context.
   */
  constructor(canvasId, analyserNode) {
    this.canvas_ = document.querySelector(canvasId);
    this.canvasContext_ = this.canvas_.getContext('2d');
    this.width_ = this.canvas_.width;
    this.height_ = this.canvas_.height;
    this.currentX_ = 0;
    this.previousY_ = this.height_ / 2;
    this.analyser_ = analyserNode;
    // This is the minimum fftSize which we are able to have. By
    // using size 32, we can collect the most accurate data.
    this.analyser_.fftSize = 32;
    this.bufferLength_ = this.analyser_.frequencyBinCount;
  }

  /**
   * This is the initialize function for creating waveform.
   */
  draw() {
    const dataArray = new Uint8Array(this.bufferLength_);

    this.canvasContext_.fillStyle = 'red';
    this.canvasContext_.fillRect(0, 0, 1, 1);

    this.canvasContext_.clearRect(this.currentX_, 0, 1, this.height_);

    this.analyser_.getByteTimeDomainData(dataArray);
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

    const currentY = average / 128.0 * (this.height_ / 2);

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
