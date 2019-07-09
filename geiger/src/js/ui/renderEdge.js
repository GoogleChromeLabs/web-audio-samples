import defaults from 'lodash.defaults'
import { fabric } from 'fabric';
import { PortTypes } from '../graph/PortTypes';
import { roundPoint } from '../util/roundPoint';
import { calcAngleRadian, getPointByDistance } from "../util/geometry";
import { ARROW_HEAD_SIZE, AUDIO_PARAM_RADIUS, INPUT_PORT_RADIUS } from './graphStyle';

/**
 * Use fabric.js to draw the edge.
 * @param {!fabric.Canvas} canvas
 * @param {!Edge} edge
 * @param {!Graph} graph
 * @param {?Object} opt
 */
export const drawEdge = (canvas, edge, graph, opt) => {

  const { path, arrowHead } = createPathAndArrowHead(graph, edge, canvas, opt);

  const group = new fabric.Group([path, arrowHead], {
    id: edge.id,
    hasRotatingPoint: false,
    hasControls: false,
    hasBorders: false,
    // selectable: false,  // even selectable=false, the event will stop propagation
    evented: false,  // use evented=false to truely allow event propagation
  })

  canvas.add(group);
  return group;
};


export const updateEdge = (edgeGroup, edge, graph) => {

  // remove the old path, add new path
  // @see https://stackoverflow.com/questions/35436344/fabricjs-the-bounding-box-of-a-path-not-get-update-when-i-change-path-coordinat
  edgeGroup.forEachObject(obj => {
    edgeGroup.remove(obj);
  })

  const { path, arrowHead } = createPathAndArrowHead(graph, edge);

  edgeGroup.addWithUpdate(path);
  edgeGroup.addWithUpdate(arrowHead);

  return edgeGroup;
};

const createPathAndArrowHead = (graph, edge, canvas, opt) => {

  opt = defaults(opt, { showControlPoints: false });

  const controlPoints = edge.getPoints();

  // remove the first and last point
  const middlePoints = controlPoints ? controlPoints.slice(1, controlPoints.length - 1) : [];
  // specify our own source and target points
  const { sourcePoint, targetPoint } = findConnectionPoints(graph, edge, middlePoints);

  if (canvas && opt.showControlPoints) {
    drawCircle(canvas, sourcePoint, { fill: 'blue' })
    drawCircle(canvas, targetPoint, { fill: 'purple' })
    middlePoints.forEach(point => {
      drawCircle(canvas, point)
    })
  }

  const pathD = createRoundedPath(sourcePoint, targetPoint, middlePoints);
  const arrowHeadPathD = createArrowHeadPath(sourcePoint, targetPoint, middlePoints);

  const path = new fabric.Path(pathD, {
    fill: '',
    stroke: 'black',
    strokeWidth: 1.5,
    selectable: false,
  });

  const arrowHead = new fabric.Path(arrowHeadPathD, {
    fill: 'black',
    selectable: false,
  });

  return { path, arrowHead, sourcePoint, targetPoint }
}

/**
 * Find the intersection point between the port and the link.
 */
const findConnectionPoints = (graph, edge, route) => {
  const source = edge.source;
  /** @TODO consider the port of source node */
  const sourceNode = graph.getNode(source.id);
  const sourceCenterPos = sourceNode.getPos();
  const sourceSize = sourceNode.getSize();
  const sourcePos = {
    x: sourceCenterPos.x + sourceSize.width / 2,
    y: sourceCenterPos.y
  }

  const target = edge.target;
  const targetNode = graph.getNode(target.id);
  const port = targetNode.getPortById(target.port);
  const targetCenterPos = targetNode.getPos();
  const targetSize = targetNode.getSize();
  const targetPos = {
    x: targetCenterPos.x - targetSize.width / 2,
    y: targetCenterPos.y - targetSize.height / 2 + port.y,
  }

  let control1, control2;
  if (route.length) {
    control1 = route[0];
    control2 = route[route.length - 1]
  } else {
    control1 = targetPos;
    control2 = sourcePos;
  }

  // find the intersection between the line from source to next
  // and the circle of source port
  const point1 = getPointByDistance(sourcePos, control1, INPUT_PORT_RADIUS);
  // determine distance by port.type
  const distance = port.type === PortTypes.IN ? INPUT_PORT_RADIUS : AUDIO_PARAM_RADIUS;
  const point2 = getPointByDistance(targetPos, control2, distance);
  return {
    sourcePoint: roundPoint(point1),
    targetPoint: roundPoint(point2)
  }
}

