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

function WaveTable(name, context) {
    this.name = name;
    this.context = context;
    this.sampleRate = context.sampleRate;
    this.url = "wave-tables/" + this.name;
    this.waveTableSize = 4096; // hard-coded for now
    this.buffer = 0;
    this.numberOfResampleRanges = kDefaultNumberOfResampleRanges;
}

WaveTable.prototype.getWaveDataForPitch = function(pitchFrequency) {
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

WaveTable.prototype.getNumberOfPartialsForRange = function(j) {
	// goes from 1024 -> 4 @ 44.1KHz (and do same for 48KHz)
	// goes from 2048 -> 8 @ 96KHz
	var npartials = Math.pow(2, 1 + this.numberOfResampleRanges - j);
	if (this.getSampleRate() > 48000.0)
	    npartials *= 2;  // high sample rate allows more harmonics at given fundamental
	
	return npartials;
}

WaveTable.prototype.getWaveTableSize = function() {
    return this.waveTableSize;
}

WaveTable.prototype.getSampleRate = function() {
    return this.sampleRate;
}

WaveTable.prototype.getRateScale = function() {
    return this.getWaveTableSize() / this.getSampleRate();
}

WaveTable.prototype.getNumberOfResampleRanges = function() {
    this.numberOfResampleRanges;
}

WaveTable.prototype.getName = function() {
    return this.name;
}

WaveTable.prototype.load = function(callback) {
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
        
        wave.createBuffers();
        if (callback)
            callback(wave);
    };

    request.onerror = function() {
        alert("error loading: " + wave.url);
    };

    request.send();
}

WaveTable.prototype.print = function() {
    var f = this.frequencyData;

    var info = document.getElementById("info");
    
    var s = "";
    for (var i = 0; i < 2048; ++i) {
        s += "{" + f.real[i] + ", " + f.imag[i] + "}, <br>";
    }

    info.innerHTML = s;
}

WaveTable.prototype.printBuffer = function(buffer) {
    var info = document.getElementById("info");
    
    var s = "";
    for (var i = 0; i < 4096; ++i) {
        s += buffer[i] + "<br>";
    }

    info.innerHTML = s;
}

// WaveTable.prototype.createBuffers = function() {
//     var f = this.frequencyData;
//     
//     var n = 4096;
//     
//     var fft = new FFT(n, 44100);
//         
//     // Copy from loaded frequency data and scale.
//     for (var i = 0; i < n / 2; ++i) {
//         fft.real[i] = 4096 * f.real[i];
//         fft.imag[i] = 4096 * f.imag[i];
//     }
// 
//     // Now do inverse FFT
//     this.data = fft.inverse();
//     var data = this.data;
//     
//     this.buffer = context.createBuffer(1, data.length, 44100);
//     
//     // Copy data to the buffer.
//     var p = this.buffer.getChannelData(0);
//     for (var i = 0; i < data.length; ++i) {
//         p[i] = data[i];
//     }
// }

// Convert into time-domain wave tables.
// We actually create several of them for non-aliasing playback at different playback rates.
WaveTable.prototype.createBuffers = function() {
	// resample ranges
	//
	// let's divide up versions of our waves based on the maximum fundamental frequency we're
	// resampling at.  Let's use fundamental frequencies based on dividing Nyquist by powers of two.
	// For example for 44.1KHz sample-rate we have:
	//
	//		ranges
	//		----------------------------------
	//		21Hz, 43Hz, 86Hz, 172Hz, 344Hz, 689Hz, 1378Hz, 2756Hz, 5512Hz, 11025Hz, 22050Hz               <-- 44.1KHz
	//		23Hz, 47Hz, 94Hz, 187Hz, 375Hz, 750Hz, 1500Hz, 3000Hz, 6000Hz, 12000Hz, 24000Hz, 48000Hz      <-- 96KHz
	//
	// and number of partials:
	//
	//      1024, 512,  256,  128,    64,    32,    16,     8,       4,      2,       1
	//		2048, 1024, 512,  256,   128,    64,    32,    16,       8,      4,       2,     1
	//
	// But it's probably OK if we skip the very highest fundamental frequencies and only
	// go up to 5512Hz, so we have a total of 9 resample ranges
	//
	//      0      1     2     3      4       5     6       7        8

	// The FFT size needs to be at least 2048 @ 44.1KHz and 4096 @ 96KHz
	//
	// So let's try to use FFT size of 4096 all the time and pull out the harmonics we want
	//
	
	this.buffers = new Array();
	
	var finalScale = 1.0;

	for (var j = 0; j < this.numberOfResampleRanges; ++j) {
        var n = this.waveTableSize;
        var frame = new FFT(n, this.sampleRate);

        // Copy from loaded frequency data and scale.
        var f = this.frequencyData;
        var scale = n;
        for (var i = 0; i < n / 2; ++i) {
            frame.real[i] = scale * f.real[i];
            frame.imag[i] = scale * f.imag[i];
        }

		var realP = frame.real;
		var imagP = frame.imag;

		// Find the starting bin where we should start clearing out
		// (we need to clear out the highest frequencies to band-limit the waveform)
		var fftSize = n;
		var halfSize = fftSize / 2;

		var npartials = this.getNumberOfPartialsForRange(j);

		// Now, go through and cull out the aliasing harmonics...
		for (var i = npartials + 1; i < halfSize; i++) {
			realP[i] = 0.0;
			imagP[i] = 0.0;
		}
		// Clear packed-nyquist if necessary
		if (npartials < halfSize)
			imagP[0] = 0.0;

		// Clear any DC-offset
		realP[0] = 0.0;

        // For the first resample range, find power and compute scale.
        if (j == 0) {
            var power = 0;
            for (var i = 1; i < halfSize; ++i) {
                x = realP[i];
                y = imagP[i];
                power += x * x + y * y;
            }
            power = Math.sqrt(power) / fftSize;
            
            finalScale = 0.5 / power;

            // window.console.log("power = " + power);
        }

		// Great, now do inverse FFT into our wavetable...
        var data = frame.inverse();

        // Create mono AudioBuffer.
        var buffer = this.context.createBuffer(1, data.length, this.sampleRate);
        
        // Copy data to the buffer.
        var p = buffer.getChannelData(0);
        for (var i = 0; i < data.length; ++i) {
            p[i] = finalScale * data[i];
        }

		this.buffers[j] = buffer;
	}
}

WaveTable.prototype.displayWaveData = function() {
    var data = this.data;
    var n = data.length;

    var s = "";
    for (var i = 0; i < n; ++i) {
        s += data[i].toFixed(3) + "<br> ";
    }
    
    var info = document.getElementById("info");

    info.innerHTML = s;
}
