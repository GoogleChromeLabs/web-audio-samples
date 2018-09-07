// Copyright 2012, Google Inc.
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

function ADSR(param, a, d, s, r, minValue, maxValue) {
    this.param = param;
    
    if (s <= 0)
        s = 0.0000001;

    this.a = a;
    this.d = d;
    this.s = s;
    this.r = r;
    this.minValue = minValue;
    this.maxValue = maxValue;
}

ADSR.prototype.trigger = function(time) {
    this.triggerTime = time;

    var param = this.param;
    
    param.setValueAtTime(this.minValue, time);
    time += this.a;
    
    param.linearRampToValueAtTime(this.maxValue, time);
    time += this.d;
    
    var sustainValue = this.s;
    
    // console.log(sustainValue);
    
    param.exponentialRampToValueAtTime(sustainValue, time);
    this.sustainTime = time;
}

ADSR.prototype.release = function(time) {
    var releaseTime = time > this.sustainTime ? time : this.sustainTime;

    // this.param.cancelScheduledValues(0); // !!!!!!
    this.param.setTargetAtTime(this.minValue, releaseTime, this.r);
}

function createUnitySource(context) {
    var buffer = context.createBuffer(1, 128, context.sampleRate);
    var p = buffer.getChannelData(0);
    
    for (var i = 0; i < 128; ++i)
        p[i] = 1;

    var source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.start(0);
    
    return source;
}

// ControlSignal is a simple class generating an audio-rate control value.
// Normally this is a constant, but can be controlled via some UI (knob, slider, ...)
// to feed multiple AudioParams.
function ControlSignal(context, unitySource, initialValue) {
    this.output = context.createGain();
    this.output.gain.value = initialValue;
    unitySource.connect(this.output);
}

ControlSignal.prototype.setValue = function(value, timeConstant) {
    if (timeConstant === undefined)
        timeConstant = 0.020;
        
    // this.output.gain.value = value;
    this.output.gain.setTargetAtTime(value, 0, timeConstant);
}
