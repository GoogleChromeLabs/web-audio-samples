import { fabric } from 'fabric';
import { computeNodeColor } from "./computeNodeColor";
import { LEFT_TEXT_INDENT, LEFT_SIDE_TOP_PADDING, INPUT_PORT_RADIUS, INPUT_PORT_COLOR, OUTPUT_PORT_COLOR, AUDIO_PARAM_RADIUS, PARAM_PORT_COLOR, PORT_PADDING } from './graphStyle';
import { PortTypes } from '../graph/PortTypes';

/**
 * @typedef {import('../graph/NodeWithPort').default} Node
 */

/**
 * Use fabric.js to draw the node and text.
 * @param {!fabric.Canvas} canvas
 * @param {!Node} node
 */
export const drawNode = (canvas, node) => {
  const pos = node.getPos();
  const size = node.getSize();

  const elements = [];

  const nodeBackground = new fabric.Rect({
    fill: computeNodeColor(node.type),
    width: size.width,
    height: size.height,
    rx: 5,
    ry: 5,
  });
  elements.push(nodeBackground);

  const nodeLabelText = new fabric.Text(node.nodeLabel, {
    fontSize: 14,
    fontFamily: "Segoe UI, sans-serif",
    fill: '#fff',
    left: LEFT_TEXT_INDENT,
    top: LEFT_SIDE_TOP_PADDING + PORT_PADDING,
  })
  elements.push(nodeLabelText)

  node.getPorts().forEach(port => {
    elements.push(createPortElement(port, size));
  })

  const offsetX = getOffsetXDueToPorts(node);
  // use a group to hold labels, ports.
  // so the position of children can be relative
  const group = new fabric.Group(elements, {
    id: node.id,
    // round the position such that text will be not blurry
    left: Math.round(pos.x - size.width / 2 - offsetX),
    top: Math.round(pos.y - size.height / 2),
    hasRotatingPoint: false,
    hasControls: false,
    selectionBackgroundColor: 'orange',
    hoverCursor: "pointer",
  })
  canvas.add(group);

  return group;
}

/**
 * Update the position of the group that contains node and text.
 * @param {!fabric.Group} nodeGroup
 * @param {!Node} node
 */
export const updateNode = (nodeGroup, node) => {
  const pos = node.getPos();
  const size = node.getSize();

  const offsetX = getOffsetXDueToPorts(node);

  // round the position such that text will be not blurry
  nodeGroup.set({
    left: Math.round(pos.x - size.width / 2 - offsetX),
    top: Math.round(pos.y - size.height / 2),
  })
  nodeGroup.setCoords();

  return nodeGroup;
}

const getOffsetXDueToPorts = (node) => {
  // adding ports on the left side of the node will add some offset.
  // since all the objects of the node are rendered as a group,
  // the position of the group should minus this offset to make
  // sure all the objects are still at the right position
  let offsetX = 0;
  node.getPorts().forEach(port => {
    if (port.type === PortTypes.IN) {
      offsetX = INPUT_PORT_RADIUS;
    } else if (port.type === PortTypes.PARAM && offsetX === 0) {
      offsetX = AUDIO_PARAM_RADIUS;
    }
  })
  return offsetX;
}

const createPortElement = (port, size) => {
  let top, left;
  let circle, label;

  switch (port.type) {
    case PortTypes.IN:
      top = LEFT_SIDE_TOP_PADDING;
      left = -INPUT_PORT_RADIUS;
      circle = new fabric.Circle({
        radius: INPUT_PORT_RADIUS,
        fill: INPUT_PORT_COLOR,
        top,
        left,
        stroke: 'black',
        strokeWidth: 1,
      });
      label = new fabric.Text(port.text, {
        fontSize: 14,
        fontFamily: "Segoe UI, sans-serif",
        fill: 'black',
        top: top + INPUT_PORT_RADIUS / 4,
        left: left + 6,
      });
      break;
    case PortTypes.OUT:
      top = size.height / 2 - INPUT_PORT_RADIUS;
      left = size.width - INPUT_PORT_RADIUS;
      circle = new fabric.Circle({
        radius: INPUT_PORT_RADIUS,
        fill: OUTPUT_PORT_COLOR,
        top,
        left,
        stroke: 'black',
        strokeWidth: 1,
      });
      label = new fabric.Text(port.text, {
        fontSize: 14,
        fontFamily: "Segoe UI, sans-serif",
        fill: 'black',
        left: left + 6,
        top: top + INPUT_PORT_RADIUS / 4,
      });
      break;
    case PortTypes.PARAM:
      circle = new fabric.Circle({
        radius: AUDIO_PARAM_RADIUS,
        fill: PARAM_PORT_COLOR,
        top: (port.y || 0) - AUDIO_PARAM_RADIUS,
        left: 0 - AUDIO_PARAM_RADIUS,
        stroke: 'black',
        strokeWidth: 1,
      });

      label = new fabric.Text(port.text, {
        fontSize: 12,
        fontFamily: "Segoe UI, sans-serif",
        fill: '#eee',
        left: LEFT_TEXT_INDENT,
        top: (port.y || 0) - AUDIO_PARAM_RADIUS - 2,
      });
      break;
    default:
      throw new Error('should not reach here')
  }

  return new fabric.Group([circle, label], {

  });
}


/**
 * Use native context API.
 * @deprecated
 */
export const drawNodeNativeWay = (context, node) => {
  const pos = node.getPos();
  const size = node.getSize();

  context.fillStyle = computeNodeColor(node.type);
  context.fillRect(pos.x, pos.y, size.width, size.height);

  context.font = "14px Georgia";  // remember to be the same size of textSandbox.css
  context.fillStyle = 'red';
  console.log(node.nodeLabel)
  context.fillText(node.nodeLabel, pos.x, pos.y + 14);
}
