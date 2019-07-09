/**
 * Copyright 2019 Google Inc.
 *
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

import Cell from "./Cell";
import { computeNodeGraphId, computeNodeLabel } from "./label";


export default class Node extends Cell {

  constructor(message) {
    super();

    this.id = computeNodeGraphId(message.contextId, message.nodeId);
    
    let nodeType = message.nodeType;
    if (nodeType.endsWith('Node')) {
      nodeType = nodeType.slice(0, nodeType.length-4);
    }
    this.type = nodeType;
    this.nodeLabel = computeNodeLabel(nodeType, message.nodeId)

    this._size = null;
    this._pos = null;   // position of the center
  }

  getSize() {
    return this._size;
  }

  setSize(size) {
    this._size = size;
  }

  getPos() {
    return this._pos;
  }

  setPos(pos) {
    this._pos = pos;
    return this;
  }

  shouldRender() {
    return !!this._pos;
  }

}