/**
 * Copyright 2018 Google Inc. All Rights Reserved.
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

import { html, render } from '../node_modules/lit-html/lib/lit-extended.js';

/**
 * Gets a DOM object with an element ID.
 * @param {string} targetDivId Target element ID. (commonly div element)
 */
const at = (targetDivId) => {
  return document.getElementById(targetDivId);
};

/**
 * Renders lit-html templates upon the page load.
 * @param {function} renderFunctions A collection of |render| calls to build
 * a page.
 */
const buildPage = (renderFunctions) => {
  // TODO: how do I fix the "flickering issue"? How can these render calls
  // can be synchronized?
  window.addEventListener('load', () => {
    renderFunctions();
  });
};

export {
  html,
  render,
  at,
  buildPage,
};