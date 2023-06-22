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
   */
  constructor(canvasId) {
    this.canvas = document.querySelector(canvasId);
    this.canvasContext = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.currentX = 0;
    this.previousY = this.height / 2;
  }

  /**
   * This is the create function for creating waveform
   * @param {AnalyserNode} analyserNode The analysis node
   *     which connect with the audio context.
   */
  create(analyserNode) {
    analyserNode.fftSize = 32;
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    this.canvasContext.fillStyle = 'red';
    this.canvasContext.fillRect(0, 0, 1, 1);

    this.canvasContext.clearRect(this.currentX, 0, 1, this.height);

    analyserNode.getByteTimeDomainData(dataArray);
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

    const currentY = average / 128.0 * (this.height / 2);

    this.canvasContext.fillStyle = 'red';
    this.canvasContext.fillRect(this.currentX + 2, 0, 1, this.height);

    this.canvasContext.beginPath();
    this.canvasContext.moveTo(this.currentX, this.previousY);
    this.canvasContext.lineTo(this.currentX + 2, currentY);
    this.canvasContext.strokeStyle = 'black';
    this.canvasContext.lineWidth = 0.8;
    this.canvasContext.stroke();

    this.previousY = currentY;

    if (this.currentX < this.width - 2) {
        this.currentX += 2;
    } else {
        this.canvasContext.globalCompositeOperation = 'copy';
        this.canvasContext.drawImage(this.canvas, -2, 0);
        this.canvasContext.globalCompositeOperation = 'source-over';
    }
  }
}

export default Waveform;
