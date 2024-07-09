/**
 * Check if |actual| is close to |expected| using the given relative error
 * |threshold|.
 * @param {number} actual
 * @param {number} expected
 * @param {number} threshold
 * @returns {[boolean, string]} if |actual| is within |threshold| of |expected|
 */
export function beCloseTo(actual, expected, threshold) {
  // The threshold is relative except when |expected| is zero, in which case
  // it is absolute.
  const absExpected = expected ? Math.abs(expected) : 1;
  let error = Math.abs(actual - expected) / absExpected;
  return [
    error <= threshold,
    `${ actual } vs ${ expected } | error: ${error} | ${ Math.abs(actual - expected) } diff`
  ];
}

/**
 * Assigns a given test function to the global window._webAudioTest property.
 * This function is used to set up a test that can later be executed globally.
 *
 * @param {Promise<any>} test - The test function to be assigned to window._webAudioTest.
 */
export const test = test => window._webAudioTest = test;

/**
 * Evaluates a given function by assigning it to window.webAudioEvaluate.
 * If window._webAudioSuite property is true, the function is assigned directly.
 * Otherwise, the function is invoked immediately.
 *
 * @param {Function} fun - The function to evaluate.
 */
export const evaluate = fun => window.webAudioEvaluate = window._webAudioSuite ?
    () => fun(window._webAudioTest) : fun(window._webAudioTest);

const tests = [];
/**
 * A function that asserts a condition and logs a message if the condition is not met.
 *
 * @param {boolean} condition - The condition to be checked.
 * @param {string} message - The message to be logged if the condition is not met.
 * @return {boolean} The result of the assertion.
 */
export const assert = (condition = undefined, message = undefined) => {
  if (condition === undefined && message === undefined) {
    const res = tests.every(t => t);
    tests.length = 0;
    return res;
  }
  console.assert(condition, message);
  tests.push(condition);
};
