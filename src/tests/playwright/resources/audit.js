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
