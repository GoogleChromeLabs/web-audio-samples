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

import { isObject } from "util";
import { AUDIO_PARAM_RADIUS, INPUT_PORT_RADIUS, LEFT_SIDE_TOP_PADDING, LEFT_TEXT_INDENT, TOTAL_INPUT_PORT_HEIGHT, TOTAL_PARAM_PORT_HEIGHT } from '../ui/graphStyle';
import { textSandbox } from "../ui/textSandbox";
import Collection from "../util/Collection";
import { computeAudioParamPortLabel, computeInPortLabel, computeOutPortLabel } from "./label";
import { PortTypes } from './PortTypes';
import Node from './Node';

export default class NodeWithPort extends Node {
  constructor(message) {
    super(message);

    this._ports = null;

    this._init(message);
  }

  getPortById(id) {
    return this._ports.get(id);
  }

  getPortsByType(name) {
    return this._ports.filter(port => port.type === name);
  }

  getPorts() {
    return this._ports.values();
  }

  /**
   * @param {!NodeCreatedMessage} message 
   */
  _init(message) {

    const layout = this._computeNodeLayout(message);

    const inputPorts = this._prepareInputPorts(message, layout);
    const outputPorts = this._prepareOutputPorts(message, layout);
    const paramPorts = this._prepareParamPorts(message, layout);

    this._ports = this._createPortData(inputPorts.concat(outputPorts, paramPorts));

    this.setSize({
      width: layout.maxTextLength + LEFT_TEXT_INDENT + 30,
      height: layout.totalHeight
    })
  }

  /**
   * Use number of inputs, outputs, and AudioParams to compute the layout
   * for text and ports.
   * @credit This function is mostly borrowed from Audion/
   *      `audion.entryPoints.handleNodeCreated_()`.
   *      https://github.com/google/audion/blob/master/js/entry-points/panel.js
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
        inputPortSectionHeight + paramPortSectionHeight + LEFT_SIDE_TOP_PADDING +
            leftSideBottomPadding,
        TOTAL_INPUT_PORT_HEIGHT * message.numberOfOutputs);

    const maxTextLength = this._computeMaxTextLength(message)

    return {
      inputPortSectionHeight,
      paramPortSectionHeight,
      maxTextLength,
      totalHeight,
    }
  }

  _computeMaxTextLength(message) {
    // Compute the max width. Part of that entails computing the max param label
    // length. Style the invisible text sandbox so that it accurately sizes text.
    let maxTextLength = 0;
    textSandbox.start('audioParamText')

    for (var i = 0; i < message.audioParamNames.length; i++) {
      // Determine the audio param label max length.
      textSandbox.setText(message.audioParamNames[i]);
      maxTextLength = Math.max(
          maxTextLength, textSandbox.clientWidth());
    }

    // No longer size the text based on the smaller audio param text font.
    textSandbox.stop('audioParamText');

    // Determine the would-be length of the node label text.
    textSandbox.start('nodeText')
    textSandbox.setText(this.nodeLabel);
    maxTextLength = Math.max(
        maxTextLength, textSandbox.clientWidth());
    textSandbox.stop('nodeText');
    
    return maxTextLength;
  }

  _prepareInputPorts(message, layout) {
    const ports = [];
    let inputPortY = INPUT_PORT_RADIUS + LEFT_SIDE_TOP_PADDING;
    for (let i = 0; i < message.numberOfInputs; i++) {
      ports.push({
        'id': computeInPortLabel(message.contextId, message.nodeId, i),
        'type': PortTypes.IN,
        'text': ''+i,
        'y': inputPortY
      });
      inputPortY += TOTAL_INPUT_PORT_HEIGHT
    }
    return ports;
  }

  _prepareOutputPorts(message, layout) {
    const ports = [];
    for (let i = 0; i < message.numberOfOutputs; i++) {
      ports.push({
        'id': computeOutPortLabel(message.contextId, message.nodeId, i),
        'type': PortTypes.OUT,
        'text': ''+i
      });
    }
    return ports;
  }

  _prepareParamPorts(message, layout) {
    // Create labels for audio param ports.
    const ports = [];
    let audioParamY =
        layout.inputPortSectionHeight + LEFT_SIDE_TOP_PADDING + AUDIO_PARAM_RADIUS;
    for (var i = 0; i < message.audioParamNames.length; i++) {
      ports.push({
        'id': computeAudioParamPortLabel(
            message.contextId, message.nodeId, message.audioParamNames[i]),
        'type': PortTypes.PARAM,
        'text': message.audioParamNames[i],
        'y': audioParamY
      });
      audioParamY += TOTAL_PARAM_PORT_HEIGHT;
    }

    return ports
  }

  _createPortData(ports) {
    const err = this._validatePorts(ports)
    if (err.length) {
      throw new Error(err);
    }

    return new Collection(ports);
  }

  _validatePorts(ports) {

    const errorMessages = [];
    ports.forEach(p => {
      if (typeof p !== 'object') {
        errorMessages.push('Invalid port', p);
      }

      if (!this._isValidPortId(p.id)) {
        errorMessages.push('port id is required')
      }
    })

    return errorMessages;
  }

  _isValidPortId(id) {
    return id !== null && id !== undefined && !isObject(id);
  }


}