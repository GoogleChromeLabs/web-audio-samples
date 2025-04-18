// Copyright 2011, Google Inc.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//     * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

const K_DEFAULT_NUMBER_OF_RESAMPLE_RANGES = 11;

class WaveTable {
  constructor(name, context) {
    if (!context || typeof context.createBuffer !== 'function') {
      throw new Error('A valid AudioContext is required for WaveTable.');
    }
    this.name = name;
    this.context = context;
    this.sampleRate = context.sampleRate;
    this.waveTableSize = 4096; // hard-coded for now
    this.frequencyData = null; // Will hold { real: Float32Array, imag: Float32Array }
    this.buffers = []; // Array to hold AudioBuffer objects for different pitches
    this.numberOfResampleRanges = K_DEFAULT_NUMBER_OF_RESAMPLE_RANGES;

    this.loadFromDataSet(name);
    // Create the audio buffers immediately after loading data
    this.createBuffers();
  }

  /**
   * Finds the wavetable data in the WavetableDataSet and loads it.
   * @param {string} name - The name (filename) of the wavetable to load.
   * @private
   */
  loadFromDataSet(name) {
    const data = WavetableDataSet.find(item => item.filename === name);

    if (!data) {
      console.error(`Wavetable data for "${name}" not found in WavetableDataSet.`);
      // Provide empty arrays to prevent errors later
      this.frequencyData = {
        real: new Float32Array(0),
        imag: new Float32Array(0),
      };
      return;
    }

    // Copy into more efficient Float32Arrays.
    const n = data.real.length;
    this.frequencyData = {
      real: new Float32Array(data.real), // Directly use the array if it's already Float32Array
      imag: new Float32Array(data.imag), // or create a new one if it's a standard array
    };

    // Ensure the arrays have the expected size
    if (this.frequencyData.real.length !== this.waveTableSize / 2 || this.frequencyData.imag.length !== this.waveTableSize / 2) {
        console.warn(`Wavetable data for "${name}" has unexpected length. Expected ${this.waveTableSize / 2}, got Real: ${this.frequencyData.real.length}, Imag: ${this.frequencyData.imag.length}`);
    }
  }

  /**
   * Gets the appropriate pre-rendered AudioBuffer for a given pitch frequency.
   * This selects the buffer with the highest number of partials that won't cause aliasing.
   * @param {number} pitchFrequency - The target frequency in Hz.
   * @returns {AudioBuffer | null} The best matching AudioBuffer for the frequency, or null if not ready.
   */
  getWaveDataForPitch(pitchFrequency) {
    if (!this.buffers || this.buffers.length === 0) {
      console.warn(`WaveTable buffers for "${this.name}" not created yet or data was missing.`);
      return null;
    }

    const nyquist = 0.5 * this.sampleRate;
    const lowestNumPartials = this.getNumberOfPartialsForRange(0);
    const lowestFundamental = lowestNumPartials > 0 ? nyquist / lowestNumPartials : nyquist;

    // Find out pitch range index
    const ratio = pitchFrequency / lowestFundamental;
    let pitchRange = ratio <= 0.0 ? 0 : Math.floor(Math.log2(ratio));

    // Clamp the range index
    pitchRange = Math.max(0, pitchRange);
    pitchRange = Math.min(pitchRange, this.numberOfResampleRanges - 1);

    if (pitchRange >= this.buffers.length) {
        console.warn(`Requested pitch range ${pitchRange} exceeds available buffers (${this.buffers.length}). Using highest available.`);
        pitchRange = this.buffers.length - 1;
    }

    return this.buffers[pitchRange];
  }

