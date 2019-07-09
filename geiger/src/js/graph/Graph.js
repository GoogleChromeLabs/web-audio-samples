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

import Events from "../util/Events";
import Node from "./Node";
import Collection from "../util/Collection";


export default class Graph extends Events {
    constructor() {
        super();

        this._nodes = new Collection(null, {trackExit: true});
        this._edges = new Collection(null, {trackExit: true});
        
        /** @private {!Object<nodeId, !Object<Edge.id, true>>} */
        this._out = {}
        
        /** @private {!Object<nodeId, !Object<Edge.id, true>>} */
        this._in = {}
    }

    addCell(cell) {
        if (cell instanceof Node) {
            this.addNode(cell)
        } else {
            this.addEdge(cell)
        }
    }

    addNode(node) {
        this._nodes.add(node.id, node);
        this._shouldRedraw();
    }

    /** When remove a node, remove all related edges as well. */
    removeNodeAndEdges(nodeId) {
        this.removeNode(nodeId);
        this.removeEdgesOfNode(nodeId);
    }

    removeNode(nodeId) {
        this._nodes.remove(nodeId);
        this._shouldRedraw();
    }

    removeEdgesOfNode(nodeId) {
        const outEdges = this._out[nodeId];
        if (outEdges) {
            Object.keys(outEdges).forEach(edgeId => {
                this.removeEdge(edgeId)
            })
        }
        const inEdges = this._in[nodeId];
        if (inEdges) {
            Object.keys(inEdges).forEach(edgeId => {
                this.removeEdge(edgeId)
            })
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
    }

    removeEdge(edgeId) {
        this._edges.remove(edgeId);
        this._shouldRedraw();
    }

    getNodes() {
        return this._nodes.values();
    }

    getNodesToRemove() {
        return this._nodes.exit();
    }

    getNode(nodeId) {
        return this._nodes.get(nodeId)
    }

    getEdges() {
        return this._edges.values();
    }

    getEdgesToRemove() {
        return this._edges.exit();
    }

    getEdge(edgeId) {
        return this._edges.get(edgeId);
    } 

    _shouldRedraw() {
        this.trigger('shouldRedraw');
    }

    renderEnd() {
        this._nodes.clearEnterExit();
        this._edges.clearEnterExit();
    }
}
