// Copyright 2011, Google Inc.
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
// 
//     * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//     * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

var kDefaultNumberOfResampleRanges = 11;

function Wave(name, context) {
    this.name = name;
    this.context = context;
    this.sampleRate = context.sampleRate;
    this.url = "wave-tables/" + this.name;
    this.waveTableSize = 4096; // hard-coded for now
    this.buffer = 0;
    this.numberOfResampleRanges = kDefaultNumberOfResampleRanges;
}

Wave.prototype.getWaveDataForPitch = function(pitchFrequency) {
    var nyquist = 0.5 * this.sampleRate;
    var lowestNumPartials = this.getNumberOfPartialsForRange(0);
    var lowestFundamental = nyquist / lowestNumPartials;

    // Find out pitch range
    var ratio = pitchFrequency / lowestFundamental;
    var pitchRange = ratio == 0.0 ? 0 : Math.floor(Math.log(ratio) / Math.LN2);

    if (pitchRange < 0)
        pitchRange = 0;

    // Too bad, we'll alias if pitch is greater than around 5KHz :)
    if (pitchRange >= this.numberOfResampleRanges)
        pitchRange = this.numberOfResampleRanges - 1;

    return this.buffers[pitchRange];
}

Wave.prototype.getNumberOfPartialsForRange = function(j) {
	// goes from 1024 -> 4 @ 44.1KHz (and do same for 48KHz)
	// goes from 2048 -> 8 @ 96KHz
	var npartials = Math.pow(2, 1 + this.numberOfResampleRanges - j);
	if (this.getSampleRate() > 48000.0)
	    npartials *= 2;  // high sample rate allows more harmonics at given fundamental
	
	return npartials;
}

Wave.prototype.getWaveTableSize = function() {
    return this.waveTableSize;
}

Wave.prototype.getSampleRate = function() {
    return this.sampleRate;
}

Wave.prototype.getRateScale = function() {
    return this.getWaveTableSize() / this.getSampleRate();
}

Wave.prototype.getNumberOfResampleRanges = function() {
    this.numberOfResampleRanges;
}

Wave.prototype.getName = function() {
    return this.name;
}

Wave.prototype.load = function(callback) {
    var request = new XMLHttpRequest();
    request.open("GET", this.url, true);
    var wave = this;
    
    request.onload = function() {
        // Get the frequency-domain waveform data.
        var f = eval('(' + request.responseText + ')');

        // Copy into more efficient Float32Arrays.
        var n = f.real.length;
        frequencyData = { "real": new Float32Array(n), "imag": new Float32Array(n) };
        wave.frequencyData = frequencyData;
        for (var i = 0; i < n; ++i) {
            frequencyData.real[i] = f.real[i];
            frequencyData.imag[i] = f.imag[i];
        }
        
        if (typeof(wave.context.createPeriodicWave) === 'function')
            wave.wavetable = wave.context.createPeriodicWave(frequencyData.real, frequencyData.imag);
        else
            wave.wavetable = wave.context.createWaveTable(frequencyData.real, frequencyData.imag);
        

        // console.log("frequencyData.real.length: " + frequencyData.real.length + " : " + frequencyData.imag[0]);
        console.log("wavetable: " + wave.wavetable);
        
        // wave.createBuffers();
        if (callback)
            callback(wave);
    };

    request.onerror = function() {
        alert("error loading: " + wave.url);
    };

    request.send();
}

Wave.prototype.print = function() {
    var f = this.frequencyData;

    var info = document.getElementById("info");
    
    var s = "";
    for (var i = 0; i < 2048; ++i) {
        s += "{" + f.real[i] + ", " + f.imag[i] + "}, <br>";
    }

    info.innerHTML = s;
}

Wave.prototype.printBuffer = function(buffer) {
    var info = document.getElementById("info");
    
    var s = "";
    for (var i = 0; i < 4096; ++i) {
        s += buffer[i] + "<br>";
    }

    info.innerHTML = s;
}

Wave.prototype.displayWaveData = function() {
    var data = this.data;
    var n = data.length;

    var s = "";
    for (var i = 0; i < n; ++i) {
        s += data[i].toFixed(3) + "<br> ";
    }
    
    var info = document.getElementById("info");

    info.innerHTML = s;
}
