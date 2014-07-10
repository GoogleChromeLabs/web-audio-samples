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

var kSpeed = 0.05;
var kPitch = 0.0;
var kDiffusionRandomization = 0.05;
var kPanningRandomization = 0.15;
var kPitchRandomization = 0.0;
var kTimeRandomization = 0.0;
var kGrainDuration = 0.080;

function Granular(context, finalMix, convolver, delay) {
    this.context = context;
    this.finalMix = finalMix;
    this.convolver = convolver;
    this.delay = delay;

    // Create a granular synthesis "grain window"
    // Each small audio snippet will have a smooth fade-in / fade-out according to this shape.
    var grainWindowLength = 16384;
    var linearWindow = new Float32Array(grainWindowLength);
    var equalPowerWindow = new Float32Array(grainWindowLength);
    for (var i = 0; i < grainWindowLength; ++i) {
        var x = Math.sin(Math.PI * i / grainWindowLength);
        equalPowerWindow[i] = x;

        var linear = i < grainWindowLength/2 ? i / (grainWindowLength/2) : 1 - (i - grainWindowLength/2) / (grainWindowLength/2);
        linearWindow[i] = linear;
    }
        
    this.linearWindow = linearWindow;
    this.equalPowerWindow = equalPowerWindow;
    
    this.buffer = 0;

    this.speed = 1;
    this.pitch = 0;
    this.timeRandomization = kTimeRandomization;
    this.pitchRandomization = kPitchRandomization;
    this.panningRandomization = 0; //kPanningRandomization;
    this.diffusionRandomization = kDiffusionRandomization;
    this.grainTime = 0.0;
    this.realTime = -1; // uninitialized
    this.grainDuration = kGrainDuration;
    this.grainSpacing = 0.5 * kGrainDuration;
    
    this.crossings = new Float32Array(16384);
    this.avePeriodTime = new Float32Array(16384);
    this.longAvePeriodTime = new Float32Array(16384);
    this.averageDuration = 0.090;
    this.aveDelta = 0;
}

Granular.prototype.setBuffer = function(buffer) {
    this.buffer = buffer;
    this.findZeroCrossings();
}

Granular.prototype.findZeroCrossings = function() {
    var crossings = this.crossings;
    var avePeriodTime = this.avePeriodTime;
    var longAvePeriodTime = this.longAvePeriodTime;
    var buffer = this.buffer;
    var n = buffer.length;
    var sampleRate = buffer.sampleRate;

    var j = 0;

    // Assume stereo.
    var pL = buffer.getChannelData(0);
    var pR = buffer.getChannelData(1);
    var last = 0;
    var lastIndex = 0;
    
    var negPeak = 0;
    var posPeak = 0;
    var aveNegPeak = 0;
    var avePosPeak = 0;

    var crossingIndex = 0;
    
    for (var i = 0; i < n; ++i) {
        var sample = 0.5 * (pL[i] + pR[i]);

        if (last < 0 && sample > 0) {
            // Positive crossing.
            if (negPeak < 0.5 * aveNegPeak) {
                crossingIndex = i;
                negPeak = 0;
            }
        } else if (last > 0 && sample < 0) {
            // Negative crossing.
            var delta = j==0 ? 10000 : crossingIndex - crossings[j - 1];
            
            if (posPeak > 0.5 * avePosPeak && crossingIndex != -1 && delta > 128) {
                crossings[j] = crossingIndex;

                // if (j < 1000)
                //     console.log("i: " + i + "   deltaIndex: " + deltaIndex);
                // var deltaIndex = i - lastIndex;
                // lastIndex = i;

                j++;

                posPeak = 0;

            }
        }

        if (sample > posPeak)
            posPeak = sample;
        if (sample < negPeak)
            negPeak = sample;

        if (sample > avePosPeak)
            avePosPeak = sample;
        if (sample < aveNegPeak)
            aveNegPeak = sample;

        // Decay
        avePosPeak *= 0.999;
        aveNegPeak *= 0.999;

        last = sample;

        if (j >= crossings.length)
            break;
    }

    console.log("Final j: " + j);
    
    this.zeroCrossingIndex = 0;
    this.zeroCrossingSize = j;
    
    
    var ave = (crossings[1] - crossings[0]) / sampleRate;;
    var ave2 = (crossings[1] - crossings[0]) / sampleRate;;
    for (var i = 1; i < j - 1; ++i) {
        avePeriodTime[i - 1] = ave;
        longAvePeriodTime[i - 1] = ave2;
        var target = (crossings[i + 1] - crossings[i]) / sampleRate;
        ave += (target - ave) * 0.2;
        ave2 += (target - ave2) * 0.01;
    }
    avePeriodTime[j - 2] = ave;
    avePeriodTime[j - 1] = ave;

    longAvePeriodTime[j - 2] = ave2;
    longAvePeriodTime[j - 1] = ave2;
}

