/* eslint-disable */

// Copyright (c) 2010 Corban Brook, released under the MIT license
// Fourier Transform Module used by DFT, FFT, RFT
// Slightly modified for packed DC/nyquist...

function FourierTransform(bufferSize, sampleRate) {
  this.bufferSize = bufferSize;
  this.sampleRate = sampleRate;
  this.bandwidth = 2 / bufferSize * sampleRate / 2;

  this.spectrum = new Float32Array(bufferSize/2);
  this.real = new Float32Array(bufferSize);
  this.imag = new Float32Array(bufferSize);

  this.peakBand = 0;
  this.peak = 0;

  /**
   * Calculates the *middle* frequency of an FFT band.
   *
   * @param {Number} index The index of the FFT band.
   *
   * @return The middle frequency in Hz.
   */
  this.getBandFrequency = function(index) {
    return this.bandwidth * index + this.bandwidth / 2;
  };

  this.calculateSpectrum = function() {
    const spectrum = this.spectrum;
    const real = this.real;
    const imag = this.imag;
    const bSi = 2 / this.bufferSize;
    const sqrt = Math.sqrt;
    let rval;
    let ival;
    let mag;

    for (let i = 0, N = bufferSize/2; i < N; i++) {
      rval = real[i];
      ival = imag[i];
      mag = bSi * sqrt(rval * rval + ival * ival);

      if (mag > this.peak) {
        this.peakBand = i;
        this.peak = mag;
      }

      spectrum[i] = mag;
    }
  };
}

/**
 * FFT is a class for calculating the Discrete Fourier Transform of a signal
 * with the Fast Fourier Transform algorithm.
 *
 * @param {Number} bufferSize The size of the sample buffer to be
 * computed. Must be power of 2
 * @param {Number} sampleRate The sampleRate of the buffer (eg. 44100)
 *
 * @constructor
 */
function FFT(bufferSize, sampleRate) {
  FourierTransform.call(this, bufferSize, sampleRate);

  this.reverseTable = new Uint32Array(bufferSize);

  let limit = 1;
  let bit = bufferSize >> 1;

  let i;

  while (limit < bufferSize) {
    for (i = 0; i < limit; i++) {
      this.reverseTable[i + limit] = this.reverseTable[i] + bit;
    }

    limit = limit << 1;
    bit = bit >> 1;
  }

  this.sinTable = new Float32Array(bufferSize);
  this.cosTable = new Float32Array(bufferSize);

  for (i = 0; i < bufferSize; i++) {
    this.sinTable[i] = Math.sin(-Math.PI/i);
    this.cosTable[i] = Math.cos(-Math.PI/i);
  }
}

/**
 * Performs a forward tranform on the sample buffer.
 * Converts a time domain signal to frequency domain spectra.
 *
 * @param {Array} buffer The sample buffer. Buffer Length must be power of 2
 *
 * @return The frequency spectrum array
 */
