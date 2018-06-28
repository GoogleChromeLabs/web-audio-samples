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

function generatePathList(pathData) {
  return html`
    ${pathData.map((path) => html`
      <li class="was-top-bar-divider">|</li>
      <li>
        ${path.url
            ? html`<a href="${path.url}">${path.title}</a>`
            : html`${path.title}`
        }
      </li>
    `)}
  `;
}

export default (context) => {
    return html`
    <div class="row was-top-bar">
      <div class="column">
        <ul>
          <li>
            <a href="/">HOME</a>
          </li>
          ${ context && context.pathData
              ? generatePathList(context.pathData)
              : html``
          }
        </ul>
      </div>
    </div>
  `;
};