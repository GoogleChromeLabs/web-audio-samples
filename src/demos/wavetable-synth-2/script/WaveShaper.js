/**
 * Converts decibels to a linear gain value.
 * @param {number} db - Decibel value.
 * @returns {number} Linear gain value.
 */
const decibelsToLinear = (db) => {
  return Math.pow(10.0, 0.05 * db);
};

/**
 * Converts a linear gain value to decibels.
 * @param {number} x - Linear gain value.
 * @returns {number} Decibel value.
 */
const linearToDecibels = (x) => {
  if (x <= 0) {
    return -Infinity;
  }
  return 20.0 * Math.log10(x);
};

/**
 * Implements a waveshaping curve based on compressor characteristics.
 */
class Colortouch {
  /**
   * Sets the parameters for the waveshaping curve.
   * @param {number} dbThreshold - The threshold in dB above which compression
   * starts.
   * @param {number} dbKnee - The range in dB above the threshold where the
   * curve smoothly transitions.
   * @param {number} ratio - The compression ratio (e.g., 4 for 4:1).
   */
  constructor(dbThreshold, dbKnee, ratio) {
    this.linearThreshold = decibelsToLinear(dbThreshold);
    this.thresholdDb = dbThreshold;
    this.kneeDb = dbKnee;
    this.ratio = ratio;
    this.slope = 1 / this.ratio;

    // Calculate k value based on the desired slope at the knee point
    this.k = this.kAtSlope(this.slope);

    this.kneeThresholdDb = dbThreshold + this.kneeDb;
    this.kneeThreshold = decibelsToLinear(this.kneeThresholdDb);

    // Calculate the output level (in dB) at the knee threshold
    this.ykneeThresholdDb = linearToDecibels(this.saturateBasic(this.kneeThreshold, this.k));
  }

  /**
   * Calculates the slope of the curve at a given input level x using a specific
   * k value.
   * @private
   * @param {number} x - Input level (linear).
   * @param {number} k - Curve shaping parameter.
   * @returns {number} The slope at point x.
   */
  slopeAt(x, k) {
    if (x < this.linearThreshold) {
      return 1;
    }

    // Use a small delta for numerical differentiation
    const deltaX = 0.001;
    const x1 = x;
    const x2 = x * (1 + deltaX); // Use relative delta for better precision across magnitudes

    const x1Db = linearToDecibels(x1);
    const x2Db = linearToDecibels(x2);

    const y1Db = linearToDecibels(this.saturateBasic(x1, k));
    const y2Db = linearToDecibels(this.saturateBasic(x2, k));

    // Avoid division by zero or very small numbers if x1Db and x2Db are too
    // close
    const dbDifference = x2Db - x1Db;
    if (Math.abs(dbDifference) < 1e-9) {
        // Handle potential division by zero or near-zero This might happen if x
        // is very close to 0 or if precision issues arise. Returning 1 (no
        // compression) or slope (full compression) might be options, but
        // requires understanding the desired behavior at edge cases. For now,
        // let's return the target slope as a fallback.
        return this.slope;
    }

    const m = (y2Db - yDb) / dbDifference;
    return m;
  }

  /**
   * Finds the k value that results in a specific slope at the knee threshold.
   * Uses a binary search-like approach.
   * @private
   * @param {number} slope - The desired slope (1 / ratio).
   * @returns {number} The calculated k value.
   */
  kAtSlope(slope) {
    const xDb = this.thresholdDb + this.kneeDb;
    const x = decibelsToLinear(xDb);

    let minK = 0.1;
    let maxK = 10000;
    let k = 5; // Initial guess

    // Iterate to approximate the k value
    for (let i = 0; i < 15; ++i) {
      const m = this.slopeAt(x, k);

      if (m < slope) {
        // Slope is too shallow, k is too high
        maxK = k;
      } else {
        // Slope is too steep, k is too low
        minK = k;
      }
      // Adjust k using a midpoint approach (safer than sqrt for potential
      // negative values if logic were different)
      k = (minK + maxK) / 2;
    }

    return k;
  }

  /**
   * Basic exponential saturation function used below the knee threshold.
   * @private
   * @param {number} x - Input level (linear).
   * @param {number} k - Curve shaping parameter.
   * @returns {number} Saturated output level (linear).
   */
  saturateBasic(x, k) {
    if (x < this.linearThreshold) {
      return x;
    }
    // Avoid division by zero if k is very small or zero
    if (k === 0) {
        return x; // Or handle as linear above threshold if k=0 implies ratio=1
    }
    return this.linearThreshold + (1 - Math.exp(-k * (x - this.linearThreshold))) / k;
  }

  /**
   * Applies the full waveshaping curve, including the knee and the linear gain
   * reduction part.
   * @param {number} x - Input level (linear).
   * @returns {number} Shaped output level (linear).
   */
  saturate(x) {
    let y;

    if (x < this.kneeThreshold) {
      // Below the knee, use the exponential saturation
      y = this.saturateBasic(x, this.k);
    } else {
      // Above the knee, apply linear gain reduction based on the ratio
      const xDb = linearToDecibels(x);
      const yDb = this.ykneeThresholdDb + this.slope * (xDb - this.kneeThresholdDb);
      y = decibelsToLinear(yDb);
    }

    return y;
  }
}

/**
 * Generates the Colortouch waveshaper curve.
 * @param {Float32Array} curve - The array to fill with curve values.
 * @returns {Float32Array} The populated curve array.
 */
const generateColortouchCurve = (curve) => {
  const colortouch = new Colortouch(-10, 20, 30);
  const n = curve.length;
  const n2 = n / 2;

  for (let i = 0; i < n2; ++i) {
    let x = i / n2; // Map index to range [0, 1)
    x = colortouch.saturate(x);

    curve[n2 + i] = x;       // Positive side
    curve[n2 - 1 - i] = -x;  // Negative side (symmetric)
  }

  return curve;
};

/**
 * Creates a WaveShaper node setup with pre and post gain stages and applies a
 * Colortouch distortion curve.
 */
export class WaveShaper {
  /**
   * @param {AudioContext} context - The Web Audio API AudioContext.
   */
  constructor(context) {
    if (!context || typeof context.createWaveShaper !== 'function') {
        throw new Error('A valid AudioContext is required for WaveShaper.');
    }
    this.context = context;

    const waveshaper = context.createWaveShaper();
    const preGain = context.createGain();
    const postGain = context.createGain();

    preGain.connect(waveshaper);
    waveshaper.connect(postGain);

    this.input = preGain;
    this.output = postGain;

    // Initialize with the Colortouch curve Allocate curve array once if
    // possible, or ensure it's properly sized
    const curve = new Float32Array(65536);
    generateColortouchCurve(curve);
    waveshaper.curve = curve;

    // Enable oversampling for better quality if the browser supports it
    if ('oversample' in waveshaper) {
      waveshaper.oversample = '4x';
    }
  }

  /**
   * Sets the drive amount, adjusting pre-gain and applying makeup gain.
   * @param {number} drive - The desired drive level (linear gain). Should be >
   * 0.
   */
  setDrive(drive) {
    if (typeof drive !== 'number' || drive <= 0) {
        console.error('Invalid drive value. Drive must be a positive number.');
        return;
    }
    this.input.gain.value = drive;

    // Apply makeup gain to compensate for the drive increase, using an exponent
    // for a smoother perceived loudness adjustment.
    const postDrive = Math.pow(1 / drive, 0.6);
    this.output.gain.value = postDrive;
  }

  get input() {
    return this.input;
  }

  get output() {
    return this.output;
  }
}
