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

function Chorus(context) {
    this.context = context;
    // Create nodes for the input and output of this "module".
    var input = context.createGainNode();
    var output = context.createGainNode();
    
    var dryMix = context.createGainNode();
    var wetMix = context.createGainNode();
    var splitter = context.createChannelSplitter();
    var merger = context.createChannelMerger();
    var delayL = context.createDelayNode();
    var delayR = context.createDelayNode();
    var mix = context.createGainNode();
    
    // Connect input.
    input.connect(splitter);
    input.connect(dryMix);
    splitter.connect(delayL, 0, 0);
    splitter.connect(delayR, 1, 0);
    delayL.connect(merger, 0, 0);
    delayR.connect(merger, 0, 1);
    merger.connect(wetMix);
    
    // Connect final output.
    dryMix.connect(output);
    wetMix.connect(output);
    dryMix.gain.value = 1 / Math.sqrt(2);
    wetMix.gain.value = 1 / Math.sqrt(2);

    this.input = input;
    this.output = output;
    // this.output.gain.value = 0.5;
    
    this.splitter = splitter;
    this.merger = merger;
    this.delayL = delayL;
    this.delayR = delayR;
    
    this.setDelayTime(0.010);
    this.setDepth(0.95);
    this.setSpeed(0.75);
    
    this.curve1 = new Float32Array(65536);
    this.curve2 = new Float32Array(65536);
    this.generateCurves();
    
    this.schedule();
}

Chorus.prototype.setDelayTime = function(delayTime) {
    this.delayTime = delayTime
}

// 0 -> 1
Chorus.prototype.setDepth = function(depth) {
    this.depth = depth;
}

Chorus.prototype.setSpeed = function(cyclesPerSecond) {
    this.speed = cyclesPerSecond;
}

Chorus.prototype.generateCurves = function() {
    var delayTime = this.delayTime;
    var depth = this.depth;
    var curve1 = this.curve1;
    var curve2 = this.curve2;
    var n = curve1.length;
    
    for (var i = 0; i < n; ++i) {
        curve1[i] = delayTime + depth * delayTime * Math.sin(2 * Math.PI * i / n);
        curve2[i] = delayTime + depth * delayTime * Math.cos(2 * Math.PI * i / n);
    }
}

Chorus.prototype.schedule = function() {
    var startTime = this.context.currentTime + 0.050;
    var period = 1.0 / this.speed;
    
    for (var i = 0; i < 100; ++i) {
        this.delayL.delayTime.setValueCurveAtTime(this.curve1, startTime + period * i, period);
        this.delayR.delayTime.setValueCurveAtTime(this.curve2, startTime + period * i, period);
    }
}
