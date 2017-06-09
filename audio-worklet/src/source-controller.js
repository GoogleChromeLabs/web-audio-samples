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
   * Event Handler and layout for start / stop buttons
   * @param  {String} parentId string id for parent element
   * @param  {Function} audioStart callback for play button
   * @param  {Function} audioStop callback for stop button
   */
  constructor(parentId, audioStart, audioStop) {
    // Arrange play and stop button and trigger audioStart
    // and audioStop when these buttons are pressed.
    parent = document.getElementById(parentId);
    this.playButton_ = document.createElement('button');
    this.stopButton_ = document.createElement('button');
    parent.appendChild(this.playButton_);
    parent.appendChild(this.stopButton_);

    this.playButton_.innerHTML = 'Play';
    this.stopButton_.innerHTML = 'Stop';
    this.stopButton_.disabled = true;

    this.playButton_.addEventListener('click', this.start.bind(this));
    this.stopButton_.addEventListener('click', this.stop.bind(this));
    this.audioStart_ = audioStart;
    this.audioStop_ = audioStop;
  }

  enable() {
    this.playButton_.disabled = false;
  }

  disable() {
    this.stopButton_.disabled = true;
    this.playButton_.disabled = true;
  }

  start() {
    this.playButton_.disabled = true;
    this.stopButton_.disabled = false;
    this.audioStart_();
  }

  stop() {
    this.playButton_.disabled = false;
    this.stopButton_.disabled = true;
    this.audioStop_();
  }
}
