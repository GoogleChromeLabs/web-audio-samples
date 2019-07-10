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

import {computeLayout} from '../layout/layout';
import {renderGraph} from './renderGraph';
import {enablePanZoom} from './panZoom';

/** @typedef {import('../graph/Graph').default} Graph */
/**
 * @typedef {Object} Size
 * @property {number} width - The width
 * @property {number} height - The height
 */
/**
 * @typedef {Size} BoundingBox
 */

const getWindowSize = () => {
  return {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight,
  };
};

/**
 * Listens to any update of graph, and requests redrawing the canvas.
 * @class
 */
export default class Workspace {
  /**
   * @constructor
   * @param {!fabric.Canvas} canvas - The canvas to render objects on.
   * @param {!Graph} graph - The model of graph.
   */
  constructor(canvas, graph) {
    this.canvas = canvas;
    this.graph = graph;

    this._isRedrawPending = false;
    this._isUsingWorker = false;
    this._shouldRedrawNext = false;

    this._bind_relayout = this._relayout.bind(this);
    this._bind_render = this._render.bind(this);
  }

  /** Initialize the event listener and enable pan-zoom */
  initialize() {
    this.resize();
    this.graph.on('shouldRedraw', () => {
      this.requestRedraw();
    });
    enablePanZoom(this.canvas);
  }

  /** Resize the canvas. */
  resize() {
    const size = getWindowSize();
    this._setCanvasSize(size);
    this.requestRedraw();
  }

  /**
   * Set canvas size based on window size.
   * @param {!Size} size
   */
  _setCanvasSize(size) {
    this.canvas.setWidth(size.width);
    this.canvas.setHeight(size.height);
  }

  requestRedraw() {
    if (this._isRedrawPending) {
      // An rAF is already pending, do not request again.
      return;
    }

    if (this._isUsingWorker) {
      // while a Web Worker is still computing layout, new updates are made.
      // Batch them and request another redraw after layouting is complete.
      this._shouldRedrawNext = true;
      return;
    }

    this._isRedrawPending = true;

    requestAnimationFrame(this._bind_relayout);
  }

  // Layout graph.
  // Subsequent relayout requests are skipped if the current one is incomplete.
  _relayout() {
    this._isRedrawPending = false;

    // prevent sending to Worker when the previous one does not return
    if (this._isUsingWorker) {
      return;
    }
    this._isUsingWorker = true;

    console.log('start layout...');
    this._startLayoutTime = performance.now();
    computeLayout(this.graph, {
      marginX: 20,
      marginY: 20,
      useWorker: true,
      callback: this._bind_render,
    });
  }

  /**
   * Render graph if layout successfully.
   * If any updates are made during the layouting, request another redraw.
   * @param {!BoundingBox} boundingBox The bounding box of the layouted graph.
   */
  _render(boundingBox) {
    this._isUsingWorker = false;

    if (this._shouldRedrawNext) {
      this._shouldRedrawNext = false;
      this.requestRedraw();
    }

    console.log('finish layout, time spent: ',
        (performance.now() - this._startLayoutTime) / 1000, 's');

    if (boundingBox) {
      // layout successfully
      console.log('graph dimension', boundingBox.width, boundingBox.height);
      requestAnimationFrame(() => {
        renderGraph(this.canvas, this.graph);
      });
    }
    console.log('redraw...');
  }
}
