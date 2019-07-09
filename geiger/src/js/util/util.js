export const isObject = function(value) {
  return !!value && (typeof value === 'object' || typeof value === 'function');
};

export const noop = () => {}

export const sum = (arr) => arr.reduce((res, x) => res + x, 0);

export const isEmptyArray = (arr) => !arr || arr.length === 0;

// /**
//  * Find the point on the line from `from` to `to`, in which
//  * the distance between the point and `from` is `distance`
//  */
// export const findPointByDistance = (from, to, distance) => {
//   const theta = toRad(calcTheta(from, to));
//   return {
//     x: from.x + Math.cos(theta) * distance,
//     y: from.y + Math.sin(theta) * distance
//   }
// }

// export const calcTheta = (from, to) => {
//   // Invert the y-axis.
//   var y = -(to.y - from.y);
//   var x = to.x - from.x;
//   var rad = Math.atan2(y, x); // defined for all 0 corner cases

//   // Correction for III. and IV. quadrant.
//   if (rad < 0) {
//       rad = 2 * Math.PI + rad;
//   }

//   return 180 * rad / Math.PI;
// }

// export const toRad = function(deg, over360) {

//   over360 = over360 || false;
//   deg = over360 ? deg : (deg % 360);
//   return deg * Math.PI / 180;
// };