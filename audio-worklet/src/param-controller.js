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
class ParamController {
  /**
   * Event handler and layout for audio parameters with numeric input values
   * @param {String} parentId id for parent element.
   * @param {Function} onChangeCallback Callback to trigger on input.
   * @param {Object} options
   * @param {String} options.name The name of the parameter.
   * @param {String} options.id A variable name associated with the parameter.
   * @param {String} options.type The type of input (only support for range).
   * @param {String} options.min The minimum possible value.
   * @param {String} options.max The maximum possible value.
   * @param {String} options.step The parameter's increment value.
   * @param {String} options.default The default value of the parameter.
   * @param {Boolean} options.online True if changing the parameter affects
   *                                 currently playing (online) audio.
   */
  constructor(parentId, onChangeCallback, options) {
    if (options == null) options = {};

    // A param container holds controller and display.
    let container = document.createElement('div');
    document.getElementById(parentId).appendChild(container);

    // Display div which updates as input is changed.
    this.header_ = document.createElement('div');
    this.name_ = options.name || 'Parameter';
    this.header_.textContent = this.name_ + ': ';
    this.header_.textContent += options.default || 0;
    container.appendChild(this.header_);

    // Default to percentage scale for input unless specified in options.
    this.controller_ = document.createElement('input');
    this.controller_.type = options.type || 'range';
    this.controller_.min = options.min || 0;
    this.controller_.max = options.max || 0;
    this.controller_.step = options.step || 0;
    this.controller_.value = options.default || 0;
    this.onChangeCallback_ = onChangeCallback;
    this.id_ = options.id || this.name_;
    this.online_ = options.online || false;

    if (this.controller_.type == 'range') {
      this.controller_.className += 'slider';
    } else {
      console.error(type + ' not defined');
    }

    container.appendChild(this.controller_);
    this.controller_.addEventListener('input', this.change_.bind(this));
  }

  /**
   * Enable the slider.
   */
  enable() {
    this.controller_.disabled = false;
  }

  /**
   * Disable the slider.
   */
  disable() {
    this.controller_.disabled = true;
  }

  change_() {
    this.header_.textContent = this.name_ + ': ';
    this.header_.textContent += this.controller_.value;
    this.onChangeCallback_(this.controller_.value, this.id_, this.online_);
  }
}
