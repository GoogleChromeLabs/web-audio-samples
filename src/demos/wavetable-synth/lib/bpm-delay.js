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

var times =
[
	1/8.,			// 32nd note
	(1/4.) * 2/3.,	// 16th note triplet
	(1/8.) * 3/2.,	// dotted 32nd note
	1/4.,			// 16th note
	(1/2.) * 2/3.,	// 8th note triplet
	(1/4.) * 3/2.,	// dotted 16th note
	1/2.,			// 8th note
	1   * 2/3.,		// quarter note triplet
	(1/2.) * 3/2.,	// dotted eighth note
	1,				// quarter note
	2   * 2/3.,		// half note triplet
	1   * 3/2.,		// dotted quarter note
	2				// half note
];

function BpmDelay(context) {
    this.delay = context.createDelay();
    this.context = context;
    this.tempo = 120;
    this.noteDivision = times[6];
    
    this.updateDelayTime();
}

BpmDelay.prototype.setTempo = function(tempo) {
    this.tempo = tempo;
    this.updateDelayTime();
}

BpmDelay.prototype.setDelayValue = function(v) {
    var i = 6;
    
    if (v == "32nd note") {
        i = 0;
    } else if (v == "16th note triplet") {
        i = 1;
    } else if (v == "dotted 32nd note") {
        i = 2;
    } else if (v == "16th note") {
        i = 3;
    } else if (v == "8th note triplet") {
        i = 4;
    } else if (v == "dotted 16th note") {
        i = 5;
    } else if (v == "8th note") {
        i = 6;
    } else if (v == "quarter note triplet") {
        i = 7;
    } else if (v == "dotted eighth note") {
        i = 8;
    } else if (v == "quarter note") {
        i = 9;
    }  else {
        alert("bad BPM index");
    }
    
    this.setDelayIndex(i);
}

BpmDelay.prototype.setDelayIndex = function(i) {
    this.noteDivision = times[i];
    this.updateDelayTime();
}

BpmDelay.prototype.updateDelayTime = function() {
    var delayTime = 0.37299 / 44100.0 + 60 * this.noteDivision / this.tempo;
    this.delay.delayTime.value = delayTime;
}
