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

function decibelsToLinear(db) {
    return Math.pow(10.0, 0.05 * db);
}

function linearToDecibels(x) {
    return 20.0 * Math.log(x) / Math.LN10;
}

function Colortouch() {
}

Colortouch.prototype.setParams = function(dbThreshold, dbKnee, ratio, makeupGain) {
    // Update curve state.
    var linearThreshold = decibelsToLinear(dbThreshold);
    var linearKnee = decibelsToLinear(dbKnee);
    
    this.linearThreshold = linearThreshold;
    this.thresholdDb = dbThreshold;
    this.kneeDb = dbKnee;


    // Makeup gain.
    var maximum = 1.05 * linearKnee * linearThreshold;

    // Compute knee threshold.
    this.ratio = ratio;
    this.slope = 1 / this.ratio;

    this.k = this.kAtSlope(1 / this.ratio);
    // console.log("k = " + k);

    this.kneeThresholdDb = dbThreshold + this.kneeDb;
    this.kneeThreshold = decibelsToLinear(this.kneeThresholdDb);
    
    this.ykneeThresholdDb = linearToDecibels(this.saturateBasic(this.kneeThreshold, this.k));
}

// Approximate 1st derivative with input and output expressed in dB.
// This slope is equal to the inverse of the compression "ratio".
// In other words, a compression ratio of 20 would be a slope of 1/20.
Colortouch.prototype.slopeAt = function(x, k) {
    if (x < this.linearThreshold)
        return 1;
        
    var x2 = x * 1.001;

    var xDb = linearToDecibels(x);
    var x2Db = linearToDecibels(x2);

    var yDb = linearToDecibels(this.saturateBasic(x, k));
    var y2Db = linearToDecibels(this.saturateBasic(x2, k));

    var m = (y2Db - yDb) / (x2Db - xDb);

    return m;
}

Colortouch.prototype.kAtSlope = function(slope) {
    var xDb = this.thresholdDb + this.kneeDb;
    var x = decibelsToLinear(xDb);

    var minK = 0.1;
    var maxK = 10000;
    var k = 5;

    // Approximate.
    for (var i = 0; i < 15; ++i) {
        var m = this.slopeAt(x, k);
        
        // console.log("slope = " + slope + " : m = " + m + " : k = " + k);

        if (m < slope) {
            // k is too high.
            maxK = k;
            k = Math.sqrt(minK * maxK);
        } else {
            // k is not high enough.
            minK = k;
            k = Math.sqrt(minK * maxK);
        }
    }

    return k;
}

// Exponential saturation curve.
Colortouch.prototype.saturateBasic = function(x, k) {
    if (x < this.linearThreshold)
        return x;
    
    return this.linearThreshold + (1 - Math.exp(-k * (x  - this.linearThreshold))) / k;
}

Colortouch.prototype.saturate = function(x) {
    var y;
    
    if (x < this.kneeThreshold) {
        y = this.saturateBasic(x, this.k);
    } else {
        var xDb = linearToDecibels(x);
        var yDb = this.ykneeThresholdDb + this.slope * (xDb - this.kneeThresholdDb);
    
        y = decibelsToLinear(yDb);
    }
    
    return y;
}

function generateHardClipCurve(curve, k) {
    var n = 65536;
    var n2 = n / 2;
    
    for (var i = 0; i < n2; ++i) {
        x = i / n2;
        x = k*x;
        
        if (x > 1) x = 1;
        if (x < -1) x = -1;
        
        curve[n2 + i] = x;
        curve[n2 - i - 1] = -x;
    }
    
    return curve;
}

function generateColortouchCurve(curve) {
    var colortouch = new Colortouch();
    // colortouch.setParams(-24, 30, 12, 0);
    colortouch.setParams(-10, 20, 30, 0);

    var n = 65536;
    var n2 = n / 2;
    
    for (var i = 0; i < n2; ++i) {
        x = i / n2;
        x = colortouch.saturate(x);

        curve[n2 + i] = x;
        curve[n2 - i - 1] = -x;
    }
    
    return curve;
}

function WaveShaper(context) {
    this.context = context;
    
    var waveshaper = context.createWaveShaper();
    var preGain = context.createGain();
    var postGain = context.createGain();
    preGain.connect(waveshaper);
    waveshaper.connect(postGain);
    this.input = preGain;
    this.output = postGain;
    
    var curve = new Float32Array(65536); // FIXME: share across instances
    generateColortouchCurve(curve);
    waveshaper.curve = curve;

    // Oversample for high-quality, anti-aliased.
    if (waveshaper.hasOwnProperty("oversample"))
        waveshaper.oversample = "4x";
}

WaveShaper.prototype.setDrive = function(drive) {
    this.input.gain.value = drive;
    var postDrive = Math.pow(1 / drive, 0.6);
    this.output.gain.value = postDrive;
}
