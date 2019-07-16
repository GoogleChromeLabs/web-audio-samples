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
import NodeWithPort from './NodeWithPort';
import Edge, {generateEdgePortIdsByData} from './Edge';
import {EdgeTypes} from './EdgeTypes';

// /<reference path="../jsdoc.types.js" />

/**
 * A module that tracks all the nodes and edges.
 *
 * @class Graph
 * @extends Events
 */
export default class Graph extends Events {
  /**
   * @constructor
   * @param {!string} contextId
   */
  constructor(contextId) {
    super();

    this.contextId = contextId;

    /** @type {Collection<NodeWithPort>} */
    this._nodes = new Collection(null, {trackExit: true});
    /** @type {Collection<Edge>} */
    this._edges = new Collection(null, {trackExit: true});

    // Cache the removed nodes/edges in current batch.
    /** @type {Array<NodeWithPort>} */
    this._removed_nodes = [];
    /** @type {Array<Edge>} */
    this._removed_edges = [];

    /**
     * For each node ID, keep track of all out-bound edge IDs.
     * @type {!Object<string, !Object<string, true>>}
     * @private
     */
    this._outbound_edge_map = {};

    /**
     * For each node ID, keep track of all in-bound edge IDs.
     * @type {!Object<string, !Object<string, true>>}
     * @private
     */
    this._inbound_edge_map = {};
  }

  /**
   * Add a node to the graph.
   * @param {!NodeCreationData} data
   */
  addNode(data) {
    const node = new NodeWithPort(data);
    this._nodes.add(data.nodeId, node);
    this._shouldRedraw();
  }

  /**
   * Remove a node by id and all related edges.
   * @param {!string} nodeId
   */
  removeNode(nodeId) {
    this._nodes.remove(nodeId);
    this._removeEdgesOfNode(nodeId);
    this._shouldRedraw();
  }

  /**
   * Add a param to the node.
   * @param {!ParamCreationData} data
   */
  addParam(data) {
    const node = this.getNodeById(data.nodeId);
    node.addParamPort(data.paramId, data.paramType);
    this._shouldRedraw();
  }

  /**
   * Remove a param by paramId from Node.
   * @param {!string} paramId
   * @param {!string} nodeId
   */
  removeParam(paramId, nodeId) {
    const node = this.getNodeById(nodeId);
    node.removeParamPort(paramId);
    this._shouldRedraw();
  }

  /**
   * Add a Node-to-Node connection to the graph.
   * @param {!NodesConnectionData} data
   */
  addNodesConnection(data) {
    const edge = new Edge(data, EdgeTypes.NODE_TO_NODE);
    this._addEdge(edge);
  }

  /**
   * Remove a Node-to-Node connection from the graph.
   * @param {!NodesDisconnectionData} data
   */
  removeNodesConnection(data) {
    if (data.destinationId) {
      // Remove the given edge.
      const {edgeId} = generateEdgePortIdsByData(data,
          EdgeTypes.NODE_TO_NODE);
      this._removeEdge(edgeId);
    } else {
      // Remove all edges from source node.
      const outEdges = this._outbound_edge_map[data.sourceId];
      if (outEdges) {
        Object.keys(outEdges).forEach((edgeId) => {
          this._removeEdge(edgeId);
        });
      }
      delete this._outbound_edge_map[data.sourceId];
    }
  }

  /**
   * Add a Node-to-Param connection to the graph.
   * @param {!NodeParamConnectionData} data
   */
  addNodeParamConnection(data) {
    const edge = new Edge(data, EdgeTypes.NODE_TO_PARAM);
    this._addEdge(edge);
  }

  /**
   * Remove a Node-to-Param connection from the graph.
   * @param {!NodeParamDisconnectionData} data
   */
  removeNodeParamConnection(data) {
    const {edgeId} = generateEdgePortIdsByData(data,
        EdgeTypes.NODE_TO_PARAM);
    this._removeEdge(edgeId);
  }

  /**
   * @param {!string} nodeId
   * @return {NodeWithPort}
   */
  getNodeById(nodeId) {
    return this._nodes.get(nodeId);
  }

  /**
   * @param {!string} edgeId
   * @return {Edge}
   */
  getEdgeById(edgeId) {
    return this._edges.get(edgeId);
  }

  /** @return {Array<NodeWithPort>} */
  getNodes() {
    return this._nodes.values();
  }

  /** @return {Array<NodeWithPort>} */
  getRemovedNodes() {
    return this._removed_nodes;
  }

  /** @return {Array<Edge>} */
  getEdges() {
    return this._edges.values();
  }

  /** @return {Array<Edge>} */
  getRemovedEdges() {
    return this._removed_edges;
  }

  // Cache the removed nodes/edges in the current batch, which will be used to
  // remove nodes/edges from canvas.
  // Start tracking changes for next batch.
  performPreRenderTasks() {
    this._removed_nodes = this._nodes.exit();
    this._removed_edges = this._edges.exit();

    // Clear the current tracked exit to track new changes in next batch.
    this._nodes.clearEnterExit();
    this._edges.clearEnterExit();
  }

  // After rendering the current batch, release the memory.
  performPostRenderTasks() {
    this._removed_nodes = [];
    this._removed_edges = [];
  }

  /**
   * Add an edge to the graph.
   * @param {!Edge} edge
   */
  _addEdge(edge) {
    const sourceId = edge.sourceId;
    // This link exists.
    if (this._outbound_edge_map[sourceId] &&
      this._outbound_edge_map[sourceId][edge.id]) return;

    this._edges.add(edge.id, edge);

    if (!this._outbound_edge_map[sourceId]) {
      this._outbound_edge_map[sourceId] = {};
    }
    this._outbound_edge_map[sourceId][edge.id] = true;

    const destinationId = edge.destinationId;
    if (!this._inbound_edge_map[destinationId]) {
      this._inbound_edge_map[destinationId] = {};
    }
    this._inbound_edge_map[destinationId][edge.id] = true;

    this._shouldRedraw();
  }

  /**
   * Remove an edge from the graph by its id.
   * Also remove the edge from inbound and outbound edge maps.
   * @param {!string} edgeId
   */
  _removeEdge(edgeId) {
    const edge = this._edges.get(edgeId);
    if (!edge) return;

    const sourceId = edge.sourceId;
    if (this._outbound_edge_map[sourceId] &&
      this._outbound_edge_map[sourceId][edgeId]) {
      delete this._outbound_edge_map[sourceId][edgeId];
    }

    const destinationId = edge.destinationId;
    if (this._inbound_edge_map[destinationId] &&
      this._inbound_edge_map[destinationId][edgeId]) {
      delete this._inbound_edge_map[destinationId][edgeId];
    }

    this._edges.remove(edgeId);
    this._shouldRedraw();
  }

  /**
   * Remove all edges of a node.
   * @param {!string} nodeId
   */
  _removeEdgesOfNode(nodeId) {
    const outEdges = this._outbound_edge_map[nodeId];
    if (outEdges) {
      Object.keys(outEdges).forEach((edgeId) => {
        this._removeEdge(edgeId);
      });
    }

    const inEdges = this._inbound_edge_map[nodeId];
    if (inEdges) {
      Object.keys(inEdges).forEach((edgeId) => {
        this._removeEdge(edgeId);
      });
    }
    delete this._outbound_edge_map[nodeId];
    delete this._inbound_edge_map[nodeId];
  }

  _shouldRedraw() {
    this.trigger('shouldRedraw');
  }
}
