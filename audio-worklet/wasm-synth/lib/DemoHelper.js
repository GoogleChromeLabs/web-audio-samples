/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 *
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

/** @global document */

const Icons = {
  Power: `<svg xmlns="http://www.w3.org/2000/svg" width="36px" height="36px" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"/><path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/></svg>`,
  Note: `<svg xmlns="http://www.w3.org/2000/svg" width="36px" height="36px" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/></svg>`,
};

class DemoHelper {

  static build(demoConfig) {
    const player = new DemoHelper();
    player.addEventHandler('usergesture', demoConfig.onUserGesture);
    player.addEventHandler('demostart', demoConfig.onDemoStart);
    player.addEventHandler('demostop', demoConfig.onDemoStop);
    player.addEventHandler('buttonchange', demoConfig.onButtonChange);
  }

  constructor() {
    this._eventHandlers = {
      'usergesture': [],
      'demostart': [],
      'demostop': [],
      'buttonchange': [],
    };
    this._demoState = false;

    window.onload = this._initialize.bind(this);
  }

  addEventHandler(eventType, handler) {
    this._eventHandlers[eventType].push(handler);
  }

  _initialize() {
    document.head.innerHTML =
        `<link href="/chrome/lib/demo-helper.css" rel="stylesheet">`;
    this._container = document.getElementById('demo');
    this._container.innerHTML = `
        <div>
          <button id="demo-toggle" class="inactive" disabled>
            ${Icons.Power}
          </button>
          <button id="test-tone" class="inactive" disabled>
            ${Icons.Note}
          </button>
        </div>`;
    this._toggleElement = document.getElementById('demo-toggle');
    this._testToneElement = document.getElementById('test-tone');
    this._handleUserGesture = this._handleUserGesture.bind(this);
    document.body.addEventListener('click', this._handleUserGesture, false);
  }

  _handleUserGesture(event) {
    document.body.removeEventListener('click', this._handleUserGesture);
    this._eventHandlers['usergesture'].forEach(handler => handler());
    this._toggleElement.addEventListener(
        'mouseup', this._handleDemoToggle.bind(this));
    this._testToneElement.addEventListener(
        'mousedown', this._handleButtonChange.bind(this, true));
    this._testToneElement.addEventListener(
        'mouseup', this._handleButtonChange.bind(this, false));
    this._toggleElement.disabled = false;
    this._testToneElement.disabled = false;
    this._container.style.pointerEvents = 'auto';
    this._container.style.backgroundColor = '#D2E3FC';
  }

  _handleDemoToggle() {
    this._demoState = !this._demoState;
    this._demoState
        ? this._toggleElement.classList.replace('inactive', 'active')
        : this._toggleElement.classList.replace('active', 'inactive');
    const eventType = this._demoState ? 'demostart' : 'demostop';
    this._eventHandlers[eventType].forEach(handler => handler());
  }

  _handleButtonChange(isDown) {
    this._eventHandlers['buttonchange'].forEach(handler => handler(isDown));
  }
}

export default DemoHelper;
