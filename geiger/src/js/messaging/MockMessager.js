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

import defaults from 'lodash.defaults';
import Events from "../util/Events";
import RandomGraph from './RandomGraph';
import { NODE_ATTRS, DEFAULT_NODE_ATTR } from './constants';

/**
 * Mock the communication between web application and the dev tool
 */
export default class MockMessager extends Events {

  constructor() {
    super();

    this._manualMode = true;

    this._randomGraph = null;
  }

  /**
   * Mock the node creation, connection, etc.
   */
  startMock(opt) {
    // the layout is the same as 
    // https://raw.githubusercontent.com/google/audion/master/wiki_content/reset%20button.png
    // except the first Oscillator is replaced with AudioBufferSource
    
    opt = defaults(opt, {manualMode: false});
    this._manualMode = opt.manualMode

    if (opt.manualMode) {
      this._startManualMock(opt);
    } else {
      this._randomGraph = new RandomGraph(this);
      this._startAutoMock(opt);
    }
  }

  addRandomNodesAndLinks(num) {
    if (this._manualMode) {
      return;  // do nothing
    }

    this._randomGraph.addRandomNodesAndLinks(num);
  }

  removeRandomNodesAndLinks(num) {
    if (this._manualMode) {
      return;  // do nothing
    }

    this._randomGraph.removeRandomNodesAndLinks(num);
  }

  _startManualMock(opt) {

    opt = defaults(opt, {allowCyclic: false});

    // nodes
    this._addNode('AudioBufferSource', 's0')
    this._addNode('Gain', 'g0')
    this._addNode('Gain', 'g1')
    this._addNode('Oscillator', 'o0')
    this._addNode('Oscillator', 'o1')
    this._addNode('Gain', 'g2')
    this._addNode('Gain', 'g3')
    this._addNode('Gain', 'g4')
    this._addNode('BiquadFilter', 'b0')
    this._addNode('AudioDestination', 'd0')

    // links
    // from source to gain
    this._addNodeToNodeLink('s0', '0', 'g0', '0')
    this._addNodeToNodeLink('s0', '0', 'g1', '0')
    this._addNodeToNodeLink('s0', '0', 'g4', '0')

    // from gain to Oscillator
    this._addNodeToParamLink('g0', '0', 'o0', 'frequency')
    this._addNodeToParamLink('g1', '0', 'o1', 'frequency')
    
    // from Oscillator to gain
    this._addNodeToNodeLink('o0', '0', 'g2', '0')
    this._addNodeToNodeLink('o1', '0', 'g3', '0')
    
    // from gain to BiquadFilter
    this._addNodeToNodeLink('g2', '0', 'b0', '0')
    this._addNodeToNodeLink('g3', '0', 'b0', '0')
    this._addNodeToParamLink('g4', '0', 'b0', 'detune')

    // backward edge, to make the graph cyclic
    if (opt.allowCyclic) {
      this._addNodeToParamLink('g3', '0', 'o1', 'detune')
    }

    // from gain and BiquadFilter to destination
    this._addNodeToNodeLink('b0', '0', 'd0', '0')
    this._addNodeToNodeLink('g4', '0', 'd0', '0')
  }

  _startAutoMock(opt) {
    this.addRandomNodesAndLinks(20)
  }


  //// Trigger events

  _addNode(nodeType, nodeId, attrs) {
    attrs = defaults(attrs, NODE_ATTRS[nodeType], DEFAULT_NODE_ATTR);
    this.trigger('KNodeCreated', {...DEFAULT_NODE_ATTR, nodeType, nodeId, ...attrs})
  }

  _removeNode(nodeId) {
    this.trigger('kNodeDestroyed', {...DEFAULT_NODE_ATTR, nodeId});
  }

  _addNodeToNodeLink(sourceNodeId, fromChannel, destinationNodeId, toChannel) {
    this.trigger('KNodesConnected', {
      contextId: 1,
      sourceNodeId,
      fromChannel,
      destinationNodeId,
      toChannel
    })
  }

  _addNodeToParamLink(sourceNodeId, fromChannel, destinationNodeId, destinationParamName) {
    this.trigger('kNodeParamConnected', {
      contextId: 1,
      sourceNodeId,
      fromChannel,
      destinationNodeId,
      destinationParamName
    })
  }
}
