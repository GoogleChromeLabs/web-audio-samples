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

function Chorus(context) {
    this.context = context;
    // Create nodes for the input and output of this "module".
    var input = context.createGain();
    var output = context.createGain();
    var feedbackInput = context.createGain();

    // Feedback
    var feedback = context.createGain();
    this.feedback = feedback;
    feedback.gain.value = 0.9999;
    
    output.connect(feedback);
    feedback.connect(feedbackInput);
    
    var dryMix = context.createGain();
    var wetMix = context.createGain();
    var splitter = context.createChannelSplitter();
    var merger = context.createChannelMerger();
    var delayL = context.createDelay();
    var delayR = context.createDelay();
    var mix = context.createGain();
        
    // Connect input.
    input.connect(feedbackInput);
    feedbackInput.connect(splitter);
    input.connect(dryMix);
    splitter.connect(delayL, 0, 0);
    splitter.connect(delayR, 1, 0);
    delayL.connect(merger, 0, 0);
    delayR.connect(merger, 0, 1);
    merger.connect(wetMix);

    var rate = .1;
    var osc1 = context.createOscillator();
    var osc2 = context.createOscillator();
    osc1.type = "triangle";
    osc2.type = "triangle";
    osc1.frequency.value = rate;
    osc2.frequency.value = rate;
    osc1.start(0);
    osc2.start(0);

    var delay = 0.5;
    var depth = 0.4;
    var oscGain1 = context.createGain();
    var oscGain2 = context.createGain();
    oscGain1.gain.value = depth;
    oscGain2.gain.value = -depth;
    osc1.connect(oscGain1);
    osc2.connect(oscGain2);
    
    delayL.delayTime.value = delay;
    delayR.delayTime.value = delay;
    oscGain1.connect(delayL.delayTime);
    oscGain2.connect(delayR.delayTime);
    
    // Connect final output.
    dryMix.connect(output);
    wetMix.connect(output);
    dryMix.gain.value = 1 / Math.sqrt(2);
    wetMix.gain.value = 1 / Math.sqrt(2);

    this.input = input;
    this.output = output;

    this.splitter = splitter;
    this.merger = merger;
    this.delayL = delayL;
    this.delayR = delayR;
}

Chorus.prototype.setDelayTime = function(delayTime) {
    this.delayTime = delayTime
}

// 0 -> 1
Chorus.prototype.setDepth = function(depth) {
    // FIXME!
    this.depth = depth;
}

Chorus.prototype.setSpeed = function(cyclesPerSecond) {
    // FIXME!
    this.speed = cyclesPerSecond;
}
