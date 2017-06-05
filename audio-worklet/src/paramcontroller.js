/*
Copyright 2017, Google Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

    * Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above
copyright notice, this list of conditions and the following disclaimer
in the documentation and/or other materials provided with the
distribution.
    * Neither the name of Google Inc. nor the names of its
contributors may be used to endorse or promote products derived from
this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
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
		// A param container holds controller and display
		let parent = document.getElementById(parentId);
		let container = document.createElement("div"); 
		parent.appendChild(container);
		container.className += "param";
		
		// Display div which updates as input is changed
		this.header_ = document.createElement("div"); 
		this.header_.className += "paramHeader";
		this.name_ = options.name || "Parameter";
		this.header_.innerHTML = this.name_ + ": ";
		this.header_.innerHTML += options.default || 1;
		container.appendChild(this.header_);
		
		// Default to percentage scale for input unless specified in options
		this.event_ = event;
		this.controller_ = document.createElement("input");
		this.controller_.type = options.type || "range";
		this.controller_.min = options.min || 0;
		this.controller_.max = options.max || 100;
		this.controller_.step = options.step || 1;
		this.controller_.value = options.default || 1;

		// TODO: implement more controller types 
		if (this.controller_.type == "range") {
			this.controller_.className += "slider";
		}
		else { 
			console.error(type + " not defined");
		}

		container.appendChild(this.controller_);
		this.controller_.addEventListener("input", this.change.bind(this));
	}

	enable() {		
		this.controller_.disabled = false;
	}

	disable() {
		this.controller_.disabled = true;
	}
	
	change() {
		this.header_.innerHTML = this.name_ +": ";
		this.header_.innerHTML += this.controller_.value;
		this.event_(this.controller_.value);
	}
}