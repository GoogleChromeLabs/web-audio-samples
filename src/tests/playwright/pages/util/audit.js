/**
 * @fileoverview Web Audio Test Suite management and utility functions.
 * Specifies functions to define and evaluate Web Audio Tests and schedule
 * execution making Web Audio tests compatible with Playwright and the
 * Live Test Suite. Manages global test state for assertion handling.
 *
 * Additionally includes functions to validate audio processing.
 */

/**
 * Check if |actual| is close to |expected| using the given relative error
 * |threshold|.
 * @param {number} actual
 * @param {number} expected
 * @param {number} threshold
 * @return {boolean} if |actual| is within |threshold| of |expected|
 */
export function beCloseTo(actual, expected, threshold) {
  // The threshold is relative except when |expected| is zero, in which case
  // it is absolute.
  const absExpected = expected ? Math.abs(expected) : 1;
  const error = Math.abs(actual - expected) / absExpected;
  return error <= threshold;
}

/**
 * Compare two float32arrays sample-by-sample using a relative error threshold.
 * Default threshold is 0.01 for relative floating-point comparison.
 * @param {Float32Array} actualData - actual array of samples.
 * @param {Float32Array} expectedData - expected array of samples.
 * @param {number} threshold - threshold for sample similarity comparison
 * @return {number} percentage of array samples that are similar.
 */
export function compareBufferData(actualData, expectedData, threshold = 0.01) {
  let numberOfAcceptableSamples = 0;
  for (let i = 0; i < expectedData.length; ++i) {
    const isClose = beCloseTo(actualData[i], expectedData[i], threshold);
    console.assert(isClose,
        `sample ${i}: ${actualData[i]} vs ${expectedData[i]}`);
    numberOfAcceptableSamples += isClose ? 1 : 0;
  }
  console.info('% similar', numberOfAcceptableSamples / expectedData.length);
  return numberOfAcceptableSamples / expectedData.length;
}

/**
 * Creates a Web Audio Test for Playwright and the Web Audio Test Suite.
 * Assigns a given test function to the global window._webAudioTest property.
 * This function is used to set up a test that can later be executed globally.
 *
 * @param {Promise<any>} testPromise - The test function to be assigned to
 * window._webAudioTest.
 */
export const test = (testPromise) => {
  // Assign current test to run
  window._webAudioTest = testPromise;
  // If test is being run from the live suite, resolve promise to start timing
  window._isTestSuiteMode && window._webAudioTestIsRunning();
};

// For Playwright tests, webAudioEvaluate is set to a deferred promise with
// webAudioEvaluateResolve as the resolution function. The resolve is called
// when the test is evaluated in evaluateTest.
let webAudioEvaluateResolve;
!window._isTestSuiteMode &&
    (window.webAudioEvaluate = new Promise((resolve) =>
      webAudioEvaluateResolve = resolve));

/**
 * Evaluates a Web Audio Test and assigns the result to window.webAudioEvaluate.
 * If window._webAudioTestSuite property is true, the function is assigned
 * directly. Otherwise, the function is invoked immediately.
 *
 * @param {Function} testFunction - The test function to evaluate.
 * @return {any}
 */
export const evaluateTest = (testFunction) => window._isTestSuiteMode ?
    window.webAudioEvaluate =
        async () => testFunction(await window._webAudioTest) :
    webAudioEvaluateResolve((async () =>
        testFunction(await window._webAudioTest))());

// global state to accumulate assert() tests
const tests = [];

/**
 * Asserts a condition and logs a message if the condition is not met.
 * If no arguments are specified, the function returns a boolean indicating
 * whether all previous assertions were true.
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
