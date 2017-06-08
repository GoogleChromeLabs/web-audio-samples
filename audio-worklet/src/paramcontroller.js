/*
  Copyright 2017 Google Inc.
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

class ParamController {
  /**
   * Event handler and layout for audio parameters with numeric input values
   * @param  {String} parentId id for parent element
   * @param  {Function} event callback to trigger on input
   * @param  {String} options.name the name of the parameter
   * @param  {String} options.type the type of input (only support for range)
   * @param  {String} options.min the minimum possible value
   * @param  {String} options.max the maximum possible value
   * @param  {String} options.step the parameter's increment value
   * @param  {String} options.default the default value of the parameter
   */
  constructor(parentId, event, options) {
    // A param container holds controller and display.
    let parent = document.getElementById(parentId);
    let container = document.createElement('div');
    parent.appendChild(container);
    container.className += 'param';

    // Display div which updates as input is changed.
    this.header_ = document.createElement('div');
    this.header_.className += 'paramHeader';
    this.name_ = options.name || 'Parameter';
    this.header_.innerHTML = this.name_ + ': ';
    this.header_.innerHTML += options.default || 1;
    container.appendChild(this.header_);

    // Default to percentage scale for input unless specified in options.
    this.executeEvent_ = event;
    this.controller_ = document.createElement('input');
    this.controller_.type = options.type || 'range';
    this.controller_.min = options.min || 0;
    this.controller_.max = options.max || 100;
    this.controller_.step = options.step || 1;
    this.controller_.value = options.default || 1;

    // TODO: implement more controller types.
    if (this.controller_.type == 'range') {
      this.controller_.className += 'slider';
    } else {
      console.error(type + ' not defined');
    }

    container.appendChild(this.controller_);
    this.controller_.addEventListener('input', this.change.bind(this));
  }

  enable() {
    this.controller_.disabled = false;
  }

  disable() {
    this.controller_.disabled = true;
  }

  change() {
    this.header_.innerHTML = this.name_ + ': ';
    this.header_.innerHTML += this.controller_.value;
    this.executeEvent_(this.controller_.value);
  }
}
