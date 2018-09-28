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

import {
    html, render,
    Component, WorkletIndicator, TopBar, Footer,
    OneColumnView, DemoRunner }
        from '../../assets/Components.js';

export default (PageData, demoCode) => {
  render(html`
      <div id="TopBar"></div>
      <div id="WorkletIndicator"></div>
      <div id="Description"></div>
      <div id="Runner"></div>
      <div id="Footer"></div>`,
      document.getElementsByClassName('container was-page-wrap')[0]);

  Component.build('TopBar', TopBar, PageData.TopBar);
  Component.build('WorkletIndicator', WorkletIndicator);
  Component.build('Description', OneColumnView, PageData.Description);
  Component.build('Runner', DemoRunner, demoCode);
  Component.build('Footer', Footer);
  Component.present();
};
