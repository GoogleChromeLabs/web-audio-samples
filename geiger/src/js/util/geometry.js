// return angle in radians
export const calcAngleRadian = (from, to) => {
  // inverse y-axis
  const dy = -(to.y - from.y);
  const dx = to.x - from.x;
  return Math.atan2(dy, dx);
};
// return angle in degrees
export const calcAngleDegrees = (from, to) => {
  // inverse y-axis
  const dy = -(to.y - from.y);
  const dx = to.x - from.x;
  return Math.atan2(dy, dx) * 180 / Math.PI;
};
export const calcDistance = (p1, p2) => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
};
/**
 * Find the point on the line from `from` to `to`, in which
 * the distance between the `from` and the point is `distance`
 */
export const getPointByDistance = (from, to, distance) => {
  const length = calcDistance(from, to);
  if (length === 0) {
    throw new Error('from should not be the same as to');
  }
  const ratio = distance / length;
  return getPointByRatio(from, to, ratio);
};
export const getPointByRatio = (from, to, ratio) => {
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio
  };
};
