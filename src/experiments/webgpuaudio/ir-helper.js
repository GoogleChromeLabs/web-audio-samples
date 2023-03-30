/**
 * Creates an impulse response (Float32Array) with 10 samples or user-specified
 * length for convolution testing. The content of the generated IR will be a
 * downward ramp starting from 1.0.
 * 
 * @example
 * const testIR = IRHelper.createTestIR(256);
 * console.log(testIR);                    // Should have 256 elements.
 * console.log(testIR[0], testIR[255]);    // Should be 1 and 0.
 * 
 * @param {number} length The sample length of the generated IR. Should be
 *   an integer. When unspecified or invalid, it uses the default length of 10.
 * @returns {Float32Array}
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

export default {
  createTestIR,
};