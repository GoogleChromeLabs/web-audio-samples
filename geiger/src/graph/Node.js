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
import {computeNodeId, computeNodeLabel} from './label';

/**
 * @typedef {Object} NodeCreationMessage
 * @property {string} contextId
 * @property {string} nodeId
 * @property {string} nodeType
 */

/**
 * @typedef {Object} Size
 * @property {number} width - The width
 * @property {number} height - The height
 */

/**
 * @typedef {Object} Point
 * @property {number} x
 * @property {number} y
 */

/**
 * A general Node.
 * @class
 * @extends Cell
 */
export default class Node extends Cell {
  /**
   * @constructor
   * @param {!NodeCreationMessage} message
   */
  constructor(message) {
    super();

    this.id = computeNodeId(message.contextId, message.nodeId);

    let nodeType = message.nodeType;
    if (nodeType.endsWith('Node')) {
      nodeType = nodeType.slice(0, nodeType.length-4);
    }
    this.type = nodeType;
    this.nodeLabel = computeNodeLabel(nodeType, message.nodeId);

    this._size = null;
    this._position = null; // position of the center
  }

  /** @return {Size} */
  getSize() {
    return this._size;
  }

  /**
   * @param {!Size} size
   * @return {!Cell} - To be chainable
   */
  setSize(size) {
    this._size = size;
    return this;
  }

  /** @return {Point} */
  getPosition() {
    return this._position;
  }

  /**
   * @param {!Point} position
   * @return {!Cell} - To be chainable
   */
  setPosition(position) {
    this._position = position;
    return this;
  }

  shouldRender() {
    return !!this._position;
  }
}