Granular.prototype.scheduleGrain = function() {
    var buffer = this.buffer;
    var context = this.context;
    var finalMix = this.finalMix;
    var convolver = this.convolver;
    if (!buffer)
        return;
        
    var source = context.createBufferSource();
    source.buffer = buffer;
    
    var r = Math.random();
    var r2 = Math.random();
    var r3 = Math.random();
    var r4 = Math.random();
    var r5 = Math.random();
    r1 = (r - 0.5) * 2.0;
    r2 = (r2 - 0.5) * 2.0;
    r3 = (r3 - 0.5) * 2.0;
    r4 = (r4 - 0.5) * 2.0;

    var dryGainNode = context.createGain();
    var wetGainNode = context.createGain();
    wetGainNode.gain.value = 0.5 * this.diffusionRandomization * r5;
    dryGainNode.gain.value = 1.0 - wetGainNode.gain.value;

    // Pitch
    var totalPitch = this.pitch + r1 * this.pitchRandomization;
    var pitchRate = Math.pow(2.0, totalPitch / 1200.0);
    source.playbackRate.value = pitchRate;

    // Create a gain node with a special "grain window" shaping curve.
    var grainWindowNode = context.createGain();
    source.connect(grainWindowNode);

    if (this.panningRandomization > 0) {
        // Spatialization
        var panner = context.createPanner();
        grainWindowNode.connect(panner);

        var distance = 2.0;
        var azimuth = Math.PI * this.panningRandomization * r3;
        var elevation = Math.PI * this.panningRandomization * r4;

        var x = Math.sin(azimuth);
        var z = Math.cos(azimuth);
        var y = Math.sin(elevation);
        var scaleXZ = Math.cos(elevation);

        x *= distance * scaleXZ;
        y *= distance;
        z *= distance * scaleXZ;

        panner.panningModel = webkitAudioPannerNode.HRTF;
        panner.setPosition(x, y, z);

    
        // Connect dry mix
        panner.connect(dryGainNode);
        panner.connect(wetGainNode);
    } else {
        grainWindowNode.connect(dryGainNode);
        grainWindowNode.connect(wetGainNode);
    }

    dryGainNode.connect(finalMix);
    
    // Connect wet mix
    wetGainNode.connect(convolver);

    // Time randomization
    var randomGrainOffset = r2 * this.timeRandomization;
    
    // Schedule sound grain

    var scaledGrainDuration = this.grainDuration;

    var grainSpacing = -1;

    var sampleRate = buffer.sampleRate;
    var crossings = this.crossings;
    var avePeriodTime = this.avePeriodTime;
    var longAvePeriodTime = this.longAvePeriodTime;
    
    var d = 0;
    var goal = pitchRate * this.grainDuration;

    var avePeriod = avePeriodTime[this.zeroCrossingIndex];
    var longAvePeriod = longAvePeriodTime[this.zeroCrossingIndex];
    // var avePeriod = this.aveDelta / sampleRate;
    if (avePeriod < 0.009 || longAvePeriod < 0.010) {
        goal *= 2;
//        console.log("*** ");
    }
    
    if (avePeriod > 0.012) {
//        console.log("^^^");
        goal = 2 * avePeriod;
    }
    
//    console.log(avePeriod + " ::: " + longAvePeriod);        
    
    var sum = 0;
    var offset = 1;
    for (var i = this.zeroCrossingIndex; i < this.zeroCrossingSize; ++i) {
        offset++;
        sum += avePeriodTime[i];
        if (sum < goal)
            scaledGrainDuration = sum;
        if (sum > goal)
            break;
    }
    
    var spacing = 0.5 * scaledGrainDuration * this.speed / pitchRate;

        var i2 = this.zeroCrossingIndex + 1;
        var delta2 = crossings[i2] - crossings[i2-1];
        this.aveDelta += (delta2 - this.aveDelta) * 0.1;
        if (isNaN(this.aveDelta)) this.aveDelta = delta2;
    // console.log("*** " + this.aveDelta);

    source.start(this.realTime, this.grainTime + randomGrainOffset, scaledGrainDuration);

    // Schedule the grain window.
    // This applies a time-varying gain change for smooth fade-in / fade-out.
    var windowDuration = scaledGrainDuration / pitchRate;
    var window = Math.abs(totalPitch) < 200 ? this.linearWindow : this.equalPowerWindow;
    
    grainWindowNode.gain.value = 0.0; // make default value 0
    grainWindowNode.gain.setValueCurveAtTime(window, this.realTime, windowDuration);

    // Update time params.
    if (grainSpacing == -1)
        grainSpacing = 0.5 * windowDuration;

    var oldGrainTime = this.grainTime;

    this.realTime += grainSpacing;
    this.grainTime += this.speed * grainSpacing;

    if (this.grainTime > buffer.duration)
        this.grainTime -= buffer.duration;
    if (this.grainTime < 0.0)
        this.grainTime += buffer.duration; // backwards wrap-around

    // Track zero-crossings.
    if (this.zeroCrossingIndex >= this.zeroCrossingSize - 1)
        this.zeroCrossingIndex = 0;
    var z = this.zeroCrossingIndex;
    var grainSampleFrame = sampleRate * this.grainTime;
    while (crossings[z]  < grainSampleFrame) {
        z++;
        if (z >= this.zeroCrossingSize) {
            z = 0;
            break;
        }
    }
    
    this.zeroCrossingIndex = z;
}

