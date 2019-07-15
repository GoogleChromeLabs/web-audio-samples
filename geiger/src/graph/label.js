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
 * Generates the port id for the input of node.
 * @param {string} nodeId
 * @param {string | number} inputIndex
 * @return {string}
 */
export const generateInputPortId = (nodeId, inputIndex) => {
  return `${nodeId}-input-${inputIndex || 0}`;
};

/**
 * Generates the port id for the output of node.
 * @param {string} nodeId
 * @param {string | number} outputIndex
 * @return {string}
 */
export const generateOutputPortId = (nodeId, outputIndex) => {
  return `${nodeId}-output-${outputIndex || 0}`;
};

/**
 * Generates the port id for the param of node.
 * @param {string} nodeId
 * @param {string} paramId
 * @return {string}
 */
export const generateParamPortId = (nodeId, paramId) => {
  return `${nodeId}-param-${paramId}`;
};

/**
 * Generates the label for the node.
 * @param {string} nodeType
 * @param {string} nodeId
 * @return {string}
 */
export const generateNodeLabel = (nodeType, nodeId) => {
  // To make the label concise, remove the suffix "Node" from the nodeType.
  if (nodeType.endsWith('Node')) {
    nodeType = nodeType.slice(0, nodeType.length-4);
  }
  return `${nodeType} ${nodeId}`;
};

/**
 * Generates the edge id using port ids of source and destination.
 * @param {string} sourcePortId
 * @param {string} destinationPortId
 * @return {string}
 */
export const generateEdgeId = (sourcePortId, destinationPortId) => {
  return `${sourcePortId}->${destinationPortId}`;
};
