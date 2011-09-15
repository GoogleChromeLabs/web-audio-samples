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

var threshold = -24; // dB
var headroom = 21; // dB

function e4(x, k)
{
    return 1.0 - Math.exp(-k * x);
}

function dBToLinear(db) {
    return Math.pow(10.0, 0.05 * db);
}

function shape(x) {
    var linearThreshold = dBToLinear(threshold);
    var linearHeadroom = dBToLinear(headroom);
    
    var maximum = 1.05 * linearHeadroom * linearThreshold;
    var kk = (maximum - linearThreshold);
    
    var sign = x < 0 ? -1 : +1;
    var absx = Math.abs(x);
    
    var shapedInput = absx < linearThreshold ? absx : linearThreshold + kk * e4(absx - linearThreshold, 1.0 / kk);
    shapedInput *= sign;
    
    return shapedInput;
}

function generateColortouchCurve(curve) {
    var n = 65536;
    var n2 = n / 2;
    
    for (var i = 0; i < n2; ++i) {
        x = i / n2;
        x = shape(x);
        
        curve[n2 + i] = x;
        curve[n2 - i - 1] = -x;
    }
    
    return curve;
}

function WaveShaper(context) {
    this.context = context;
    var waveshaper = context.createWaveShaper();
    var preGain = context.createGainNode();
    var postGain = context.createGainNode();
    preGain.connect(waveshaper);
    waveshaper.connect(postGain);
    this.input = preGain;
    this.output = postGain;
    
    var curve = new Float32Array(65536); // FIXME: share across instances
    generateColortouchCurve(curve);
    waveshaper.curve = curve;
}

WaveShaper.prototype.setDrive = function(drive) {
    this.input.gain.value = drive;
    var postDrive = Math.pow(1 / drive, 0.6);
    this.output.gain.value = postDrive;
}
