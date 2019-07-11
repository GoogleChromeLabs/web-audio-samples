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

import Collection from '../util/Collection';
import Events from '../util/Events';
import Node from './Node';

/** @typedef {import('../graph/Edge').default} Edge */

/**
 * A module that tracks all the nodes and edges.
 *
 * @class Graph
 * @extends Events
 */
export default class Graph extends Events {
  constructor() {
    super();

    this._nodes = new Collection(null, {trackExit: true});
    this._edges = new Collection(null, {trackExit: true});

    // Cache the removed nodes/edges in current batch.
    this._removed_nodes = [];
    this._removed_edges = [];

    /**
     * For each node ID, keep track of all out-bound edge IDs.
     * @type {!Object<string, !Object<string, true>>}
     * @private
     */
    this._out = {};

    /**
     * For each node ID, keep track of all in-bound edge IDs.
     * @type {!Object<string, !Object<string, true>>}
     * @private
     */
    this._in = {};
  }

  addCell(cell) {
    if (!cell.graph) {
      cell.graph = this;
    }
    if (cell instanceof Node) {
      this.addNode(cell);
    } else {
      this.addEdge(cell);
    }
  }

  addNode(node) {
    this._nodes.add(node.id, node);
    this._shouldRedraw();
  }

  /**
   * Remove a node and its related edges.
   * @param {!string} nodeId
   */
  removeNodeAndEdges(nodeId) {
    this.removeNode(nodeId);
    this.removeEdgesOfNode(nodeId);
  }

  /**
   * Remove a node by id.
   * @param {!string} nodeId
   */
  removeNode(nodeId) {
    this._nodes.remove(nodeId);
    this._shouldRedraw();
  }

  /**
   * Remove all edges of a node.
   * @param {!string} nodeId
   */
  removeEdgesOfNode(nodeId) {
    const outEdges = this._out[nodeId];
    if (outEdges) {
      Object.keys(outEdges).forEach((edgeId) => {
        this.removeEdge(edgeId);
      });
    }

    const inEdges = this._in[nodeId];
    if (inEdges) {
      Object.keys(inEdges).forEach((edgeId) => {
        this.removeEdge(edgeId);
      });
    }
    delete this._out[nodeId];
    delete this._in[nodeId];
  }

  addEdge(edge) {
    const sourceId = edge.source.id;
    if (this._out[sourceId] && this._out[sourceId][edge.id]) {
      // This link exists.
      return;
    }
    this._edges.add(edge.id, edge);

    if (!this._out[sourceId]) {
      this._out[sourceId] = {};
    }
    this._out[sourceId][edge.id] = true;

    const targetId = edge.target.id;
    if (!this._in[targetId]) {
      this._in[targetId] = {};
    }
    this._in[targetId][edge.id] = true;

    this._shouldRedraw();
  }

  removeEdge(edgeId) {
    const edge = this._edges.get(edgeId);
    if (!edge) return;

    const sourceId = edge.source.id;
    if (this._out[sourceId] && this._out[sourceId][edgeId]) {
      delete this._out[sourceId][edgeId];
    }

    const targetId = edge.target.id;
    if (this._in[targetId] && this._in[targetId][edgeId]) {
      delete this._in[targetId][edgeId];
    }

    this._edges.remove(edgeId);
    this._shouldRedraw();
  }

  /** @return {Array<Node>} */
  getNodes() {
    return this._nodes.values();
  }

  /**
   * @param {!string} nodeId
   * @return {Node}
   */
  getNode(nodeId) {
    return this._nodes.get(nodeId);
  }

  /** @return {Array<Node>} */
  getRemovedNodes() {
    return this._removed_nodes;
  }

  /** @return {Array<Edge>} */
  getEdges() {
    return this._edges.values();
  }

  /**
   * @param {!string} edgeId
   * @return {Edge}
   */
  getEdge(edgeId) {
    return this._edges.get(edgeId);
  }

  /** @return {Array<Edge>} */
  getRemovedEdges() {
    return this._removed_edges;
  }

  // Cache the removed nodes/edges in the current batch, which will be used to
  // remove nodes/edges from canvas.
  // Start tracking changes for next batch.
  beforeRender() {
    this._removed_nodes = this._nodes.exit();
    this._removed_edges = this._edges.exit();

    // Clear the current tracked exit to track new changes in next batch.
    this._nodes.clearEnterExit();
    this._edges.clearEnterExit();
  }

  // After rendering the current batch, release the memory.
  afterRender() {
    this._removed_nodes = [];
    this._removed_edges = [];
  }

  _shouldRedraw() {
    this.trigger('shouldRedraw');
  }
}
