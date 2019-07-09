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
import { getRandomGeneratorWithSeed } from '../util/random';
import { isEmptyArray } from '../util/util';
import { DEFAULT_NODE_ATTR, NODE_ATTRS } from './constants';

const NODE_TYPES = Object.keys(NODE_ATTRS);
const NODE_TYPES_EXCEPT_DESTINATION = NODE_TYPES.filter(type => type !== 'AudioDestination');
const DESTINATION_NODE_ID = 'dest'

const {rand, randInt, randChoice, randBumps} = getRandomGeneratorWithSeed('small');

export default class RandomGraph {

  constructor(messager) {
    this._count = 0;
    this._maxLevels = 6;  // the number of levels from left to right
    this._maxNodesPerLevel = 6;  // the number of nodes per level
    this._nodeIdsByLevel = {};  // Object<level, Array<nodeId>>
    this._nodes = {};   // Object<nodeId, Node>, to find node easier by id

    this._messager = messager;
  }

  addRandomNodesAndLinks(num) {
    if (this._manualMode) {
      return;  // do nothing
    }

    this._updateMaxLevelByTotalNum(this._count + num);

    // add nodes based on Gaussian
    const nodesPerLevels = this._getRandomNodesByGausian(num)
    const newNodes = [];
    nodesPerLevels.forEach((val, level) => {
      for (let i = 0; i < val; i++) {
        const nodeIds = this._nodeIdsByLevel[level];
        if (nodeIds && nodeIds.length > this._maxNodesPerLevel) {
          return;  // do not add more node to this level
        }
        this._count += 1;
        const id = '' + this._count;
        const node = this._getRandomNode(id);
        node.level = level;
        this._nodes[id] = node;
        newNodes.push(node);
        this._messager._addNode(node.nodeType, node.nodeId, node)
        if (!this._nodeIdsByLevel[level]) {
          this._nodeIdsByLevel[level] = [];
        }
        this._nodeIdsByLevel[level].push(id);
      }
    })
    console.log('added nodes:', newNodes.length)

    // add links; a link can only point to the next two levels of nodes
    let numOfAddedLinks = 0;
    newNodes.forEach(source => {
      const numberOfLinks = Math.max(1, Math.ceil(rand() * 3));
      for (let i = 0; i < numberOfLinks; i++) {
        const target = this._getRandomTarget(source);
        if (target && this._addRandomLinkTypeToPair(source, target)) {
          numOfAddedLinks++;
        }
      }
    })
    console.log('added edges:', numOfAddedLinks)

    // add a destination node and add several links to it
    this._messager._addNode('AudioDestination', DESTINATION_NODE_ID)
    this._nodes[DESTINATION_NODE_ID] = this._getNodeByType('AudioDestination', DESTINATION_NODE_ID)
    this._connectLastLevelNodesToDestination(DESTINATION_NODE_ID);
  }

  removeRandomNodesAndLinks(num) {
    if (this._manualMode) {
      return;  // do nothing
    }

    // here, I just delete the nodes, the links should be automatically removed
    // this might change if DevTool can receive disconnect message
    // remove nodes based on Gaussian
    const nodesPerLevels = this._getRandomNodesByGausian(num)
    let numOfRemovedNodes = 0;
    nodesPerLevels.forEach((val, level) => {
      for (let i = 0; i < val; i++) {
        const nodeIds = this._nodeIdsByLevel[level];
        if (!nodeIds || nodeIds.length === 0) {
          return;  // do not remove node from this level
        }
        const nodeId = randChoice(nodeIds);
        delete this._nodes[nodeId];
        const idx = nodeIds.indexOf(nodeId);
        this._nodeIdsByLevel[level].splice(idx, 1);
        numOfRemovedNodes++;
        this._messager._removeNode(nodeId);
      }
    })
    console.log('removed nodes:', numOfRemovedNodes)

    this._connectLastLevelNodesToDestination(DESTINATION_NODE_ID);
  }

