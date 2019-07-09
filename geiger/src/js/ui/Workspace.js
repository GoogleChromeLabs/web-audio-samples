// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import { computeLayout } from "../layout/layout";
import { renderGraph } from "./renderGraph";
import { enablePanZoom } from "./panZoom";


const getWindowSize = () => {
  return {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight,
  }
}

export default class Workspace {
  constructor(canvas, graph) {
    this.canvas = canvas;
    this.graph = graph;
    // this.context = canvas.getContext('2d');
    // this.zoomLevel = 1.0;  // by default. handle zoom
    // this.panOffset = [0, 0];  // handle pan
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
      // a rAF is already pending, do not request again
      return;
    }

    if (this._isUsingWorker) {
      // a Web Worker is still computing layout, when it finishes,
      // draw the newly updated graph
      this._shouldRedrawNext = true;
      return;
    }

    this._isRedrawPending = true;

    requestAnimationFrame(this._relayout.bind(this));
  }

  _relayout() {
    this._isRedrawPending = false;

    // prevent sending to Worker while the previous one does not return
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
      callback: this._redraw.bind(this),
    });
  }

  _redraw(bbox) {
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
