/**
 * Copyright 2017 Google Inc.
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
class SourceController {
  /**
   * Event Handler and layout for start and stop button
   * @param  {String} parentId string id for parent element
   * @param  {Function} startCallback callback for play button
   * @param  {Function} stopCallback callback for stop button
   */
  constructor(parentId, startCallback, stopCallback) {
    this.startCallback_ = startCallback;
    this.stopCallback_ = stopCallback;

    this.eButtonStartStop_ = document.createElement('button');
    document.getElementById(parentId).appendChild(this.eButtonStartStop_);

    // When not in a playing state, clicking eButtonStartStop_ will trigger
    // the startCallback and otherwise it will trigger the stopCallback.
    // The text content of the button will indicate state to the user.
    this.playing = false;
    this.eButtonStartStop_.textContent = 'Play';
    this.eButtonStartStop_.addEventListener(
        'click', this.startOrStop_.bind(this));
    this.eButtonStartStop_.disabled = true;
  }

  /**
   * Enable start and stop button (if, for example, media is loaded).
   */
  enable() {
    this.eButtonStartStop_.disabled = false;
  }

  /**
   * Disable start and stop button.
   */
  disable() {
    this.eButtonStartStop_.disabled = true;
  }

  startOrStop_() {
    if (this.playing) {
      this.stopCallback_();
      this.playing = false;
      this.eButtonStartStop_.textContent = 'Play';
    } else {
      this.startCallback_();
      this.playing = true;
      this.eButtonStartStop_.textContent = 'Stop';
    }
  }
}