const createArrowHeadPath = (sourcePoint, targetPoint, route) => {
  const lastMiddlePoint = route && route.length
    ? route[route.length - 1]
    : sourcePoint;

  const angle = calcAngleRadian(lastMiddlePoint, targetPoint);
  const segments = [];
  let segment;

  segment = createSegment('M', targetPoint);
  segments.push(segment);

  segment = createSegment('L', {
    x: targetPoint.x - ARROW_HEAD_SIZE * Math.cos(-angle - Math.PI / 6),
    y: targetPoint.y - ARROW_HEAD_SIZE * Math.sin(-angle - Math.PI / 6),
  });
  segments.push(segment);

  segment = createSegment('L', {
    x: targetPoint.x - ARROW_HEAD_SIZE * Math.cos(-angle + Math.PI / 6),
    y: targetPoint.y - ARROW_HEAD_SIZE * Math.sin(-angle + Math.PI / 6),
  });
  segments.push(segment);

  segments.push('Z');

  return segments.join(' ');
}

/** For debug */
const drawCircle = (canvas, point, opt) => {
  opt = opt || {};
  const radius = opt.radius || 3;

  const controlPoint = new fabric.Circle({
    radius: radius,
    fill: opt.fill || 'black',
    top: point.y - radius,
    left: point.x - radius,
  })
  canvas.add(controlPoint)
}

// const getTargetPoint = (graph, edge, route) => {
//   const target = edge.target;

//   const node = graph.getNode(target.id);
//   const port = node.getPortById(target.port);

//   const pos = node.getPos();
//   const size = node.getSize();
//   const targetPos = {
//     x: pos.x - size.width/2,
//     y: pos.y - size.height/2 + port.y,
//   }

//   const prev = route[route.length - 1];
//   // find the intersection between the line from source to next
//   // and the circle of source port
//   return roundPoint({
//     x: pos.x - size.width/2,
//     y: pos.y - size.height/2 + port.y,
//   })
// }

/**
 * Create a path by using all points.
 */
// const createPath = (controlPoints) => {
//   const segments = [];

//   segments.push(createSegment('M', controlPoints[0]));
//   segments.push(createCurve(controlPoints))
//   return segments.join(' ')
// }

/**
 * Create a path from source to target. For better look, round the path.
 * @credit inspired by https://github.com/clientIO/joint/blob/master/src/connectors/rounded.mjs
 */
const createRoundedPath = (sourcePoint, targetPoint, route) => {

  // const offset = 10;
  const segments = [];
  let segment;

  segment = createSegment('M', sourcePoint)
  segments.push(segment);

  const _13 = 1 / 3;
  const _23 = 2 / 3;

  let curr;
  let prev, next;
  let roundedStart, roundedEnd;
  let control1, control2;

  for (let index = 0, n = route.length; index < n; index++) {

    curr = route[index];

    prev = route[index - 1] || sourcePoint;
    next = route[index + 1] || targetPoint;

    roundedStart = getMiddle(prev, curr)
    roundedEnd = getMiddle(curr, next)

    control1 = { x: (_13 * roundedStart.x) + (_23 * curr.x), y: (_23 * curr.y) + (_13 * roundedStart.y) };
    control2 = { x: (_13 * roundedEnd.x) + (_23 * curr.x), y: (_23 * curr.y) + (_13 * roundedEnd.y) };

    segment = createSegment('L', roundedStart);
    segments.push(segment);

    segment = createCurve([control1, control2, roundedEnd]);
    segments.push(segment);
  }

  segment = createSegment('L', targetPoint);
  segments.push(segment);

  return segments.join(' ');

}

const createSegment = (action, point) => {
  return action + ' ' + point.x + ' ' + point.y;
}

const createCurve = (points) => {
  if (points.length !== 3) {
    throw new Error('should be 3 points but got ', points.length);
  }
  const parts = [];
  parts.push('C')
  points.forEach(point => {
    parts.push(point.x);
    parts.push(point.y);
  })
  return parts.join(' ')
}

const getMiddle = (p1, p2) => {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  }
}
