// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import './css/index.css';
import { fabric } from 'fabric';
import Graph from './js/graph/Graph';
import Workspace from './js/ui/Workspace';
import { startListening } from './js/messaging/startListening';
import { initIframeHandler } from './js/iframe/iframeHandler';

const canvas = new fabric.Canvas('root', { selection: false });
const graph = new Graph();
const ws = new Workspace(canvas, graph);

window.addEventListener('load', () => {
  ws.init();
});
window.addEventListener('resize', () => {
  ws.resize();
});

startListening(graph);
initIframeHandler();
