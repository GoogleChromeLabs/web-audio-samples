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
import { EdgeTypes } from "./EdgeTypes";
import { computeNodeGraphId, computeEdgeLabel, computeOutPortLabel, computeInPortLabel, computeAudioParamPortLabel } from "./label";


export default class Edge extends Cell {
  constructor(message, type) {
    super();

    this.id = null;
    this.type = type;

    this.source = null;  // {id: NodeId, port: PortId}
    this.target = null;  // {id: NodeId, port: PortId}

    this._points = null;  // control points

    this._init(message);
  }

  getPoints() {
    return this._points;
  }

  setPoints(points) {
    this._points = points;
  }

  toString() {
    return [this.id, JSON.stringify(this.source), JSON.stringify(this.target)].join(',')
  }

  shouldRender() {
    return !!this._points;
  }

  _init(message) {
    const contextId = message.contextId;

    if (!message.sourceNodeId || !message.destinationNodeId) {
      throw new Error('Undefined node message: ' + JSON.stringify(message));
    }

    this.source = {
      id: computeNodeGraphId(contextId, message.sourceNodeId),
      port: computeOutPortLabel(contextId, message.sourceNodeId, message.fromChannel)
    }

    if (this.type === EdgeTypes.NODE_TO_NODE) {
      this.target = {
        id: computeNodeGraphId(contextId, message.destinationNodeId),
        port: computeInPortLabel(contextId, message.destinationNodeId, message.toChannel)
      }
    } else if (this.type === EdgeTypes.NODE_TO_PARAM) {
      this.target = {
        id: computeNodeGraphId(contextId, message.destinationNodeId),
        port: computeAudioParamPortLabel(contextId, message.destinationNodeId, message.destinationParamName)
      }
    } else {
      throw new Error('Unknown edge type: ' + this.type);
    }

    this.id = computeEdgeLabel(this.source.port, this.target.port);
  }


}