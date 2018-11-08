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
const GitHubSourceUrl =
    'https://github.com/GoogleChromeLabs/web-audio-samples/tree/master/';
const RepoPrefix = '/web-audio-samples/';

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
        Chrome ♥ WebAudio
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
 * OneColumnView component
 */
const OneColumnView = (context) => {
  return html`
    <div class="row">
      <div class="column">
        <h1>${context.title}</h1>
        <p>${context.detail}</p>
      </div>
    </div>
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
 * WorkletIndicator component
 */
const WorkletIndicator = () => {
  const isAudioWorkletAvailable = _detectAudioWorklet();
  return isAudioWorkletAvailable
      ? html`<div class="was-indicator-found">AudioWorklet Ready</div>`
      : html`<div class="was-indicator-missing">No AudioWorklet</div>`;
};

// Check if AudioWorklet is available.
function _detectAudioWorklet() {
  let context = new OfflineAudioContext(1, 1, 44100);
  return Boolean(
      context.audioWorklet &&
      typeof context.audioWorklet.addModule === 'function');
}


/**
 * Logger class
 */
class Logger {
  constructor(maxItem) {
    this.maxItem_ = maxItem || 5;
    this.eContainer_ = document.createElement('div');
    this.eContainer_.className = 'was-logger-container';
  }

  getElement() {
    return this.eContainer_;
  }

  post(message) {
    const newDiv = document.createElement('div');
    newDiv.textContent = message;
    this.eContainer_.insertBefore(newDiv, this.eContainer_.firstChild);
    if (this.eContainer_.children.length > this.maxItem_) {
      this.eContainer_.removeChild(this.eContainer_.lastChild);
    }
  }

  clear() {
    this.eContainer_.innerHTML = '';
  }
}


/**
 * DemoRunner component
 */
const DemoRunner = (demoFunction) => {
  const sourceUrl =
      GitHubSourceUrl + window.location.pathname.slice(RepoPrefix.length);
  const audioContext = new AudioContext();
  const logger = new Logger();

  // Creates a button and its logic.
  let isFirstClick = true;
  const eButton = document.createElement('button');
  eButton.textContent = 'START';
  eButton.disabled = _detectAudioWorklet() ? false : true;
  eButton.onclick = (event) => {
    if (eButton.textContent === 'START') {
      if (isFirstClick) {
        demoFunction(audioContext, logger);
        isFirstClick = false;
      }
      audioContext.resume();
      logger.post('Context resumed.');
      eButton.textContent = 'STOP';
    } else {
      audioContext.suspend();
      logger.post('Context suspended.');
      eButton.textContent = 'START';
    }
  };

  return html`
    <div class="row was-demo-runner">
      <div class="column">
        <div class="was-demo-area">
          <div class="was-demo-area-label">DEMO</div>
          ${eButton}
          ${logger.getElement()}
          <div class="was-demo-area-source">
            <a href="${sourceUrl}">See sources on GitHub</a>
          </div>
        </div>
      </div>
    </div>
  `;
};


/**
 * Exports
 */
export {
  render,
  html,
  Component,
  TopBar,
  Footer,
  OneColumnView,
  TwoColumnListView,
  WorkletIndicator,
  DemoRunner,
};
