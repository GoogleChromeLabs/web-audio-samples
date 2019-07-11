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

import {isObject} from 'util';
import {
  AUDIO_PARAM_RADIUS, INPUT_PORT_RADIUS, LEFT_SIDE_TOP_PADDING,
  LEFT_TEXT_INDENT, TOTAL_INPUT_PORT_HEIGHT, TOTAL_PARAM_PORT_HEIGHT,
} from '../ui/graphStyle';
import {textSandbox} from '../ui/textSandbox';
import Collection from '../util/Collection';
import {computeAudioParamPortId, computeInPortId,
  computeOutPortId} from './label';
import {PortTypes} from './PortTypes';
import Node from './Node';

/**
 * @typedef {Object} NodeCreationMessage
 * @property {string} contextId
 * @property {string} nodeId
 * @property {string} nodeType
 * @property {number} numberOfInputs
 * @property {number} numberOfOutputs
 * @property {Array<string>} audioParamNames
 */

/**
 * @typedef {Object} NodeDimension
 * @property {number} inputPortSectionHeight
 * @property {number} paramPortSectionHeight
 * @property {number} maxTextLength
 * @property {number} totalHeight
 */

/**
 * @typedef {Object} Port
 * @property {string} id
 * @property {PortTypes} type
 * @property {string} text - The text label
 * @property {number} y
 */

/**
 * A node with audio params as ports.
 * @class NodeWithPort
 * @extends Node
 */
export default class NodeWithPort extends Node {
  /**
   * @constructor
   * @param {!NodeCreationMessage} message
   */
  constructor(message) {
    super(message);

    this._ports = null;

    this._initialize(message);
  }

  /**
   * @param {!string} id
   * @return {Port}
   */
  getPortById(id) {
    return this._ports.get(id);
  }

  /**
   * @param {!PortTypes} type
   * @return {Array<Port>}
   */
  getPortsByType(type) {
    return this._ports.filter((port) => port.type === type);
  }

  /**
   * Get all ports of this node.
   * @return {Array<Port>}
   */
  getPorts() {
    return this._ports.values();
  }

  /**
   * @param {!NodeCreationMessage} message
   */
  _initialize(message) {
    const dimension = this._computeNodeLayout(message);

    const inputPorts = this._prepareInputPorts(message, dimension);
    const outputPorts = this._prepareOutputPorts(message, dimension);
    const paramPorts = this._prepareParamPorts(message, dimension);

    const ports = inputPorts.concat(outputPorts, paramPorts);
    this._ports = this._createPortData(ports);

    this.setSize({
      width: dimension.maxTextLength + LEFT_TEXT_INDENT + 30,
      height: dimension.totalHeight,
    });
  }

  /**
   * Use number of inputs, outputs, and AudioParams to compute the layout
   * for text and ports.
   * @param {!NodeCreationMessage} message
   * @credit This function is mostly borrowed from Audion/
   *      `audion.entryPoints.handleNodeCreated_()`.
   *      https://github.com/google/audion/blob/master/js/entry-points/panel.js
   * @return {NodeDimension}
   */
  _computeNodeLayout(message) {
    // Even if there are no input ports, leave room for the node label.
    const inputPortSectionHeight =
        TOTAL_INPUT_PORT_HEIGHT * Math.max(1, message.numberOfInputs);
    const paramPortSectionHeight =
        TOTAL_PARAM_PORT_HEIGHT * message.audioParamNames.length;

    // Use the max of the left and right side heights as the total height.
    // Include a little padding on the left.
    const leftSideBottomPadding = message.audioParamNames.length ? 6 : 8;
    const totalHeight = Math.max(
        inputPortSectionHeight + paramPortSectionHeight +
        LEFT_SIDE_TOP_PADDING + leftSideBottomPadding,
        TOTAL_INPUT_PORT_HEIGHT * message.numberOfOutputs);

    const maxTextLength = this._computeMaxTextLength(message);

    return {
      inputPortSectionHeight,
      paramPortSectionHeight,
      maxTextLength,
      totalHeight,
    };
  }

