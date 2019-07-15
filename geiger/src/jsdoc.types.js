
/** @typedef {import("./graph/PortTypes.js").PortTypes} PortTypes */

// common types

/**
 * @typedef {Object} Size
 * @property {!number} width - The width
 * @property {!number} height - The height
 */

/**
 * @typedef {Object} BoundingBox
 * @property {!number} width - The width
 * @property {!number} height - The height
 */

/**
 * @typedef {Object} Point
 * @property {!number} x
 * @property {!number} y
 */

/**
 * @typedef {Object} NodeLayout
 * @property {!number} inputPortSectionHeight
 * @property {!number} outputPortSectionHeight
 * @property {!number} lastParamY
 * @property {!number} maxTextLength
 * @property {!number} totalHeight
 */

/**
 * @typedef {Object} Port
 * @property {!string} id
 * @property {!PortTypes} type
 * @property {!string} text - The text label
 * @property {!number} y
 */


// Messages

/**
 * @typedef {Object} NodeCreationMessage
 * @property {!string} nodeId
 * @property {!string} nodeType
 * @property {!number} numberOfInputs
 * @property {!number} numberOfOutputs
 */

/**
 * @typedef {Object} ParamCreationMessage
 * @property {!string} paramId
 * @property {!string} paramType
 * @property {!string} nodeId
 */

/**
 * @typedef {Object} NodesConnectionMessage
 * @property {!string} sourceId
 * @property {!string} destinationId
 * @property {number=} sourceOutputIndex
 * @property {number=} destinationInputIndex
 */

/**
 * @typedef {Object} NodesDisconnectionMessage
 * @property {!string} sourceId
 * @property {?string=} destinationId
 * @property {number=} sourceOutputIndex
 * @property {number=} destinationInputIndex
 */

/**
 * @typedef {Object} NodeParamConnectionMessage
 * @property {!string} sourceId
 * @property {!string} destinationId - The destination AudioNode id
 * @property {number=} sourceOutputIndex
 * @property {!string} destinationParamId
 */

/**
 * @typedef {NodeParamConnectionMessage} NodeParamDisconnectionMessage
 */
