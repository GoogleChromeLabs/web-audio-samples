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
   * @param {String} parentId ID for parent element.
   * @param {Function} onChangeCallback Callback to trigger on input.
   * @param {Object} options Parameters with default values if unspecified.
   * @param {String} options.name The name of the parameter. Default is
   *                              'Parameter'.
   * @param {String} options.id A variable name associated with the parameter.
   *                            Defaults to the value of |name|.
   * @param {String} options.type The type of input (only support for range).
   * @param {Number} options.min The minimum possible value. Default is 0.
   * @param {Number} options.max The maximum possible value. Default is 1.
   * @param {Number} options.step The parameter's increment value.
   *                              Default is 0.1.
   * @param {Number} options.default The default value of the parameter. Default
   *                                 is 0.
   */
  constructor(parentId, onChangeCallback, options) {
    if (typeof options === 'undefined') options = {};
    
    this.controller_ = document.createElement('input');
    this.name_ = options.name || 'Parameter';
    this.id_ = options.id || this.name_;
    this.controller_.type = options.type || 'range';
    this.controller_.min = options.min || 0;

    if (typeof options.max === 'undefined')
      this.controller_.max = 1;
    else
      this.controller_.max = options.max;

    if (typeof options.step === 'undefined')
      this.controller_.step = 0.1;
    else
      this.controller_.step = options.step;

    this.controller_.value = options.default || 0;
    this.onChangeCallback_ = onChangeCallback;

    // A param container holds controller and display.
    let container = document.createElement('div');
    document.getElementById(parentId).appendChild(container);

    this.header_ = document.createElement('div');
    this.header_.textContent = this.name_ + ': ';
    this.header_.textContent += this.controller_.value;
    container.appendChild(this.header_);
    
    if (this.controller_.type === 'range')
      this.controller_.className += 'slider';
    else
      throw this.controller_.type + ' not defined.';
    
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
    this.onChangeCallback_(parseFloat(this.controller_.value), this.id_);
  }
}
