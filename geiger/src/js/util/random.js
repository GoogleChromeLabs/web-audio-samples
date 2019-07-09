
/**
 * Pass a string as random seed, return a generator based on sfc32
 * The `rand()` has value [0,1]
 * @param {string} str Random seed
 * @example
 * const {rand, randInt, randChoice} = getRandomGeneratorWithSeed('seed');
 * rand();
 */
export const getRandomGeneratorWithSeed = (str) => {
  const seed = xmur3(str);

  /** Return a random float [0, 1] */
  const rand = sfc32(seed(), seed(), seed(), seed());
  /** Return a random integer [0, num] */
  const randInt = (num) => Math.floor(rand() * num);
  /** Return a random item from array `arr` */
  const randChoice = (arr) => arr[randInt(arr.length)];
  /** Return a random integer from [start, end] */
  const randIntBetween = (start, end) => Math.floor(start + rand() * (end - start));

  /**
   * Returns an array of m psuedorandom, smoothly-varying non-negative integers.
   * This array has k random bumps.
   */
  const randBumps = getRandBumps(rand);

  return {rand, randInt, randChoice, randIntBetween, randBumps};
}


/**
 * Hash the random seed such that similar seeds will obtain very
 * different results.
 * @credit copy from https://stackoverflow.com/a/47593316
 * @param {string} str Random seed
 */
function xmur3(str) {
  for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function() {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
  }
}

/**
 * Pseudorandom number generator
 * @credit copy from https://stackoverflow.com/a/47593316
 */
function sfc32(a, b, c, d) {
  return function() {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
    var t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = c + (c << 3) | 0;
    c = ((c << 21) | (c >>> 11));
    d = d + 1 | 0;
    t = t + d | 0;
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  }
}


/**
 * Returns an array of m psuedorandom, smoothly-varying non-negative numbers.
 * This array has k random bumps
 * @credit adapted from https://observablehq.com/@d3/stacked-to-grouped-bars
 */
const getRandBumps = (rand) => (m, k=5) => {
  const values = [];

  // Initialize with uniform random values in [0.1, 0.2).
  for (let i = 0; i < m; ++i) {
    values[i] = 0.1 + 0.1 * rand();
  }

  // Add k random bumps.
  for (let j = 0; j < k; ++j) {
    const x = 1 / (0.1 + rand());
    const y = 2 * rand() - 0.5;
    const z = 10 / (0.1 + rand());
    for (let i = 0; i < m; i++) {
      const w = (i / m - y) * z;
      values[i] += x * Math.exp(-w * w);
    }
  }

  // Ensure all values are positive.
  for (let i = 0; i < m; ++i) {
    values[i] = Math.max(0, values[i]);
  }

  return values;
}