FFT.prototype.forward = function(buffer) {
  // Locally scope variables for speed up
  const bufferSize = this.bufferSize;
  const cosTable = this.cosTable;
  const sinTable = this.sinTable;
  const reverseTable = this.reverseTable;
  const real = this.real;
  const imag = this.imag;
  const spectrum = this.spectrum;

  const k = Math.floor(Math.log(bufferSize) / Math.LN2);

  if (Math.pow(2, k) !== bufferSize) {
    throw 'Invalid buffer size, must be a power of 2.';
  }
  if (bufferSize !== buffer.length) {
    throw 'Supplied buffer is not the same size as defined FFT. FFT Size: ' +
    bufferSize + ' Buffer Size: ' + buffer.length;
  }

  let halfSize = 1;
  let phaseShiftStepReal;
  let phaseShiftStepImag;
  let currentPhaseShiftReal;
  let currentPhaseShiftImag;
  let off;
  let tr;
  let ti;
  let tmpReal;
  let i;

  for (i = 0; i < bufferSize; i++) {
    real[i] = buffer[reverseTable[i]];
    imag[i] = 0;
  }

  while (halfSize < bufferSize) {
    // phaseShiftStepReal = Math.cos(-Math.PI/halfSize);
    // phaseShiftStepImag = Math.sin(-Math.PI/halfSize);
    phaseShiftStepReal = cosTable[halfSize];
    phaseShiftStepImag = sinTable[halfSize];

    currentPhaseShiftReal = 1;
    currentPhaseShiftImag = 0;

    for (let fftStep = 0; fftStep < halfSize; fftStep++) {
      i = fftStep;

      while (i < bufferSize) {
        off = i + halfSize;
        tr = (currentPhaseShiftReal * real[off]) -
             (currentPhaseShiftImag * imag[off]);
        ti = (currentPhaseShiftReal * imag[off]) +
             (currentPhaseShiftImag * real[off]);

        real[off] = real[i] - tr;
        imag[off] = imag[i] - ti;
        real[i] += tr;
        imag[i] += ti;

        i += halfSize << 1;
      }

      tmpReal = currentPhaseShiftReal;
      currentPhaseShiftReal = (tmpReal * phaseShiftStepReal) -
                              (currentPhaseShiftImag * phaseShiftStepImag);
      currentPhaseShiftImag = (tmpReal * phaseShiftStepImag) +
                              (currentPhaseShiftImag * phaseShiftStepReal);
    }

    halfSize = halfSize << 1;
  }

  // Pack nyquist component.
  imag[0] = real[bufferSize / 2];
};

FFT.prototype.inverse = function(real, imag) {
  // Locally scope variables for speed up
  const bufferSize = this.bufferSize;
  const cosTable = this.cosTable;
  const sinTable = this.sinTable;
  const reverseTable = this.reverseTable;
  const spectrum = this.spectrum;

  real = real || this.real;
  imag = imag || this.imag;

  let halfSize = 1;
  let phaseShiftStepReal;
  let phaseShiftStepImag;
  let currentPhaseShiftReal;
  let currentPhaseShiftImag;
  let off;
  let tr;
  let ti;
  let tmpReal;
  let i;

  // Unpack and create mirror image.
  // This isn't that efficient, but let's us avoid having to deal with the
  // mirror image part when processing.
  const n = bufferSize;
  const nyquist = imag[0];
  imag[0] = 0;
  real[n / 2] = nyquist;
  imag[n / 2] = 0;

  // Mirror image complex conjugate.
  for (i = 1 + n / 2; i < n; i++) {
    real[i] = real[n - i];
    imag[i] = -imag[n - i];
  }

  for (i = 0; i < bufferSize; i++) {
    imag[i] *= -1;
  }

  const revReal = new Float32Array(bufferSize);
  const revImag = new Float32Array(bufferSize);


  for (i = 0; i < real.length; i++) {
    revReal[i] = real[reverseTable[i]];
    revImag[i] = imag[reverseTable[i]];
  }

  real = revReal;
  imag = revImag;

  while (halfSize < bufferSize) {
    phaseShiftStepReal = cosTable[halfSize];
    phaseShiftStepImag = sinTable[halfSize];
    currentPhaseShiftReal = 1;
    currentPhaseShiftImag = 0;

    for (let fftStep = 0; fftStep < halfSize; fftStep++) {
      i = fftStep;

      while (i < bufferSize) {
        off = i + halfSize;
        tr = (currentPhaseShiftReal * real[off]) -
             (currentPhaseShiftImag * imag[off]);
        ti = (currentPhaseShiftReal * imag[off]) +
             (currentPhaseShiftImag * real[off]);

        real[off] = real[i] - tr;
        imag[off] = imag[i] - ti;
        real[i] += tr;
        imag[i] += ti;

        i += halfSize << 1;
      }

      tmpReal = currentPhaseShiftReal;
      currentPhaseShiftReal = (tmpReal * phaseShiftStepReal) -
                              (currentPhaseShiftImag * phaseShiftStepImag);
      currentPhaseShiftImag = (tmpReal * phaseShiftStepImag) +
                              (currentPhaseShiftImag * phaseShiftStepReal);
    }

    halfSize = halfSize << 1;
  }

  const buffer = new Float32Array(bufferSize); // this should be reused instead
  for (i = 0; i < bufferSize; i++) {
    buffer[i] = real[i] / bufferSize;
  }

  return buffer;
};
