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

import {generateNodeLabel} from './label';

// /<reference path="../jsdoc.types.js" />

/**
 * A general Node.
 * @class
 */
export default class Node {
  /**
   * @constructor
   * @param {!NodeCreationData} data
   */
  constructor(data) {
    this.id = data.nodeId;
    this.type = data.nodeType;
    this.numberOfInputs = data.numberOfInputs;
    this.numberOfOutputs = data.numberOfOutputs;
    this.label = generateNodeLabel(data.nodeType, data.nodeId);

    this._size = null;
    this._position = null; // position of the center
  }

  /** @return {Size} */
  getSize() {
    return this._size;
  }

  /**
   * @param {!Size} size
   * @return {this}
   * @chainable
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
   * @return {this}
   * @chainable
   */
  setPosition(position) {
    this._position = position;
    return this;
  }

  shouldRender() {
    // When a node has a valid position, it should and could be rendered.
    return this._position && (typeof this._position.x !== 'undefined') &&
        (typeof this._position.y !== 'undefined');
  }
}
