/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {EdgeTypes} from './EdgeTypes';
import {generateEdgeId, generateOutputPortId,
  generateInputPortId, generateParamPortId} from './label';

// /<reference path="../jsdoc.types.js" />

/**
 * @class
 */
export default class Edge {
  /**
   * @constructor
   * @param {!NodesConnectionMessage | NodeParamConnectionMessage} message
   * @param {!EdgeTypes} type
   */
  constructor(message, type) {
    const {edgeId, sourcePortId, destinationPortId} =
        generateEdgePortIdsByMessage(message, type);

    this.id = edgeId;
    this.type = type;
    // The source Node Id.
    this.sourceId = message.sourceId;
    // The destination Node Id.
    this.destinationId = message.destinationId;
    this.sourcePortId = sourcePortId;
    this.destinationPortId = destinationPortId;

    /**
     * Control points to draw the curve of the edge.
     * @type {Array<Point>}
     */
    this._points = null;
  }

  /**
   * @return {Array<Point>} points
   */
  getPoints() {
    return this._points;
  }

  /**
   * @param {Array<Point>} points
   */
  setPoints(points) {
    this._points = points;
  }

  toString() {
    return [this.id, JSON.stringify(this.source),
      JSON.stringify(this.destination)].join(',');
  }

  shouldRender() {
    return this._points && this._points.length > 0;
  }
}

/**
 * @param {!NodesConnectionMessage | NodeParamConnectionMessage} message
 * @param {!EdgeTypes} type
 * @return {Object<string,string>}
 */
export const generateEdgePortIdsByMessage = (message, type) => {
  if (!message.sourceId || !message.destinationId) {
    throw new Error('Undefined node message: ' + JSON.stringify(message));
  }

  const sourcePortId = generateOutputPortId(message.sourceId,
      message.sourceOutputIndex);

  let destinationPortId;
  if (type === EdgeTypes.NODE_TO_NODE) {
    destinationPortId = generateInputPortId(message.destinationId,
        message.destinationInputIndex);
  } else if (type === EdgeTypes.NODE_TO_PARAM) {
    destinationPortId = generateParamPortId(message.destinationId,
        message.destinationParamId);
  } else {
    throw new Error('Unknown edge type: ' + type);
  }

  return {
    edgeId: generateEdgeId(sourcePortId, destinationPortId),
    sourcePortId,
    destinationPortId,
  };
};
