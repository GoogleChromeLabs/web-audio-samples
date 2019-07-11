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

import './index.css';
import {fabric} from 'fabric';
import Graph from './graph/Graph';
import Workspace from './ui/Workspace';
import {initIframeHandler} from './iframe/iframeHandler';
import {addEventListener} from './messaging/addEventListener';

const canvas = new fabric.Canvas('root', {selection: false});
const graph = new Graph();
const workspace = new Workspace(canvas, graph);

window.addEventListener('load', () => {
  workspace.initialize();
});
window.addEventListener('resize', () => {
  workspace.resize();
});

addEventListener(graph);
initIframeHandler();
