/**
 * @fileoverview Provides utility functions for auditing and testing in the Web Audio Test Suite,
 * including assertions, test function evaluation, and global test state management. Designed for use in
 * scenarios requiring audio processing result validation, it supports both synchronous and asynchronous test execution.
 * Key functionalities include numeric comparison with tolerance, test scheduling, and collective assertion logging.
 */

/**
 * Check if |actual| is close to |expected| using the given relative error
 * |threshold|.
 * @param {number} actual
 * @param {number} expected
 * @param {number} threshold
 * @return {[boolean, string]} if |actual| is within |threshold| of |expected|
 */
export function beCloseTo(actual, expected, threshold) {
  // The threshold is relative except when |expected| is zero, in which case
  // it is absolute.
  const absExpected = expected ? Math.abs(expected) : 1;
  const error = Math.abs(actual - expected) / absExpected;
  return [
    error <= threshold,
    // eslint-disable-next-line max-len
    `${ actual } vs ${ expected } | error: ${error} | ${ Math.abs(actual - expected) } diff`,
  ];
}

/**
 * Assigns a given test function to the global window._webAudioTest property.
 * This function is used to set up a test that can later be executed globally.
 *
 * @param {Promise<any>} testPromise - The test function to be assigned to
 * window._webAudioTest.
 */
export const test = (testPromise) => {
  window._webAudioTest = testPromise;
  window._webAudioTestSuite && window._webAudioTestIsRunning();
};

/**
 * Evaluates a given function by assigning it to window.webAudioEvaluate.
 * If window._webAudioSuite property is true, the function is assigned directly.
 * Otherwise, the function is invoked immediately.
 *
 * @param {Function} testFunction - The function to evaluate.
 * @return {any}
 */
export const evaluateTestFunction =
  (testFunction) =>  window.webAudioEvaluate = window._webAudioTestSuite
    ? () => testFunction(window._webAudioTest)
    : testFunction(window._webAudioTest);

const tests = [];

/**
 * Asserts a condition and logs a message if the condition is not met.
 *
 * @param {boolean} condition - The condition to be checked.
 * @param {string} message - The message to be logged if condition is not met.
 * @return {boolean} The result of the assertion.
 */
export const assert = (condition = undefined, message = undefined) => {
  if (condition === undefined && message === undefined) {
    const result = tests.every((test) => test);
    tests.length = 0;
    return result;
  }
  console.assert(condition, message);
  tests.push(condition);
};