  /**
   * Compute the max length of all text labels to get the max width of node,
   * including node label and param labels.
   * Style the invisible text sandbox so that it accurately sizes text.
   * Another way is to use `canvas.measureText()` method.
   *
   * @param {!NodeCreationMessage} message
   * @return {number}
   */
  _computeMaxTextLength(message) {
    let maxTextLength = 0;
    textSandbox.start('audioParamText');

    for (let i = 0; i < message.audioParamNames.length; i++) {
      // Determine the audio param label max length.
      textSandbox.setText(message.audioParamNames[i]);
      maxTextLength = Math.max(
          maxTextLength, textSandbox.clientWidth());
    }

    // No longer size the text based on the smaller audio param text font.
    textSandbox.stop('audioParamText');

    // Determine the would-be length of the node label text.
    textSandbox.start('nodeText');
    textSandbox.setText(this.nodeLabel);
    maxTextLength = Math.max(
        maxTextLength, textSandbox.clientWidth());
    textSandbox.stop('nodeText');

    return maxTextLength;
  }

  /**
   * Setup the properties of each input port based on the message.
   * @param {!NodeCreationMessage} message
   * @param {NodeDimension} dimension
   * @return {Array<Port>}
   */
  _prepareInputPorts(message, dimension) {
    const ports = [];
    let inputPortY = INPUT_PORT_RADIUS + LEFT_SIDE_TOP_PADDING;
    for (let i = 0; i < message.numberOfInputs; i++) {
      ports.push({
        'id': computeInPortId(message.contextId, message.nodeId, i),
        'type': PortTypes.IN,
        'text': '' + i,
        'y': inputPortY,
      });
      inputPortY += TOTAL_INPUT_PORT_HEIGHT;
    }
    return ports;
  }

  /**
   * Setup the properties of each output port based on the message.
   * @param {!NodeCreationMessage} message
   * @param {NodeDimension} dimension
   * @return {Array<Port>}
   */
  _prepareOutputPorts(message, dimension) {
    const ports = [];
    for (let i = 0; i < message.numberOfOutputs; i++) {
      ports.push({
        'id': computeOutPortId(message.contextId, message.nodeId, i),
        'type': PortTypes.OUT,
        'text': '' + i,
      });
    }
    return ports;
  }

  /**
   * Setup the properties of each param port based on the message.
   * @param {!NodeCreationMessage} message
   * @param {NodeDimension} dimension
   * @return {Array<Port>}
   */
  _prepareParamPorts(message, dimension) {
    const ports = [];
    let audioParamY = dimension.inputPortSectionHeight +
        LEFT_SIDE_TOP_PADDING + AUDIO_PARAM_RADIUS;
    for (let i = 0; i < message.audioParamNames.length; i++) {
      ports.push({
        'id': computeAudioParamPortId(
            message.contextId, message.nodeId, message.audioParamNames[i]),
        'type': PortTypes.PARAM,
        'text': message.audioParamNames[i],
        'y': audioParamY,
      });
      audioParamY += TOTAL_PARAM_PORT_HEIGHT;
    }

    return ports;
  }

  _createPortData(ports) {
    const err = this._validatePorts(ports);
    if (err.length) {
      throw new Error(err);
    }

    return new Collection(ports);
  }

  /**
   * Ensure each port is an object and has an id.
   * @param {Array<Port>} ports
   * @return {Array<string>} errors
   */
  _validatePorts(ports) {
    const errorMessages = [];
    ports.forEach((p) => {
      if (typeof p !== 'object') {
        errorMessages.push('Invalid port', p);
      }

      if (!this._isValidPortId(p.id)) {
        errorMessages.push('port id is required');
      }
    });

    return errorMessages;
  }

  _isValidPortId(id) {
    return id !== null && id !== undefined && !isObject(id);
  }
}
