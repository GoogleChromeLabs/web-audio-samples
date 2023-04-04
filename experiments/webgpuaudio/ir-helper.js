/**
 * Creates an impulse response (Float32Array) with 10 samples or user-specified
 * length for convolution testing. The content of the generated IR will be a
 * downward ramp starting from 1.0.
 * 
 * @param {number} length The sample length of the generated IR. Should be
 *   an integer. When unspecified or invalid, it uses the default length of 10.
 * @returns {Float32Array}
 * 
 * @example
 * const testIR = IRHelper.createTestIR(256);
 * console.log(testIR);                    // Should have 256 elements.
 * console.log(testIR[0], testIR[255]);    // Should be 1 and 0.
 */
const createTestIR = (length) => {
  let irLength = Number.isInteger(length) && length > 0 ? length : 10;
  const impulseResponse = new Float32Array(irLength);
  
  // We want the ramp to start from 1.0 and end at 0.0.
  const delta = 1.0 / (irLength - 1);
  for (let i = 0; i < irLength - 1; i++) {
    impulseResponse[i] = 1.0 - delta * i;
  }
  impulseResponse[irLength - 1] = 0;
  return impulseResponse;
}

/**
 * Produces a new Float32Array object from an audio file at the given URL.
 * Since this requires a valid AudioContext, this function can only gets called
 * from the main thread.
 * 
 * @param {AudioContext} audioContext An AudioContext instance.
 * @param {string} url A URL to the IR audio file.
 * @returns {Float32Array}
 * 
 * @example
 * const irArray = await fetchAudioFileToF32Array(
 *     audioContext,
 *     '../../sounds/impulse-responses/cardiod-35-10-spread.wav');
 * console.log(array);    // You'll see a big array!!! 
 */
const fetchAudioFileToF32Array = async (audioContext, url) => {
  const response = await fetch(url);
  const responseBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(responseBuffer);
  const float32Array = audioBuffer.getChannelData(0);
  return float32Array;
};

export {
  createTestIR,
  fetchAudioFileToF32Array,
};