  /**
   * Calculates the maximum number of partials for a given resampling range index.
   * Higher indices correspond to higher fundamental frequencies and thus fewer partials.
   * @param {number} rangeIndex - The index of the resampling range (0 to numberOfResampleRanges - 1).
   * @returns {number} The maximum number of partials for that range.
   */
  getNumberOfPartialsForRange(rangeIndex) {
    // Ensure rangeIndex is within valid bounds
    const safeRangeIndex = Math.max(0, Math.min(rangeIndex, this.numberOfResampleRanges - 1));
    // Goes from 1024 -> 4 @ 44.1KHz (and do same for 48KHz)
    // Goes from 2048 -> 8 @ 96KHz
    let npartials = Math.pow(2, 1 + this.numberOfResampleRanges - safeRangeIndex);

    // Adjust for higher sample rates (consider making 48000 a constant or configurable)
    if (this.sampleRate > 48000.0) {
      npartials *= 2;
    }
    // Ensure npartials doesn't exceed half the FFT size
    return Math.min(npartials, this.waveTableSize / 2);
  }


  /**
   * Creates multiple band-limited versions (AudioBuffers) of the wavetable
   * from the loaded frequency domain data, suitable for different pitch ranges
   * to minimize aliasing.
   * @private
   */
  createBuffers() {
    this.buffers = []; // Ensure buffers array is empty

    if (!this.frequencyData || this.frequencyData.real.length === 0) {
      console.error(`Frequency data for "${this.name}" is not loaded or is empty. Cannot create buffers.`);
      return;
    }

    let finalScale = 1.0;
    const n = this.waveTableSize;
    const halfSize = n / 2;
    const sourceReal = this.frequencyData.real;
    const sourceImag = this.frequencyData.imag;

    for (let j = 0; j < this.numberOfResampleRanges; ++j) {
      const frame = new FFT(n, this.sampleRate);

      // Copy from loaded frequency data and scale.
      const scale = n; // Scale factor for iFFT
      const copyLength = Math.min(halfSize, sourceReal.length, sourceImag.length);
      for (let i = 0; i < copyLength; ++i) {
        frame.real[i] = scale * sourceReal[i];
        frame.imag[i] = scale * sourceImag[i];
      }
      // Ensure remaining parts are zeroed if source was shorter than halfSize
      for (let i = copyLength; i < halfSize; ++i) {
          realP[i] = 0.0;
          imagP[i] = 0.0;
      }

      const realP = new frame.real;
      const imagP = new frame.imag;

      // Band-limit: Clear out higher frequencies to prevent aliasing
      const npartials = this.getNumberOfPartialsForRange(j);
      for (let i = npartials + 1; i < halfSize; i++) {
        realP[i] = 0.0;
        imagP[i] = 0.0;
      }
      // Clear packed-nyquist if necessary (assuming FFT implementation packs it at imagP[0])
      if (npartials < halfSize) {
        imagP[0] = 0.0;
      }

      // Clear any DC-offset (realP[0])
      realP[0] = 0.0;

      // Calculate normalization factor based *only* on the first (least band-limited) buffer
      if (j === 0) {
        let power = 0;
        for (let i = 1; i < halfSize; ++i) { // Start from 1 to exclude DC
          const x = realP[i];
          const y = imagP[i];
          power += x * x + y * y;
        }
        // Normalize based on RMS power, aiming for a peak close to 1.0 after iFFT.
        // The iFFT implementation divides by bufferSize (n), so the scale factor 'n'
        // above cancels that out. We need an additional scaling factor.
        const rmsPower = Math.sqrt(power) / n; // RMS power after iFFT scaling

        finalScale = 0.5 / power;
      }

      // Perform inverse FFT to get time-domain data
      const timeData = frame.inverse(realP, imagP); // Pass arrays explicitly

      // Create mono AudioBuffer.
      const buffer = this.context.createBuffer(1, n, this.sampleRate);
      const channelData = buffer.getChannelData(0);

      // Copy data to the buffer and apply the final normalization scale
      for (let i = 0; i < n; ++i) {
          channelData[i] = finalScale * timeData[i];
      }

      this.buffers[j] = buffer;
    }
  }

  get rateScale() {
    return this.waveTableSize / this.sampleRate;
  }
}
