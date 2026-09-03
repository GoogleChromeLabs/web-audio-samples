/** Calculates the mean value of an Array-like data structure.
 *
 * @param {Uint8Array} array
 * @return {number}
 */
function mean(array) {
  let sum = 0;
  for (const entry of array) {
    sum += entry;
  }
  return sum / array.length;
}

/** Approximates the loudness of an audio sample.
 *
 * @param {Uint8Array} dataArray
 * @return {number} normalized to [0, 1]
 */
function calculateLoudness(dataArray) {
  return mean(dataArray) / 255;
}

/** Visualize the loudness through the size of a translucent outline. */
class OutlineLoudnessIndicator {
  /**
   * @param {HTMLElement} element
   */
  constructor(element) {
    this.element = element;
    this.radius = 20;
  }

  /**
   * Shows the loudness outline, until show() or stop() is called.
   *
   * @param {number} loudness in the range [0, 1].
   */
  show(loudness) {
    const radius = loudness * this.radius;
    this.element.style.boxShadow = `0 0 0 ${radius}px rgba(0, 0, 0, 0.2)`;
  }

  /** Hides the loudness outline. */
  hide() {
    this.element.style.boxShadow = 'none';
  }
}

/** Visualize the loudness with a waveform. */
class WaveformIndicator {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    // Horizontal position in the canvas for drawing the waveform.
    this.x = 0;
  }

  /** Draws a horizontal, dashed line in the center of the canvas. */
  drawCenterLine() {
    this.context.fillStyle = '#263238';
    this.context.setLineDash([2, 5]);
    this.context.beginPath();
    this.context.moveTo(0, this.canvas.height / 2);
    this.context.lineTo(this.canvas.width, this.canvas.height / 2);
    this.context.stroke();
  }

  /**
   * Shows the loudness outline by appending a vertical line to the right.
   *
   * @param {number} loudness in the range [0, 1].
   */
  show(loudness) {
    // Append a vertical line on the right of the waveform, that indicates the
    // loudness.
    this.context.fillRect(
        this.x,
        ((1 - loudness) * this.canvas.height) / 2,
        1,
        loudness * this.canvas.height,
    );

    if (this.x < this.canvas.width - 1) {
      this.x++;
    } else {
      // If the waveform fills the canvas, move it by one pixel to the left to
      // make room.
      this.context.globalCompositeOperation = 'copy';
      this.context.drawImage(this.canvas, -1, 0);
      this.context.globalCompositeOperation = 'source-over';
    }
  }
}

export {calculateLoudness, OutlineLoudnessIndicator, WaveformIndicator};
