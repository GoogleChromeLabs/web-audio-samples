
export const round = (x, precision) => {
  var f = Math.pow(10, precision || 0);
  return Math.round(x * f) / f;
}

/**
 * Round a point to a given precision
 */
export const roundPoint = (point, precision) => {
  var f = Math.pow(10, precision || 0);
  point.x = Math.round(point.x * f) / f;
  point.y = Math.round(point.y * f) / f;
  return point;
}