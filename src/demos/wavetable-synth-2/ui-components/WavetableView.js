export class WavetableView extends HTMLElement {
  constructor() {
    super();
    // Create Shadow DOM for encapsulation
    this.attachShadow({mode: 'open'});

    // Create canvas element
    /** @private {HTMLCanvasElement} */
    this._canvas = document.createElement('canvas');
    /** @private {CanvasRenderingContext2D} */
    this._ctx = this._canvas.getContext('2d');

    // Create style element for the shadow DOM
    const style = document.createElement('style');
    // Use CSS variables for configurable dimensions via attributes
    style.textContent = `
      :host {
        display: inline-block; /* Allow setting width/height */
        width: var(--wavetable-width, 300px); /* Default width */
        height: var(--wavetable-height, 150px); /* Default height */
        border: 1px solid #ccc; /* Example border */
        overflow: hidden; /* Clip content */
      }
      canvas {
        display: block; /* Remove extra space below canvas */
        width: 100%;
        height: 100%;
        background-color: #f0f0f0; /* Default background */
      }
    `;

    // Append elements to shadow root
    this.shadowRoot.append(style, this._canvas);

    // Initialize data
    /** @private {?Float32Array} */
    this._pcmData = null;
    /** @private {string} */
    this._lineColor = '#007bff'; // Default line color
  }

  // Observe attribute changes for width, height, and colors
  static get observedAttributes() {
    return ['width', 'height', 'backgroundcolor', 'linecolor'];
  }

  // Handle attribute changes
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return; // Do nothing if value hasn't changed

    switch (name) {
      case 'width':
        this.style.setProperty('--wavetable-width', `${newValue}px`);
        this._canvas.width = Number(newValue) || 300; // Ensure it's a number
        this._redraw(); // Redraw if data exists
        break;
      case 'height':
        this.style.setProperty('--wavetable-height', `${newValue}px`);
        this._canvas.height = Number(newValue) || 150; // Ensure it's a number
        this._redraw(); // Redraw if data exists
        break;
      case 'backgroundcolor':
        // Directly set style, as it's handled within the canvas
        // drawing/clearing
        this._canvas.style.backgroundColor = newValue;
        this._redraw();
        break;
      case 'linecolor':
        // Store this for use in _drawWaveform
        this._lineColor = newValue || '#007bff'; // Use default if invalid
        this._redraw();
        break;
    }
  }

  // Lifecycle method: component connected to the DOM
  connectedCallback() {
    // Set initial canvas size and styles based on attributes or defaults
    const initialWidth = this.getAttribute('width') || 300;
    const initialHeight = this.getAttribute('height') || 150;
    this.style.setProperty('--wavetable-width', `${initialWidth}px`);
    this.style.setProperty('--wavetable-height', `${initialHeight}px`);
    this._canvas.width = Number(initialWidth);
    this._canvas.height = Number(initialHeight);
    this._lineColor = this.getAttribute('linecolor') || '#007bff';
    this._canvas.style.backgroundColor =
        this.getAttribute('backgroundcolor') || '#f0f0f0';

    console.log('WavetableView connected.');
    this._drawEmptyState(); // Draw initial empty state
  }

  /**
   * Computes the Inverse Discrete Fourier Transform (IDFT).
   * This is a basic O(N^2) implementation, not a fast FFT.
   * @param {number[]} real - Array of real parts of frequency domain data.
   * @param {number[]} imag - Array of imaginary parts of frequency domain data.
   * @return {Float32Array} The real part of the time-domain signal (PCM data).
   * @private
   */
  _inverseDFT(real, imag) {
    const N = real.length;
    if (N !== imag.length) {
      throw new Error('Real and imaginary arrays must have the same length.');
    }
    if (N === 0) {
      return new Float32Array(0);
    }

    const timeDomainReal = new Float32Array(N);
    const twoPiOverN = 2 * Math.PI / N;

    console.log(`Starting IDFT calculation for N = ${N}...`);

    for (let n = 0; n < N; n++) { // For each time sample
      let sumReal = 0;
      // let sumImag = 0; // We only need the real part for the waveform

      for (let k = 0; k < N; k++) { // Sum over frequencies
        const angle = twoPiOverN * k * n;
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);

        // Complex multiplication:
        // (real[k] + j*imag[k]) * (cosAngle + j*sinAngle)
        // Real part = real[k]*cosAngle - imag[k]*sinAngle
        sumReal += real[k] * cosAngle - imag[k] * sinAngle;
        // Imaginary part = real[k]*sinAngle + imag[k]*cosAngle
        // sumImag += real[k] * sinAngle + imag[k] * cosAngle;
      }
      timeDomainReal[n] = sumReal / N;
    }
    console.log('IDFT calculation finished.');
    return timeDomainReal;
  }

  /**
   * Public method to receive complex data, compute IFFT (IDFT here), and draw.
   * @param {number[]} real - Array of real parts.
   * @param {number[]} imag - Array of imaginary parts.
   */
  setComplexData(real, imag) {
    console.log('Received complex data.');
    try {
      // Perform Inverse DFT
      this._pcmData = this._inverseDFT(real, imag);
      console.log('PCM data generated:', this._pcmData);

      // Draw the waveform
      this._drawWaveform();
    } catch (error) {
      console.error('Error processing complex data:', error);
      this._drawErrorState(error.message); // Show error on canvas
    }
  }

  /**
    * Draws the current PCM data onto the canvas.
    * @private
    */
  _drawWaveform() {
    if (!this._pcmData || this._pcmData.length === 0) {
      this._drawEmptyState('No data to display');
      return;
    }

    const ctx = this._ctx;
    const width = this._canvas.width;
    const height = this._canvas.height;
    const data = this._pcmData;
    const dataLength = data.length;

    // Clear canvas using the background color attribute or default
    ctx.fillStyle = this.getAttribute('backgroundcolor') || '#f0f0f0';
    ctx.fillRect(0, 0, width, height);

    // Find min and max amplitude for scaling
    let minVal = data[0];
    let maxVal = data[0];
    for (let i = 1; i < dataLength; i++) {
      if (data[i] < minVal) minVal = data[i];
      if (data[i] > maxVal) maxVal = data[i];
    }

    // Add padding if min and max are the same (e.g., constant signal)
    // Also handle the case where the signal is flat zero
    if (maxVal === minVal) {
      maxVal += (maxVal === 0 ? 1 : 0.1);
      minVal -= (minVal === 0 ? 1 : 0.1);
    }

    const amplitudeRange = maxVal - minVal;
    // Avoid division by zero if range is somehow still zero
    const verticalScale = amplitudeRange !== 0 ? height / amplitudeRange : 1;

    // Set line style
    ctx.lineWidth = 1.5; // Slightly thicker line
    ctx.strokeStyle = this._lineColor; // Use stored line color
    ctx.beginPath();

    // Draw the waveform line
    for (let i = 0; i < dataLength; i++) {
      // Scale time index to canvas width
      // Use dataLength (instead of dataLength - 1) for mapping points to
      // pixel columns
      const x = (i / dataLength) * width;

      // Scale amplitude: Map [minVal, maxVal] to [height, 0] (inverted y-axis)
      // y = height - ((data[i] - minVal) * verticalScale);
      // Ensure y is clamped within canvas bounds in case of
      // floating point issues
      const y =
          Math.max(0, Math.min(height,
              height - ((data[i] - minVal) * verticalScale)));


      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke(); // Render the path
    console.log('Waveform drawn.');
  }

  /**
   * Draws an empty state message.
   * @param {string} [message='No data loaded'] - The message to display.
   * @private
   */
  _drawEmptyState(message = 'No data loaded') {
    const ctx = this._ctx;
    const width = this._canvas.width;
    const height = this._canvas.height;
    ctx.fillStyle = this.getAttribute('backgroundcolor') || '#f0f0f0';
    ctx.fillRect(0, 0, width, height);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText(message, width / 2, height / 2);
  }

  /**
    * Draws an error message.
    * @param {string} errorMessage - The error message to display.
    * @private
    */
  _drawErrorState(errorMessage) {
    const ctx = this._ctx;
    const width = this._canvas.width;
    const height = this._canvas.height;
    ctx.fillStyle = '#ffe0e0'; // Light red background for error
    ctx.fillRect(0, 0, width, height);
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#c00'; // Red text
    ctx.textAlign = 'center';
    // Add max width
    ctx.fillText(`Error: ${errorMessage}`, width / 2, height / 2, width * 0.9);
  }


  /**
   * Redraws the waveform or empty state.
   * @private
   */
  _redraw() {
    if (this._pcmData) {
      this._drawWaveform();
    } else {
      this._drawEmptyState(); // Redraw empty state if no data
    }
  }
}

// Define the custom element
customElements.define('wavetable-view', WavetableView);
