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

/**
 * Computes the id for a node.
 * @param {string | number} contextId
 * @param {string} nodeId
 * @return {string}
 */
export const computeNodeId = (contextId, nodeId) => {
  return 'c' + contextId + 'n' + nodeId;
};

/**
 * Computes the id for the input of node.
 * @param {string | number} contextId
 * @param {string} nodeId
 * @param {string | number} portIndex
 * @return {string}
 */
export const computeInPortId = (contextId, nodeId, portIndex) => {
  return computeNodeId(contextId, nodeId) + 'input' + portIndex;
};

/**
 * Computes the id for the output of node.
 * @param {string | number} contextId
 * @param {string} nodeId
 * @param {string | number} portIndex
 * @return {string}
 */
export const computeOutPortId = (contextId, nodeId, portIndex) => {
  return computeNodeId(contextId, nodeId) + 'output' + portIndex;
};

/**
 * Computes the id for the param of node.
 * @param {string | number} contextId
 * @param {string} nodeId
 * @param {string} name
 * @return {string}
 */
export const computeAudioParamPortId = (contextId, nodeId, name) => {
  return computeNodeId(contextId, nodeId) + '$param$' + name;
};

/**
 * Computes the label of the node.
 * @param {string} nodeType
 * @param {string} nodeId
 * @return {string}
 */
export const computeNodeLabel = (nodeType, nodeId) => {
  return nodeType + ' ' + nodeId;
};

/**
 * Computes the id of the edge using port ids of source and destination.
 * @param {string} sourcePortId
 * @param {string} destinationPortId
 * @return {string}
 */
export const computeEdgeId = (sourcePortId, destinationPortId) => {
  return sourcePortId + '|' + destinationPortId;
};
