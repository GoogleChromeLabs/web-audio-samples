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

export default (context) => html`
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