Granular.prototype.schedule = function() {
    var currentTime = this.context.currentTime;
    if (this.realTime == -1)
        this.realTime = currentTime;

    while (this.realTime < currentTime + 0.100)
        this.scheduleGrain();
}

Granular.prototype.setSpeed = function(param) {
    this.speed = param;
}

Granular.prototype.setPitch = function(cents) {
    this.pitch = cents;
}

Granular.prototype.setGrainSize = function(grainDuration) {
    this.grainDuration = grainDuration;
    // this.grainSpacing = 0.25 * grainDuration;
    this.grainSpacing = 0.5 * grainDuration;
    console.log("grainDuration: " + grainDuration);
}

Granular.prototype.setPanningRandomization = function(r) {
    this.panningRandomization = r;
}

Granular.prototype.setDiffusionRandomization = function(r) {
    this.diffusionRandomization = r;
}

function diffusionRandomizationHandler(event, ui) {
    diffusionRandomization = parseFloat(ui.value);

    var info = document.getElementById("diffusionRandomization-value");
    info.innerHTML = "diffusionRandomization = " + diffusionRandomization*100.0 + "%";
}

function pitchRandomizationHandler(event, ui) {
    var cents = parseFloat(ui.value);
    pitchRandomization = cents;

    var info = document.getElementById("pitchRandomization-value");
    info.innerHTML = "pitchRandomization = " + cents + " cents";
}

function timeRandomizationHandler(event, ui) {
    timeRandomization = parseFloat(ui.value);

    var info = document.getElementById("timeRandomization-value");
    info.innerHTML = "timeRandomization = " + timeRandomization + " seconds";
}

