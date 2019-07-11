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

import Cell from './Cell';
import {EdgeTypes} from './EdgeTypes';
import {computeNodeId, computeEdgeId, computeOutPortId,
  computeInPortId, computeAudioParamPortId} from './label';

/**
 * @typedef {Object} NodesConnection
 * @property {string} sourceNodeId
 * @property {string} destinationNodeId
 * @property {string} fromChannel
 * @property {string} toChannel
 */

/**
 * @typedef {Object} NodeParamConnection
 * @property {string} sourceNodeId
 * @property {string} destinationNodeId
 * @property {string} fromChannel
 * @property {string} destinationParamName
 */

/**
 * @typedef {NodesConnection | NodeParamConnection} ConnectionMessage
 */

/**
 * @typedef {Object} Source
 * @property {string} id - The node id.
 * @property {string} port - The port id.
 * @typedef {Source} Target
 */

/**
 * @typedef {Object} Point
 * @property {number} x
 * @property {number} y
 */

/**
 * @class
 * @extends Cell
 */
export default class Edge extends Cell {
  /**
   * @constructor
   * @param {!ConnectionMessage} message
   * @param {!EdgeTypes} type
   */
  constructor(message, type) {
    super();

    this.id = null;
    this.type = type;

    /** @type {!Source} */
    this.source = null;
    /** @type {!Target} */
    this.target = null;

    /**
     * Control points to draw the curve of the edge.
     * @type {Array<Point>}
     */
    this._points = null;

    this._initialize(message);
  }

  getPoints() {
    return this._points;
  }

  setPoints(points) {
    this._points = points;
  }

  toString() {
    return [this.id, JSON.stringify(this.source),
      JSON.stringify(this.target)].join(',');
  }

  shouldRender() {
    return !!this._points;
  }

  /**
   * @param {!ConnectionMessage} message
   */
  _initialize(message) {
    const contextId = message.contextId;

    if (!message.sourceNodeId || !message.destinationNodeId) {
      throw new Error('Undefined node message: ' + JSON.stringify(message));
    }

    this.source = {
      id: computeNodeId(contextId, message.sourceNodeId),
      port: computeOutPortId(contextId, message.sourceNodeId,
          message.fromChannel),
    };

    if (this.type === EdgeTypes.NODE_TO_NODE) {
      this.target = {
        id: computeNodeId(contextId, message.destinationNodeId),
        port: computeInPortId(contextId, message.destinationNodeId,
            message.toChannel),
      };
    } else if (this.type === EdgeTypes.NODE_TO_PARAM) {
      this.target = {
        id: computeNodeId(contextId, message.destinationNodeId),
        port: computeAudioParamPortId(contextId, message.destinationNodeId,
            message.destinationParamName),
      };
    } else {
      throw new Error('Unknown edge type: ' + this.type);
    }

    this.id = computeEdgeId(this.source.port, this.target.port);
  }
}