  _updateMaxLevelByTotalNum(total) {
    const levelsPerChunk = 6;
    const averageNodePerLevel = 4;
    // for example, given 0~24 nodes we use 6 levels; given 24-48 nodes, we use 12 levels
    const chunks = Math.ceil(total / (levelsPerChunk * averageNodePerLevel));
    this._maxLevels = Math.max(1, chunks) * levelsPerChunk;
    console.log(this._maxLevels, this._count)
  }

  /**
   * Generate nodes randomly for each level.
   * The total number is not exactly the given num.
   * @TODO make sure that it generates the exact number of nodes
   */
  _getRandomNodesByGausian(num) {
    const values = randBumps(this._maxLevels, 3);
    // console.log(values)
    const sum = values.reduce((res, a) => res + a, 0);
    return values.map(val => Math.ceil(val / sum * num));
  }

  _getRandomNode(nodeId) {
    const nodeType = randChoice(NODE_TYPES_EXCEPT_DESTINATION)
    return this._getNodeByType(nodeType, nodeId);
  }

  _getNodeByType(nodeType, nodeId) {
    return defaults({nodeType, nodeId}, NODE_ATTRS[nodeType], DEFAULT_NODE_ATTR)
  }

  /**
   * Find a random target within the next two levels from source.
   * @param {!Object} source 
   * @return {Node | null}
   */
  _getRandomTarget(source) {
    const level = source.level;
    // have a higher chance to find in the next level than next-next level
    const shouldFindInNextLevel = rand() < 0.6;

    if (shouldFindInNextLevel) {
      return this._tryTargetInLevel(level+1) || this._tryTargetInLevel(level+2);
    } else {
      return this._tryTargetInLevel(level+2) || this._tryTargetInLevel(level+1);
    }
  }
  
  _tryTargetInLevel(level) {
    const nodeIds = this._nodeIdsByLevel[level];
    if (!isEmptyArray(nodeIds)) {
      let maxRetry = nodeIds.length + 1;
      while (maxRetry > 0) {
        const nodeId = randChoice(nodeIds)
        const node = this._nodes[nodeId];
        // AudioBufferSource cannot be a target
        if (node.nodeType !== 'AudioBufferSource') {
          return node;
        }
        
        maxRetry--;
      }
    }
  }

  /**
   * @FIXME Just find the current last level and connect to destination
   * No need to worry about whether a link is duplicated or should be removed
   * This is because 1) when we add a link, it automatically de-duplicates,
   * 2) when we remove a node, the links will be automatically removed.
   */
  _connectLastLevelNodesToDestination(targetId) {
    const target = this._nodes[targetId];
    for (let level = this._maxLevels; level >= 0; level--) {
      const nodeIds = this._nodeIdsByLevel[level];
      if (!isEmptyArray(nodeIds)) {
        nodeIds.forEach(nodeId => {
          const source = this._nodes[nodeId];
          this._addRandomLinkTypeToPair(source, target)
        })
        break;
      }
    }
  }

  /**
   * @return true if add a link, otherwise false
   */
  _addRandomLinkTypeToPair(source, target) {
    let addNodeToNode = true;

    if (target.numberOfInputs && target.audioParamNames.length) {
      const totalInputParam = target.numberOfInputs + target.audioParamNames.length;
      const ratio = target.numberOfInputs / totalInputParam;
      addNodeToNode = (rand() <= ratio);
    } else if (target.numberOfInputs) {
      addNodeToNode = true;
    } else if (target.audioParamNames.length) {
      addNodeToNode = false;
    } else {
      // target might be AudioBufferSource, skip
      return false;
    }

    if (addNodeToNode) {
      this._messager._addNodeToNodeLink(source.nodeId, randInt(source.numberOfOutputs),
          target.nodeId, randInt(target.numberOfInputs));
    } else {
      this._messager._addNodeToParamLink(source.nodeId, randInt(source.numberOfOutputs),
          target.nodeId, randChoice(target.audioParamNames))
    }
    return true;
  }

}