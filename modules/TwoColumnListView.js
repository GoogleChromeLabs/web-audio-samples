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

import { html } from './Base.js';

const Emojis = ['🎹', '🎙️', '🎧', '🎚️', '🎛️'];

// Generates column within a row.
function getColumn(entry) {
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

export default (context) => {
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
        ${getColumn(columns.left)}
        ${getColumn(columns.right)}
      </div>
    `)}
  `;
};