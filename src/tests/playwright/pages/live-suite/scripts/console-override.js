/**
 * @fileoverview Overrides console methods to capture outputs in `output` array
 * for debugging/tests. Handles common methods like log, error, info, and more,
 * storing { method, arguments }.
 */
export const output = [];

[
  'log', 'debug', 'info', 'error', 'warning', 'dir', 'dirxml',
  'table', 'trace', 'clear', 'group', 'groupCollapsed', 'groupEnd',
  'assert', 'profile', 'profileEnd', 'count', 'timeEnd',
].forEach((method) => {
  const original = console[method];
  console[method] = (...args) => {
    (method !== 'assert' || (method === 'assert' && !args[0])) &&
        output.push({method, args});
    return original.apply(console, args);
  };
});
