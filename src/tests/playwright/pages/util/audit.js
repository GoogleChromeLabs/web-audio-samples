// noinspection JSConstantReassignment

/**
 * Check if |actual| is close to |expected| using the given relative error
 * |threshold|.
 * @param {number} actual
 * @param {number} expected
 * @param {number} threshold
 * @returns {boolean} if |actual| is within |threshold| of |expected|
 */
export function beCloseTo(actual, expected, threshold) {
    // The threshold is relative except when |expected| is zero, in which case
    // it is absolute.
    const absExpected = expected ? Math.abs(expected) : 1;
    let error = Math.abs(actual - expected) / absExpected;
    console.assert(error <= threshold, `${actual} vs ${expected} | ${Math.abs(actual - expected)} diff`);
    return error <= threshold;
}

/**
 * Assigns a given test function to the global window.test property.
 * This function is used to set up a test that can later be executed globally.
 *
 * @param {Promise<any>} test - The test function to be assigned to window.test.
 */
export const test = test => window.test = test;

/**
 * Evaluates a given function by assigning it to window.evaluate.
 * If the liveSuite property on window is true, the function is assigned directly.
 * Otherwise, the function is invoked immediately.
 *
 * @param {Function} fun - The function to evaluate.
 */
export const evaluate = fun => window.evaluate = window.liveSuite ? fun : fun();
