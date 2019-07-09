/*
 * Copyright (c) 2012 The Chromium Authors. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *    * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *    * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

 function updateSingleGain( event ) {
	var t = event.target;
	var value = t.value;
	t.audioNode.gain.value = value;

	//update the numeric display
	t.parentNode.childNodes[2].textContent = value;
}

function updateSingleFrequency( event ) {
	var t = event.target;
	var value = t.value;
	t.audioNode.frequency.value = value;

	//update the numeric display
	t.parentNode.childNodes[2].textContent = value;
}

function updateSingleDetune( event ) {
	var t = event.target;
	var value = t.value;
	t.audioNode.detune.value = value;

	//update the numeric display
	t.parentNode.childNodes[2].textContent = value;
}

function updateSingleQ( event ) {
	var t = event.target;
	var value = t.value;
	t.audioNode.Q.value = value;

	// if this is one of our chained filters, update the chained filter too
	if (t.audioNode.chainedFilter)
		t.audioNode.chainedFilter.Q.value = value;

	//update the numeric display
	t.parentNode.childNodes[2].textContent = value;
}

function updateGains( event ) {
	var t = event.target;
	var value = t.value;
	for (var i=0; i<numVocoderBands; i++)
		t.audioNodes[i].gain.value = value;

	//update the numeric display
	t.parentNode.childNodes[2].textContent = value;
}

function updateQs( event ) {
	var t = event.target;
	var value = t.value;
	for (var i=0; i<numVocoderBands; i++)
		t.audioNodes[i].Q.value = value;

	//update the numeric display
	t.parentNode.childNodes[2].textContent = value;
}

function updateFrequencies( event ) {
	var t = event.target;
	var value = t.value;
	for (var i=0; i<numVocoderBands; i++)
		t.audioNodes[i].frequency.value = value;

	//update the numeric display
	t.parentNode.childNodes[2].textContent = value;
}

function scaleCarrierFilterFrequencies( scalingFactor ) {
	for (var i=0; i<numVocoderBands; i++) {
		var filter = carrierBands[i];
		var newFrequency = vocoderBands[i].frequency * scalingFactor;
		filter.frequency.value = newFrequency;
		if (filter.chainedFilter)
			filter.chainedFilter.frequency.value = newFrequency;
	}
}

function clearSliders() {
	var sliders = document.getElementById("sliders");
	var child;

	for (child=sliders.firstChild; child; child=sliders.firstChild)
		sliders.removeChild( child );
}

function addColumnSlider( label, defaultValue, minValue, maxValue, nodeArray, onChange ) {
	// insert a range control
	// <input type="range" id="rangeEl" value="0.5" oninput="alert(this.value);" min="0.0" max="1.0" step="0.01">
	var div = document.createElement("div");
	div.appendChild(document.createTextNode(label));
	var ctl = document.createElement("input");
	ctl.type = "range";
	ctl.min = minValue;
	ctl.max = maxValue;
	ctl.step = (maxValue - minValue) / 1000.0;
	ctl.value = defaultValue;
	ctl.oninput = onChange;
	ctl.audioNodes = nodeArray;
	ctl.label = label;
	div.appendChild(ctl);
	div.appendChild(document.createTextNode(defaultValue));
	document.getElementById("sliders").appendChild(div);
}

function addSingleValueSlider( label, defaultValue, minValue, maxValue, node, onChange ) {
	// insert a range control
	// <input type="range" id="rangeEl" value="0.5" oninput="alert(this.value);" min="0.0" max="1.0" step="0.01">
	var div = document.createElement("div");
	div.appendChild(document.createTextNode(label));
	var ctl = document.createElement("input");
	ctl.type = "range";
	ctl.min = minValue;
	ctl.max = maxValue;
	ctl.step = (maxValue - minValue) / 1000.0;
	ctl.value = defaultValue;
	ctl.oninput = onChange;
	ctl.audioNode = node;
	ctl.label = label;
	div.appendChild(ctl);
	div.appendChild(document.createTextNode(defaultValue));
	document.getElementById("sliders").appendChild(div);
}

