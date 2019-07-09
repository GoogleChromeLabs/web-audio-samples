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


 /**
 * Computes the label for a node.
 * @param {number} contextId
 * @param {number} nodeId
 * @return {string}
 */
export const computeNodeGraphId = (contextId, nodeId) => {
  return 'c' + contextId + 'n' + nodeId;
};

export const computeInPortLabel = (contextId, nodeId, portIndex) => {
  return computeNodeGraphId(contextId, nodeId) + 'input' + portIndex;
}

export const computeOutPortLabel = (contextId, nodeId, portIndex) => {
  return computeNodeGraphId(contextId, nodeId) + 'output' + portIndex;
}

export const computeAudioParamPortLabel = (contextId, nodeId, name) => {
  return computeNodeGraphId(contextId, nodeId) + '$param$' + name;
}

export const computeNodeLabel = (nodeType, nodeId) => {
  return nodeType + ' ' + nodeId;
}

export const computeEdgeLabel = (sourcePortLabel, destinationPortLabel) => {
  return sourcePortLabel + '|' + destinationPortLabel;
}