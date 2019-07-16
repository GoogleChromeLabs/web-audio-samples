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

import {
  AUDIO_PARAM_RADIUS, INPUT_PORT_RADIUS, LEFT_SIDE_TOP_PADDING,
  LEFT_TEXT_INDENT, TOTAL_INPUT_PORT_HEIGHT, TOTAL_PARAM_PORT_HEIGHT,
  RIGHT_SIDE_PADDING, TOTAL_OUTPUT_PORT_HEIGHT,
  BOTTOM_PADDING_WITHOUT_PARAM, BOTTOM_PADDING_WITH_PARAM,
} from '../ui/graphStyle';
import {textSandbox} from '../ui/textSandbox';
import Collection from '../util/Collection';
import {generateParamPortId, generateInputPortId,
  generateOutputPortId} from './label';
import {PortTypes} from './PortTypes';
import Node from './Node';

// /<reference path="../jsdoc.types.js" />

/**
 * A node with audio params as ports.
 * @class NodeWithPort
 * @extends Node
 */
export default class NodeWithPort extends Node {
  /**
   * @constructor
   * @param {!NodeCreationData} data
   */
  constructor(data) {
    super(data);

    /** @type {NodeLayout} */
    this._layout = this._computeNodeLayout(data);

    this._ports = new Collection();
    this._updatePortLayout();
    this._updateNodeSize();
  }

  /**
   * Add an AudioParam to this node.
   * @param {!string} paramId
   * @param {!string} paramType
   */
  addParamPort(paramId, paramType) {
    const portId = generateParamPortId(this.id, paramId);
    const paramY = this._layout.lastParamY + TOTAL_PARAM_PORT_HEIGHT;

    this._addPort({
      id: portId,
      type: PortTypes.PARAM,
      label: paramType,
      y: paramY - AUDIO_PARAM_RADIUS,
    });

    this._updateNodeLayout(paramY, paramType);
    this._updatePortLayout();
    this._updateNodeSize();
  }

  /**
   * Remove an AudioParam from this node.
   * @param {!string} paramId
   */
  removeParamPort(paramId) {
    // Do nothing, since the parent AudioNode is destroyed as well.
  }

  /**
   * @param {!PortTypes} type
   * @return {Array<Port>}
   */
  getPortsByType(type) {
    return this._ports.values().filter((port) => port.type === type);
  }

  /**
   * @param {!string} id
   * @return {Port}
   */
  getPortById(id) {
    return this._ports.get(id);
  }

  /**
   * Get all ports of this node.
   * @return {Array<Port>}
   */
  getPorts() {
    return this._ports.values();
  }

  /** @return {number} */
  _getParamNumber() {
    return this.getPortsByType(PortTypes.PARAM).length;
  }

  /**
   * Use number of inputs and outputs to compute the layout
   * for text and ports.
   * Credit: This function is mostly borrowed from Audion/
   *      `audion.entryPoints.handleNodeCreated_()`.
   *      https://github.com/google/audion/blob/master/js/entry-points/panel.js
   * @param {!NodeCreationData} data
   * @return {NodeLayout}
   */
  _computeNodeLayout(data) {
    // Even if there are no input ports, leave room for the node label.
    const inputPortSectionHeight =
        TOTAL_INPUT_PORT_HEIGHT * Math.max(1, data.numberOfInputs);
    const outputPortSectionHeight =
        TOTAL_OUTPUT_PORT_HEIGHT * (data.numberOfOutputs || 0);
    // The y value of the next audio param port.
    const lastParamY = inputPortSectionHeight + LEFT_SIDE_TOP_PADDING;

    // Use the max of the left and right side heights as the total height.
    // Include a little padding on the left.
    const totalHeight = Math.max(lastParamY + BOTTOM_PADDING_WITHOUT_PARAM,
        outputPortSectionHeight);

    const maxTextLength = this._computeNodeLabelLength(data);

    return {
      inputPortSectionHeight,
      outputPortSectionHeight,
      lastParamY,
      maxTextLength,
      totalHeight,
    };
  }

  /**
   * After adding a param port, update the node layout based on the y value
   * and label length.
   * @param {!number} paramY - The y value of current audio param port.
   * @param {!string} paramType
   */
  _updateNodeLayout(paramY, paramType) {
    this._layout.lastParamY = paramY;

    // Update total height by choosing the max of the left and right
    // side heights. Include a little padding on the left.
    this._layout.totalHeight = Math.max(
        paramY + BOTTOM_PADDING_WITH_PARAM,
        this._layout.outputPortSectionHeight);

    // Update max length with param labels.
    const paramLabelLength = this._computeParamLabelLength(paramType);
    this._layout.maxTextLength = Math.max(this._layout.maxTextLength,
        paramLabelLength);
  }

  _updatePortLayout() {
    this._setupInputPorts();
    this._setupOutputPorts();
  }

  _updateNodeSize() {
    this.setSize({
      width: this._layout.maxTextLength + LEFT_TEXT_INDENT +
          RIGHT_SIDE_PADDING,
      height: this._layout.totalHeight,
    });
  }

  /**
   * Compute the length of the text label to get the max width of node.
   * Style the invisible text sandbox so that it accurately sizes text.
   * Another way is to use `canvas.measureText()` method.
   *
   * @return {number}
   */
  _computeNodeLabelLength() {
    // Determine the would-be length of the node label text.
    return textSandbox.getTextLength('nodeText', this.label);
  }

  _computeParamLabelLength(paramType) {
    return textSandbox.getTextLength('audioParamText', paramType);
  }

  /**
   * Setup the properties of each input port.
   * @param {?NodeLayout} layout
   */
  _setupInputPorts() {
    let inputPortY = INPUT_PORT_RADIUS + LEFT_SIDE_TOP_PADDING;
    for (let i = 0; i < this.numberOfInputs; i++) {
      const portId = generateInputPortId(this.id, i);

      // If an input port exists, no need to recompute.
      if (this._ports.has(portId)) continue;

      this._addPort({
        id: portId,
        type: PortTypes.IN,
        label: '' + i,
        y: inputPortY,
      });
      inputPortY += TOTAL_INPUT_PORT_HEIGHT;
    }
  }

  /**
   * Setup the properties of each output port.
   * Try to place each output near the center of the right-side edge.
   * There is a padding between two outputs.
   */
  _setupOutputPorts() {
    // Compute the y for output ports.
    // Recompute if the total height is changed.
    const totalHeight = this._layout.totalHeight;
    let outputPortY = (totalHeight / 2) -
        (this.numberOfOutputs - 1) * TOTAL_OUTPUT_PORT_HEIGHT / 2;
    for (let i = 0; i < this.numberOfOutputs; i++) {
      const portId = generateOutputPortId(this.id, i);
      if (this._ports.has(portId)) {
        // Reset y if the output port exists.
        const port = this._ports.get(portId);
        port.y = outputPortY;
      } else {
        this._addPort({
          id: portId,
          type: PortTypes.OUT,
          label: '' + i,
          y: outputPortY,
        });
      }
      outputPortY += TOTAL_OUTPUT_PORT_HEIGHT;
    }
  }

  _addPort(port) {
    this._ports.add(port.id, port);
  }
}
