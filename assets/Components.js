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

 // Hide everything before it is ready. (FOUC)
document.documentElement.classList.add('was-render-pending');

import { html, render } from '../assets/lit-html/lib/lit-extended.js';

const LogPrefix = '[Component] ';

/**
 * Page builder utility object.
 */
const Component = {

  // Build an element with a lit-html component and associated data.
  build: (targetDivId, component, templateData) => {
    const targetDiv = document.getElementById(targetDivId);
    if (targetDiv) {
      render(component(templateData), targetDiv);
    } else {
      throw new Error(LogPrefix + 'Invalid target element ID: "'
          + targetDivId + '"');
    }
  },

  // Lifts off the FOUC blocker. Must be called after all the rendering is
  // Finished.
  present: () => {
    document.documentElement.classList.remove('was-render-pending');
  },

};


/**
 * TopBar component
 */
const TopBar = (context) => {
  return html`
    <div class="row was-top-bar">
      <div class="column">
        <ul>
          ${ context && context.pathData
              ? _generatePathList(context.pathData)
              : html``
          }
        </ul>
      </div>
    </div>
  `;
};

function _generatePathList(pathData) {
  return html`
    ${pathData.map((path) => html`
      <li>
        ${path.length === 2
            ? html`<a href="${path[1]}">${path[0]}</a>`
            : html`${path[0]}`
        }
      </li>
    `)}
  `;
}


/**
 * Footer component
 */
const Footer = (context) => {
  return html`
    <div class="row was-footer">
      <div class="column">
        <ul>
          <li>
            <a href="//googlechromelabs.github.io/web-audio-samples/">Home</a>
          </li>
          <li>
            <a href="//github.com/GoogleChromeLabs/web-audio-samples/">GitHub</a>
          </li>
          <li>
            <a href="//github.com/GoogleChromeLabs/web-audio-samples/issues/new">Question?</a>
          </li>
          <li>
            <a href="//github.com/GoogleChromeLabs/web-audio-samples/issues/new">Found something broken?</a>
          </li>
          <li>
            <a href="//bugs.chromium.org/p/chromium/issues/entry?components=Blink%3EWebAudio">Found a Chrome bug?</a>
          </li>
        </ul>
        <p>Chrome ♥ WebAudio</p>
      </div>
    </div>
    <script>
      (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
          m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
      })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
      ga('create', 'UA-57132539-4', 'auto');
      ga('send', 'pageview');
    </script>
  `;
};


/**
 * TwoColumnListView component
 */

const Emojis = ['🎹', '🎙️', '🎧', '🎚️', '🎛️'];

const TwoColumnListView = (context) => {
  const emoji = Emojis[Math.ceil(Math.random() * (Emojis.length - 1))];

  // To devide a row into 2 columns.
  const rows = [];
  const numberOfColumns = 2;
  for (let i = 0; i < context.listData.length; i += numberOfColumns) {
    const row = {};
    row.left = context.listData[i];
    if (i+1 < context.listData.length) {
      row.right = context.listData[i+1];
    }
    rows.push(row);
  }

  return html`
    ${context.listTitle
      ? html`
          <div class="row was-list-view">
            <div class="column was-list-title">
              <h2>${emoji} ${context.listTitle}</h2>
            </div>
          </div>`
      : html``
    }

    ${rows.map((columns, index, data) => html`
      <div class="row was-list-view">
        ${_getColumn(columns.left)}
        ${_getColumn(columns.right)}
      </div>
    `)}
  `;
};

// Generates column within a row.
function _getColumn(entry) {
  return html`
    <div class="column">
      ${entry
          ? html`
              <div class="was-list-entry">
                <a href="${entry.url}">
                  <h3 class="was-list-entry-title">${entry.title}</h3>
                </a>
                <p class="was-list-endtry-description">${entry.description}</p>
              </div>
            `
          : html``
      }
    </div>
  `;
}


/**
 * Exports
 */
export {
  Component,
  TopBar,
  Footer,
  TwoColumnListView,
};