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

import { computeLayout } from "../layout/layout";
import { renderGraph } from "./renderGraph";
import { enablePanZoom } from "./panZoom";


const getWindowSize = () => {
  return {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight,
  }
}

/**
 * Listens to any update of graph, and requests redrawing the canvas.
 */
export default class Workspace {
  constructor(canvas, graph) {
    this.canvas = canvas;
    this.graph = graph;

    this._isRedrawPending = false;
    this._isUsingWorker = false;
    this._shouldRedrawNext = false;
  }

  init() {
    this.resize()
    this.graph.on('shouldRedraw', () => {
      this.requestRedraw();
    })
    enablePanZoom(this.canvas);
  }

  /** Set canvas size based on window size. */
  resize() {
    const size = getWindowSize();
    this._setCanvasSize(size);
    this.requestRedraw()
  }

  _setCanvasSize(size) {
    this.canvas.setWidth(size.width);
    this.canvas.setHeight(size.height);
  }

  requestRedraw() {

    if (this._isRedrawPending) {
      // an rAF is already pending, do not request again
      return;
    }

    if (this._isUsingWorker) {
      // while a Web Worker is still computing layout, new updates are made.
      // Batch them and request another redraw after layouting is complete.
      this._shouldRedrawNext = true;
      return;
    }

    this._isRedrawPending = true;

    requestAnimationFrame(this._relayout.bind(this));
  }

  /**
   * Layout graph.
   * Subsequent relayout requests are skipped if the current one is not complete.
   */
  _relayout() {
    this._isRedrawPending = false;

    // prevent sending to Worker when the previous one does not return
    if (this._isUsingWorker) {
      return;
    }
    this._isUsingWorker = true;

    console.log('start layout...')
    this._startLayoutTime = performance.now();
    computeLayout(this.graph, {
      marginX: 20,
      marginY: 20,
      useWorker: true,
      callback: this._render.bind(this),
    });
  }

  /**
   * Render graph if layout successfully.
   * If any updates are made during the layouting, request another redraw.
   */
  _render(bbox) {
    this._isUsingWorker = false;

    if (this._shouldRedrawNext) {
      this._shouldRedrawNext = false;
      this.requestRedraw();
    }

    console.log('finish layout, time spent: ',
      (performance.now() - this._startLayoutTime) / 1000, 's');

    if (bbox) {
      // layout successfully
      console.log('graph dimension', bbox.width, bbox.height);
      requestAnimationFrame(() => {
        renderGraph(this.canvas, this.graph)
      });
    }
    console.log('redraw...')
  }

}
